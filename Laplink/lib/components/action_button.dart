import 'package:flutter/material.dart';

class ActionButton extends StatelessWidget {
  final bool isActive;
  final String label;
  final IconData icon;
  final Color backgroundColor;
  final VoidCallback onPressed;

  const ActionButton({
    super.key,
    required this.isActive,
    required this.label,
    required this.icon,
    required this.backgroundColor,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton.icon(
        onPressed: isActive ? onPressed : null,
        icon: Icon(icon, color: isActive ? Colors.white : Colors.grey),
        label: Text(
          label,
          style: TextStyle(color: isActive ? Colors.white : Colors.grey),
        ),
        style: ElevatedButton.styleFrom(
          backgroundColor: isActive ? backgroundColor : const Color(0xFF3A3A3A),
          padding: const EdgeInsets.symmetric(vertical: 15),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(30),
          ),
          elevation: isActive ? 5 : 0,
        ),
      ),
    );
  }
}
