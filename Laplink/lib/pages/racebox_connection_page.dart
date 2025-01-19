import 'dart:async';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter_blue_plus/flutter_blue_plus.dart';
import 'package:laplink/components/bluetooth_device_list.dart';
import 'package:laplink/pages/race%20pages/race_page.dart';
import 'package:laplink/pages/race%20pages/training_qualification_page.dart';
import 'package:laplink/services/bluetooth_service.dart';
import 'package:laplink/services/preferences_service.dart';
import 'package:laplink/utils/battery_helper.dart';
import 'package:lottie/lottie.dart';
import 'package:fluttertoast/fluttertoast.dart';

class RaceStartPage extends StatefulWidget {
  const RaceStartPage({super.key});

  @override
  _RaceStartPageState createState() => _RaceStartPageState();
}

class _RaceStartPageState extends State<RaceStartPage> {
  final LaplinkBluetoothService bluetoothService = LaplinkBluetoothService();
  final PreferencesService preferencesService = PreferencesService();
  final BatteryHelper batteryHelper = BatteryHelper();

  List<BluetoothDevice> devicesList = [];
  BluetoothDevice? connectedDevice;
  BluetoothCharacteristic? txCharacteristic;
  bool isScanning = false;
  bool isBluetoothEnabled = false;
  bool _navigatingToRacePage = false;
  StreamSubscription<BluetoothAdapterState>? bluetoothStateSubscription;
  Timer? disconnectTimer;

  /// Baterie
  int batteryLevel = 100;
  bool isCharging = false;
  bool isBatteryLevelKnown = false;

  /// Další proměnné
  int? eventPhaseId;
  int? raceId;
  List<int> buffer = [];
  Map<String, dynamic> decodedData = {};
  String rawPacket = "";
  late StreamSubscription<List<int>> _notificationSubscription;
  bool canCheckBattery = false;

  /// 1) CHANGES: Přidaná proměnná určující, zda zrovna probíhá připojování
  bool isConnecting = false;

  @override
  void initState() {
    super.initState();
    _loadPreferences();
    _listenToBluetoothState();
  }

  @override
  void dispose() {
    disconnectTimer?.cancel();
    bluetoothStateSubscription?.cancel();
    if (!_navigatingToRacePage && connectedDevice != null) {
      _disconnectDevice();
    }
    super.dispose();
  }

  Future<void> _loadPreferences() async {
    final prefs = await PreferencesService.getPreferences();
    setState(() {
      eventPhaseId = prefs.getInt('event_phase_id');
      raceId = prefs.getInt('race_id');
    });
  }

  void _listenToBluetoothState() {
    bluetoothStateSubscription = FlutterBluePlus.adapterState.listen((state) {
      final isEnabled = state == BluetoothAdapterState.on;
      if (isBluetoothEnabled != isEnabled) {
        setState(() {
          isBluetoothEnabled = isEnabled;
        });
        if (isEnabled) {
          _startScan();
        } else {
          devicesList.clear();
          _showMessage(
              'Bluetooth není zapnuto. Zapněte jej pro hledání zařízení.');
        }
      }
    });
  }

  /// -------------------------------------------------
  /// Zde zpracováváš data z Rx characteristic
  /// -------------------------------------------------
  void _processData() {
    if (buffer.length < 8) return;

    int startIndex = buffer.indexOf(0xB5);
    if (startIndex == -1 || startIndex + 6 >= buffer.length) {
      buffer.clear();
      return;
    }

    if (buffer[startIndex + 1] == 0x62) {
      int length = buffer[startIndex + 4] | (buffer[startIndex + 5] << 8);
      int packetSize = 6 + length + 2;

      if (startIndex + packetSize <= buffer.length) {
        Uint8List packet = Uint8List.fromList(
            buffer.sublist(startIndex, startIndex + packetSize));
        buffer = buffer.sublist(startIndex + packetSize);

        if (_validateChecksum(packet)) {
          setState(() {
            rawPacket = packet
                .map((byte) => byte.toRadixString(16).padLeft(2, '0'))
                .join(' ');
            _decodePacket(packet.sublist(6, 6 + length));
          });
        }
      }
    } else {
      buffer.removeAt(0);
    }
  }

  void _decodePacket(Uint8List payload) {
    if (payload.isEmpty) return;

    bool charging = (payload[67] & 0x80) != 0;
    int currentBatteryLevel = payload[67] & 0x7F; // spodních 7 bitů je level

    setState(() {
      isCharging = charging;
      batteryLevel = currentBatteryLevel;
      isBatteryLevelKnown = true;
    });

    if (canCheckBattery && currentBatteryLevel == 0 && isBatteryLevelKnown) {
      _showMessage('Baterie je na 0%. Zařízení bude odpojeno.');
      _disconnectDevice();
      Fluttertoast.showToast(
        msg: 'Baterie je na 0%. Zařízení bude odpojeno.',
        toastLength: Toast.LENGTH_LONG,
        gravity: ToastGravity.TOP,
        backgroundColor: Colors.redAccent,
        textColor: Colors.white,
        fontSize: 16.0,
      );
    }
  }

  bool _validateChecksum(Uint8List packet) {
    int length = packet.length;
    int ckA = 0, ckB = 0;
    for (int i = 2; i < length - 2; i++) {
      ckA = (ckA + packet[i]) & 0xFF;
      ckB = (ckB + ckA) & 0xFF;
    }
    return ckA == packet[length - 2] && ckB == packet[length - 1];
  }

  Future<void> _startScan() async {
    if (!isBluetoothEnabled) {
      _showMessage('Bluetooth není zapnuto.');
      return;
    }

    setState(() {
      isScanning = true;
    });
    devicesList = await bluetoothService.scanForDevices();
    setState(() {
      isScanning = false;
    });
  }

  /// 2) CHANGES: Připojování nastavíme `isConnecting = true`,
  /// ať víme, že probíhá connect a můžeme zobrazit loader
  Future<void> _connectToDevice(BluetoothDevice device) async {
    setState(() {
      isConnecting = true;
    });

    // Pokud už je nějaké zařízení připojené, nejprve se odpojíme
    if (connectedDevice != null) {
      await _disconnectDevice();
    }

    try {
      txCharacteristic = await bluetoothService.connectToDevice(device);

      if (txCharacteristic != null) {
        setState(() {
          connectedDevice = device;
          isBatteryLevelKnown = false;
          // 3) CHANGES: Úspěšné připojení -> isConnecting = false
          isConnecting = false;
        });

        _startDisconnectTimer();
        _showMessage('Připojeno k ${device.platformName}');

        /// Odebírání notifikací
        _notificationSubscription =
            txCharacteristic!.lastValueStream.listen((data) {
          buffer.addAll(data);
          _processData();
        });

        Future.delayed(const Duration(seconds: 3), () {
          setState(() {
            canCheckBattery = true;
          });
        });
      } else {
        // Pokud se nepodařilo připojit
        setState(() {
          isConnecting = false;
        });
        _showMessage('Nepodařilo se připojit k ${device.platformName}');
      }
    } catch (e) {
      // Pokud došlo k chybě:
      setState(() {
        isConnecting = false;
      });
      _showMessage('Chyba při připojování: $e');
    }
  }

  Future<void> _disconnectDevice() async {
    if (connectedDevice != null) {
      await bluetoothService.disconnectFromDevice(connectedDevice!);
      setState(() {
        connectedDevice = null;
        txCharacteristic = null;
      });
    }
  }

  void _startDisconnectTimer() {
    disconnectTimer?.cancel();
    disconnectTimer = Timer(const Duration(minutes: 2), () {
      if (connectedDevice != null && mounted) {
        _disconnectDevice();
        _showMessage('Automaticky odpojeno z důvodu nečinnosti.');
      }
    });
  }

  void _cancelDisconnectTimer() {
    disconnectTimer?.cancel();
  }

  void _startRace() {
    if (connectedDevice != null && txCharacteristic != null) {
      _cancelDisconnectTimer();
      setState(() {
        _navigatingToRacePage = true;
      });
      _navigateToPhase();
    } else {
      _showMessage('Zařízení není připojeno.');
    }
  }

  void _navigateToPhase() {
    switch (eventPhaseId) {
      case 1:
      case 2:
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => TrainingQualificationPage(
              device: connectedDevice!,
              characteristic: txCharacteristic!,
            ),
          ),
        );
        break;
      case 3:
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => RacePage(
              device: connectedDevice!,
              characteristic: txCharacteristic!,
            ),
          ),
        );
        break;
      default:
        _showMessage('Neplatná fáze závodu.');
    }
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: const Text('Výběr RaceBoxu'),
        titleTextStyle: const TextStyle(
          fontSize: 18,
        ),
        backgroundColor: Theme.of(context).colorScheme.surface,
        actions: [
          if (connectedDevice != null)
            Row(
              children: [
                Icon(
                  isBatteryLevelKnown
                      ? batteryHelper.getBatteryIcon(batteryLevel, isCharging)
                      : Icons.battery_unknown,
                  color: isBatteryLevelKnown
                      ? batteryHelper.getBatteryColor(batteryLevel)
                      : Colors.grey,
                ),
                const SizedBox(width: 4),
                Text(
                  isBatteryLevelKnown ? '$batteryLevel%' : 'N/A',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: isBatteryLevelKnown
                        ? batteryHelper.getBatteryColor(batteryLevel)
                        : Colors.grey,
                  ),
                ),
              ],
            ),
          IconButton(
            icon: Icon(
              Icons.refresh,
              color: Theme.of(context).colorScheme.secondary,
            ),
            onPressed: _startScan,
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Vyberte váš RaceBox',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Theme.of(context).colorScheme.onSurface,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            if (!isBluetoothEnabled)
              Text(
                'Bluetooth není zapnuto. Zapněte jej pro hledání zařízení.',
                style: TextStyle(
                  fontSize: 16,
                  color: Theme.of(context).colorScheme.error,
                ),
                textAlign: TextAlign.center,
              )
            else if (isScanning)
              Center(
                child: Lottie.asset(
                  'assets/loading.json',
                  width: 150,
                  height: 150,
                  fit: BoxFit.contain,
                ),
              )
            else if (devicesList.isEmpty)
              Text(
                'Žádná zařízení nenalezena',
                style: TextStyle(
                  fontSize: 16,
                  color: Theme.of(context)
                      .colorScheme
                      .onSurface
                      .withAlpha((0.7 * 255).toInt()),
                ),
                textAlign: TextAlign.center,
              )
            else

              /// Zde se renderuje seznam zařízení a tlačítka "Connect"
              BluetoothDeviceList(
                devices: devicesList,
                onConnect: _connectToDevice,
              ),

            const SizedBox(height: 16),

            /// 4) CHANGES: Tlačítko "Odstartovat Jízdu!" se zobrazí jen,
            /// když je nějaké zařízení připojené. Loader se přidá JEN vedle textu.
            if (connectedDevice != null)
              ElevatedButton(
                // Až v momentě, kdy isConnecting == false, to může zavolat _startRace
                onPressed: isConnecting ? null : _startRace,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Theme.of(context).colorScheme.primary,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20.0,
                    vertical: 12.0,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(25.0),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Zachováme původní text beze změny
                    const Text(
                      'Odstartovat Jízdu!',
                      style: TextStyle(
                        fontSize: 18,
                        color: Colors.white,
                      ),
                    ),
                    // Pokud je isConnecting, zobrazíme malý loader vedle textu
                    if (isConnecting) ...[
                      const SizedBox(width: 12),
                      const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2.0,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}
