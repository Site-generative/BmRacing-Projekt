import 'dart:async';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter_blue_plus/flutter_blue_plus.dart';

//TATO STRÁNKA BYLA VYGENEROVANÁ POMOCÍ chatGPT a mého původního kódu. Stránka se používá jako ukázková pro zobrazení
//živých dat z RaceBoxu. Tato stránka není součástí projektu a není nikde zobrazovaná

class LiveDataPage extends StatefulWidget {
  final BluetoothDevice device;
  final BluetoothCharacteristic characteristic;

  const LiveDataPage({
    super.key,
    required this.device,
    required this.characteristic,
  });

  @override
  _LiveDataPageState createState() => _LiveDataPageState();
}

class _LiveDataPageState extends State<LiveDataPage> {
  List<int> buffer = [];
  Map<String, dynamic> decodedData = {};
  String rawPacket = "";
  late StreamSubscription<List<int>> _notificationSubscription;

  @override
  void initState() {
    super.initState();
    _listenToCharacteristic();
  }

  void _listenToCharacteristic() {
    _notificationSubscription =
        widget.characteristic.lastValueStream.listen((data) {
      buffer.addAll(data);
      _processData();
    });
    widget.characteristic.setNotifyValue(true);
  }

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

    bool isCharging = (payload[67] & 0x80) != 0;

    decodedData = {
      "iTOW": _getUint32(payload, 0),
      "Year": _getUint16(payload, 4),
      "Month": payload[6],
      "Day": payload[7],
      "Hour": payload[8],
      "Minute": payload[9],
      "Second": payload[10],
      "Validity Flags": payload[11],
      "Time Accuracy": _getUint32(payload, 12),
      "Nanoseconds": _getInt32(payload, 16),
      "Fix Status": payload[20],
      "Fix Status Flags": payload[21],
      "Date/Time Flags": payload[22],
      "Number of SVs": payload[23],
      "Longitude": _getInt32(payload, 24) / 1e7,
      "Latitude": _getInt32(payload, 28) / 1e7,
      "WGS Altitude": _getInt32(payload, 32) / 1000.0,
      "MSL Altitude": _getInt32(payload, 36) / 1000.0,
      "Horizontal Accuracy": _getUint32(payload, 40) / 1000.0,
      "Vertical Accuracy": _getUint32(payload, 44) / 1000.0,
      "Speed": _getInt32(payload, 48) / 1000.0,
      "Heading": _getInt32(payload, 52) / 1e5,
      "Speed Accuracy": _getUint32(payload, 56) / 1000.0,
      "Heading Accuracy": _getUint32(payload, 60) / 1e5,
      "PDOP": _getUint16(payload, 64) / 100.0,
      "Lat/Lon Flags": payload[66],
      "Battery Status": payload[67] & 0x7F,
      "Is Charging": isCharging ? "Yes" : "No",
      "GForceX": _getInt16(payload, 68) / 1000.0,
      "GForceY": _getInt16(payload, 70) / 1000.0,
      "GForceZ": _getInt16(payload, 72) / 1000.0,
      "Rotation Rate X": _getInt16(payload, 74) / 100.0,
      "Rotation Rate Y": _getInt16(payload, 76) / 100.0,
      "Rotation Rate Z": _getInt16(payload, 78) / 100.0,
    };
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

  int _getUint32(Uint8List data, int offset) {
    return data[offset] |
        (data[offset + 1] << 8) |
        (data[offset + 2] << 16) |
        (data[offset + 3] << 24);
  }

  int _getUint16(Uint8List data, int offset) {
    return data[offset] | (data[offset + 1] << 8);
  }

  int _getInt32(Uint8List data, int offset) {
    return data[offset] |
        (data[offset + 1] << 8) |
        (data[offset + 2] << 16) |
        (data[offset + 3] << 24);
  }

  int _getInt16(Uint8List data, int offset) {
    return data[offset] | (data[offset + 1] << 8);
  }

  @override
  void dispose() {
    _notificationSubscription.cancel();
    widget.characteristic.setNotifyValue(false);
    widget.device.disconnect();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Live Data View'),
        backgroundColor: Theme.of(context).colorScheme.tertiary,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: ListView(
                children: decodedData.entries.map((entry) {
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 8.0),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(entry.key,
                            style: Theme.of(context).textTheme.bodyMedium),
                        Text(entry.value.toString(),
                            style: Theme.of(context).textTheme.bodyMedium),
                      ],
                    ),
                  );
                }).toList(),
              ),
            ),
            const Divider(),
            const Text('Raw Packet:',
                style: TextStyle(fontWeight: FontWeight.bold)),
            Text(rawPacket, style: Theme.of(context).textTheme.bodySmall),
          ],
        ),
      ),
    );
  }
}
