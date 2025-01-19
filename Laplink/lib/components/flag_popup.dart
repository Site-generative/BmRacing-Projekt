import 'package:flutter/material.dart';

class FlagPopup extends StatefulWidget {
  final String flagName;
  final String flagNote;
  final bool isForAll;

  const FlagPopup({
    Key? key,
    required this.flagName,
    required this.flagNote,
    required this.isForAll,
  }) : super(key: key);

  @override
  _FlagPopupState createState() => _FlagPopupState();
}

class _FlagPopupState extends State<FlagPopup> {
  bool _isVisible = true;

  @override
  void initState() {
    super.initState();
    _startTimer();
  }

  void _startTimer() {
    Future.delayed(const Duration(seconds: 5), () {
      if (mounted) {
        setState(() {
          _isVisible = false;
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    if (!_isVisible) return const SizedBox.shrink();

    return Positioned(
      top: MediaQuery.of(context).size.height * 0.3,
      left: MediaQuery.of(context).size.width * 0.1,
      right: MediaQuery.of(context).size.width * 0.1,
      child: Material(
        elevation: 8.0,
        borderRadius: BorderRadius.circular(12.0),
        color: Colors.white,
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "Vlajka: ${widget.flagName}",
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                widget.flagNote,
                style: const TextStyle(
                  fontSize: 16,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                widget.isForAll
                    ? "Zpráva pro všechny účastníky"
                    : "Zpráva pro vás",
                style: TextStyle(
                  fontSize: 14,
                  color: widget.isForAll ? Colors.blue : Colors.green,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
