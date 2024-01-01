import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'dart:io';
import 'package:permission_handler/permission_handler.dart';

/// Enum pro úrovně varování o stavu baterie
enum LevelOfDanger { warning, danger }

class BatteryHelper {
  int batteryLevel = 0;
  bool lowBatteryWarningShown = false;
  bool criticalBatteryWarningShown = false;
  bool canShowWarnings = false;

  Future<void> processBatteryData(Uint8List value,
      Function(int) onBatteryLevelUpdated, bool canShowToast) async {
    // Zajistíme, že data mají dostatečnou délku
    if (value.length > 67) {
      int rawBatteryData = value[67];
      int batteryLevel = (rawBatteryData & 0x7F);

      this.batteryLevel = batteryLevel; // Aktualizace interního stavu
      onBatteryLevelUpdated(batteryLevel); // Callback pro UI

      if (canShowToast) {
        checkAndShowBatteryWarnings(batteryLevel);
      } else {
        lowBatteryWarningShown = false;
        criticalBatteryWarningShown = false;
      }
    }
  }

  IconData getBatteryIcon(int batteryLevel, bool isCharging) {
    /*if (isCharging) {
      return Icons.battery_charging_full;
    }*/
    // Jinak vyber ikonu podle stavu kapacity
    if (batteryLevel >= 95) {
      return Icons.battery_full;
    } else if (batteryLevel >= 80) {
      return Icons.battery_6_bar;
    } else if (batteryLevel >= 60) {
      return Icons.battery_5_bar;
    } else if (batteryLevel >= 40) {
      return Icons.battery_4_bar;
    } else if (batteryLevel >= 20) {
      return Icons.battery_3_bar;
    } else if (batteryLevel >= 10) {
      return Icons.battery_2_bar;
    } else {
      // Pod 10 %
      return Icons.battery_alert;
    }
  }

  Color getBatteryColor(int batteryLevel) {
    if (batteryLevel >= 50) {
      return Colors.green;
    } else if (batteryLevel >= 25) {
      return Colors.orange;
    } else {
      return Colors.red;
    }
  }

  void showBatteryWarning(String message, LevelOfDanger dangerLevel) {
    Fluttertoast.showToast(
      msg: message,
      toastLength: Toast.LENGTH_LONG,
      gravity: ToastGravity.TOP,
      backgroundColor: dangerLevel == LevelOfDanger.warning
          ? Colors.orangeAccent
          : Colors.redAccent,
      textColor: Colors.white,
      fontSize: 16.0,
    );
  }

  void checkAndShowBatteryWarnings(int batteryLevel) {
    if (batteryLevel <= 10 && !criticalBatteryWarningShown) {
      criticalBatteryWarningShown = true;
      showBatteryWarning(
          "Varování: kritická úroveň baterie!", LevelOfDanger.danger);
    } else if (batteryLevel <= 20 && !lowBatteryWarningShown) {
      lowBatteryWarningShown = true;
      showBatteryWarning("Varování: baterie je vybitá!", LevelOfDanger.warning);
    }
  }
}
