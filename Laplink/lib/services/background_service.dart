import 'package:flutter/material.dart';
import 'package:flutter_background/flutter_background.dart';
import 'package:keep_screen_on/keep_screen_on.dart';
import 'package:lottie/lottie.dart';

class BackgroundService {
  final BuildContext context;

  BackgroundService({required this.context});

  Future<void> enableBackgroundExecution() async {
    const androidConfig = FlutterBackgroundAndroidConfig(
      notificationTitle: "Závodní aplikace běží na pozadí",
      notificationText: "Sbíráme data závodu",
      notificationImportance: AndroidNotificationImportance.high,
      notificationIcon:
          AndroidResource(name: 'background_icon', defType: 'drawable'),
    );

    bool hasPermissions = await FlutterBackground.hasPermissions;
    if (!hasPermissions) {
      hasPermissions =
          await FlutterBackground.initialize(androidConfig: androidConfig);
    }

    if (hasPermissions) {
      await FlutterBackground.enableBackgroundExecution();
    }
  }

  Future<void> disableBackgroundExecution() async {
    if (FlutterBackground.isBackgroundExecutionEnabled) {
      await FlutterBackground.disableBackgroundExecution();
    }
  }

  void showCalibrationDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return AlertDialog(
          backgroundColor: Theme.of(context).colorScheme.surface,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16.0),
          ),
          title: Text(
            "Kalibrace zařízení",
            style: TextStyle(
              color: Theme.of(context).colorScheme.onSurface,
              fontWeight: FontWeight.bold,
              fontSize: 20,
            ),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                "Probíhá kalibrace zařízení. Nehýbejte se prosím...",
                style: TextStyle(
                  color: Theme.of(context)
                      .colorScheme
                      .onSurface
                      .withAlpha((0.7 * 255).toInt()),
                  fontSize: 16,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 20),
              Lottie.asset(
                'assets/loading.json',
                width: 150,
                height: 150,
                fit: BoxFit.contain,
              ),
            ],
          ),
        );
      },
    );
  }

  void turnScreenOn() {
    KeepScreenOn.turnOn();
  }

  void turnScreenOff() {
    KeepScreenOn.turnOff();
  }
}
