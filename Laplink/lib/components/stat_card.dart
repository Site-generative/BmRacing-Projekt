import 'package:flutter/material.dart';

class StatCard {
  Widget buildStatCard({
    required BuildContext context,
    Color? valueColor,
    required String value,
    required String title,
    required double height,
    required double width,
  }) {
    final theme = Theme.of(context);

    return Container(
      height: height,
      width: width,
      decoration: BoxDecoration(
        color: theme.colorScheme.surface, // Dynamická barva pozadí
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: theme.shadowColor
                .withAlpha((0.2 * 255).toInt()), // Dynamický stín
            blurRadius: 6,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(8.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: theme.colorScheme.onSurface
                    .withAlpha((0.7 * 255).toInt()), // Dynamická barva textu
              ),
            ),
            const SizedBox(height: 4),
            Text(
              value,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: valueColor ??
                    theme.colorScheme.onSurface, // Dynamická barva hodnoty
              ),
            ),
          ],
        ),
      ),
    );
  }
}
