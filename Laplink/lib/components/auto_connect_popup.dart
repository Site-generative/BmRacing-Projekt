import 'package:flutter/material.dart';
import 'package:flutter_blue_plus/flutter_blue_plus.dart';
import 'dart:async';

// Vaše BLE service
import 'package:bm_racing_app/services/bluetooth_service.dart';
import 'package:bm_racing_app/services/preferences_service.dart';
import 'package:bm_racing_app/pages/racebox_connection_page.dart';
import 'package:bm_racing_app/pages/race%20pages/training_qualification_page.dart';
import 'package:bm_racing_app/pages/race%20pages/race_page.dart';
import 'package:lottie/lottie.dart';

/// Dialog (popup), který se pokusí automaticky připojit
/// k uloženému RaceBoxu pro daný raceId.
///
/// Chování:
/// - Pokud se auto-connect povede, rovnou otevře TrainingQualificationPage nebo RacePage
///   podle uloženého `event_phase_id`.
/// - Pokud se nepodaří, nebo uživatel zruší, dialog se zavře s výsledkem "cancel"/"error",
///   a volající kód (typicky v MenuRacePage) potom přejde do RaceStartPage.
class AutoConnectPopup extends StatefulWidget {
  const AutoConnectPopup({Key? key}) : super(key: key);

  @override
  State<AutoConnectPopup> createState() => _AutoConnectPopupState();
}

class _AutoConnectPopupState extends State<AutoConnectPopup> {
  final bm_racing_appBluetoothService bluetoothService =
      bm_racing_appBluetoothService();

  bool _autoConnectStarted = false; // aby se auto-connect volal jen jednou
  bool _isConnecting = false; // probíhá scanning + connect
  bool _completed = false; // zda už jsme dialog zavřeli

  @override
  void initState() {
    super.initState();
  }

  /// Spustí automatické připojení:
  /// 1) ověří, zda je last_connected_race_id == widget.raceId a existuje last_connected_device_id
  /// 2) pokud ano -> scanForDevices() -> connectToDevice()
  /// 3) pokud se povede -> otevře příslušnou RacePage
  /// 4) jinak popne dialog s "cancel"/"error"
  Future<void> _startAutoConnect() async {
    setState(() {
      _isConnecting = true;
    });

    try {
      final prefs = await PreferencesService.getPreferences();
      final lastDeviceId = prefs.getString('last_connected_device_id');
      final lastRaceId = prefs.getInt('last_connected_race_id');
      final raceId = prefs.getInt('race_id');
      final eventPhaseId = prefs.getInt('event_phase_id') ?? -1;

      // Ověříme, zda je pro STEJNÝ race a máme deviceId
      if (lastDeviceId == null || lastRaceId != raceId) {
        // Nesedí => zrušíme (uživatel musí ručně)
        _maybePop("cancel");
        return;
      }

      // Zkusíme naskenovat
      final foundDevices = await bluetoothService.scanForDevices();
      final matchingDevices = foundDevices
          .where((d) => d.remoteId.toString() == lastDeviceId)
          .toList();
      final targetDevice =
          matchingDevices.isNotEmpty ? matchingDevices.first : null;
      if (targetDevice == null) {
        // Device není v okolí
        _maybePop("cancel");
        return;
      }

      // Připojení
      final characteristic =
          await bluetoothService.connectToDevice(targetDevice);
      if (characteristic == null) {
        _maybePop("error");
        return;
      }

      // OK, máme connectedDevice + characteristic => jdeme do závodní stránky
      Future.delayed(
        const Duration(seconds: 2),
        () =>
            _navigateToPhaseAndPop(targetDevice, characteristic, eventPhaseId),
      );
    } catch (e) {
      debugPrint("AutoConnect - Chyba: $e");
      _maybePop("error");
    } finally {
      setState(() {
        _isConnecting = false;
      });
    }
  }

  /// Otevře příslušnou stránku (TrainingQualificationPage / RacePage)
  /// a zavře dialog s "success".
  void _navigateToPhaseAndPop(
    BluetoothDevice device,
    BluetoothCharacteristic characteristic,
    int phaseId,
  ) {
    Widget targetPage;
    switch (phaseId) {
      case 1:
      case 2:
        targetPage = TrainingQualificationPage(
          device: device,
          characteristic: characteristic,
        );
        break;
      case 3:
        targetPage = RacePage(
          device: device,
          characteristic: characteristic,
        );
        break;
      default:
        // fallback
        targetPage = const RaceStartPage();
    }

    // Zavřeme dialog s "success"
    _maybePop("success");

    // A poté otevřeme RacePage / QualiPage => pushReplacement
    Future.microtask(() {
      Navigator.of(context, rootNavigator: true).push(
        MaterialPageRoute(builder: (_) => targetPage),
      );
    });
  }

  /// Bezpečné zavření dialogu, pokud ještě nebyl zavřen
  void _maybePop(String result) {
    if (_completed) return;
    _completed = true;
    if (mounted) {
      Navigator.of(context).pop(result);
    }
  }

  @override
  Widget build(BuildContext context) {
    // Po prvním buildu (zobrazení) spustíme auto-connect
    if (!_autoConnectStarted) {
      _autoConnectStarted = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _startAutoConnect();
      });
    }

    return PopScope(
      // Zachytíme tlačítko zpět na telefonu => "cancel"
      canPop: true,
      child: AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        title: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              "Automatické napojování",
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            InkWell(
              onTap: () {
                // Klik na X => "cancel"
                _maybePop("cancel");
              },
              child: const Icon(Icons.close),
            ),
          ],
        ),
        content: SizedBox(
          width: 300,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                _isConnecting
                    ? "Probíhá automatické napojování na RaceBox..."
                    : "Čekám...",
              ),
              const SizedBox(height: 16),
              if (_isConnecting)
                Lottie.asset(
                  'assets/loading.json', // Cesta k vašemu Lottie souboru
                  width: 150,
                  height: 150,
                  fit: BoxFit.contain,
                ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () async {
              // Vymažeme uložené informace o předchozím RaceBoxu
              final prefs = await PreferencesService.getPreferences();
              await prefs.remove('last_connected_device_id');
              await prefs.remove('last_connected_race_id');
              // Poté zavoláme _maybePop("cancel")
              _maybePop("cancel");
            },
            child: const Text("Vybrat jiný"),
          ),
        ],
      ),
    );
  }
}
