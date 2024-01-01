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

class AutoConnectPopup extends StatefulWidget {
  const AutoConnectPopup({Key? key}) : super(key: key);

  @override
  State<AutoConnectPopup> createState() => _AutoConnectPopupState();
}

class _AutoConnectPopupState extends State<AutoConnectPopup> {
  final bm_racing_appBluetoothService bluetoothService =
      bm_racing_appBluetoothService();

  bool _autoConnectStarted = false;
  bool _isConnecting = false;
  bool _completed = false;

  @override
  void initState() {
    super.initState();
  }

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

      if (lastDeviceId == null || lastRaceId != raceId) {
        // Nesedí => zrušíme (uživatel musí ručně)
        _maybePop("cancel");
        return;
      }

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

    _maybePop("success");

    Future.microtask(() {
      Navigator.of(context, rootNavigator: true).push(
        MaterialPageRoute(builder: (_) => targetPage),
      );
    });
  }

  void _maybePop(String result) {
    if (_completed) return;
    _completed = true;
    if (mounted) {
      Navigator.of(context).pop(result);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!_autoConnectStarted) {
      _autoConnectStarted = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _startAutoConnect();
      });
    }

    return PopScope(
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
                  'assets/loading.json',
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
              _maybePop("cancel");
            },
            child: const Text("Vybrat jiný"),
          ),
        ],
      ),
    );
  }
}
