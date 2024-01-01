import 'dart:async';
import 'dart:typed_data';
import 'package:flutter_blue_plus/flutter_blue_plus.dart';

class bm_racing_appBluetoothService {
  final uartServiceUuid = Guid("6E400001-B5A3-F393-E0A9-E50E24DCCA9E");
  final txCharacteristicUuid = Guid("6E400003-B5A3-F393-E0A9-E50E24DCCA9E");

  Stream<Uint8List>? notificationStream;

  Future<List<BluetoothDevice>> scanForDevices() async {
    List<BluetoothDevice> devicesList = [];
    try {
      FlutterBluePlus.startScan(timeout: const Duration(seconds: 4));
      await Future.delayed(const Duration(seconds: 4));
      var results = await FlutterBluePlus.scanResults.first;
      devicesList = results
          .map((r) => r.device)
          .where((device) => device.platformName.contains("RaceBox"))
          .toList();
    } catch (e) {
      print('Chyba při skenování zařízení: $e');
    }
    return devicesList;
  }

  Future<BluetoothCharacteristic?> connectToDevice(
      BluetoothDevice device) async {
    try {
      await device.connect(timeout: const Duration(seconds: 5));
      List<BluetoothService> services = await device.discoverServices();
      for (BluetoothService service in services) {
        if (service.uuid == uartServiceUuid) {
          for (BluetoothCharacteristic characteristic
              in service.characteristics) {
            if (characteristic.uuid == txCharacteristicUuid) {
              await characteristic.setNotifyValue(true);
              notificationStream =
                  characteristic.lastValueStream.cast<Uint8List>();
              return characteristic;
            }
          }
        }
      }
    } catch (e) {
      print('Chyba při připojení k zařízení: $e');
    }
    return null;
  }

  Future<void> disconnectFromDevice(BluetoothDevice device) async {
    try {
      await device.disconnect();
    } catch (e) {
      print('Chyba při odpojení: $e');
    }
  }
}
