import 'package:flutter/material.dart';
import 'package:flutter_blue_plus/flutter_blue_plus.dart';

class BluetoothDeviceList extends StatefulWidget {
  final List<BluetoothDevice> devices;
  final Function(BluetoothDevice) onConnect;

  const BluetoothDeviceList({
    super.key,
    required this.devices,
    required this.onConnect,
  });

  @override
  _BluetoothDeviceListState createState() => _BluetoothDeviceListState();
}

class _BluetoothDeviceListState extends State<BluetoothDeviceList> {
  BluetoothDevice? connectedDevice;

  void _handleConnect(BluetoothDevice device) {
    setState(() {
      connectedDevice = device;
    });
    widget.onConnect(device);
  }

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: ListView.builder(
        itemCount: widget.devices.length,
        itemBuilder: (context, index) {
          final device = widget.devices[index];
          final isConnected = connectedDevice == device;
          return Padding(
            padding:
                const EdgeInsets.symmetric(vertical: 8.0, horizontal: 16.0),
            child: Container(
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.onSecondary,
                borderRadius: BorderRadius.circular(16.0),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withAlpha((0.2 * 255).toInt()),
                    blurRadius: 4.0,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: ListTile(
                title: Text(
                  device.platformName,
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).colorScheme.secondary,
                  ),
                ),
                trailing: ElevatedButton(
                  onPressed: isConnected ? null : () => _handleConnect(device),
                  style: ElevatedButton.styleFrom(
                    backgroundColor:
                        isConnected ? Colors.green : const Color(0xFFDC2626),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20.0),
                    ),
                  ),
                  child: Text(
                    isConnected ? 'Připojeno' : 'Připojit',
                    style: const TextStyle(fontSize: 16, color: Colors.white),
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
