import 'package:flutter/material.dart';
import 'package:bm_racing_app/pages/menu_race_page.dart';

class RaceFinishedPage extends StatelessWidget {
  final String message;
  final double time;

  const RaceFinishedPage({
    super.key,
    required this.message,
    required this.time,
  });

  String formatTime(double timeInSeconds) {
    int minutes = timeInSeconds ~/ 60;
    int seconds = (timeInSeconds % 60).toInt();
    int milliseconds = ((timeInSeconds - timeInSeconds.toInt()) * 1000).toInt();

    String formattedTime =
        '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}.${milliseconds.toString().padLeft(3, '0')}';
    return formattedTime;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Závod dokončen',
          style: TextStyle(
            color: theme.colorScheme.onSurface,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
        centerTitle: true,
        backgroundColor: Theme.of(context).scaffoldBackgroundColor,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: theme.colorScheme.onSurface),
          onPressed: () {
            Navigator.pop(context);
          },
        ),
      ),
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: theme.brightness == Brightness.dark
                ? [
                    Theme.of(context).scaffoldBackgroundColor,
                    Theme.of(context).scaffoldBackgroundColor,
                  ]
                : [
                    theme.colorScheme.onTertiary.withAlpha((0.1 * 255).toInt()),
                    theme.colorScheme.onTertiary.withAlpha((0.3 * 255).toInt()),
                  ], // Gradient se mění podle módu
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.flag_rounded,
                size: 100,
                color: theme.colorScheme.secondary,
              ),
              const SizedBox(height: 20),
              // Upravený widget s omezenou šířkou a paddingem
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                constraints: const BoxConstraints(maxWidth: 300),
                child: Text(
                  time == 0.0 ? message : '$message ${formatTime(time)}',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: theme.colorScheme.onSurface,
                  ),
                ),
              ),
              const SizedBox(height: 30),
              ElevatedButton.icon(
                onPressed: () {
                  Navigator.pushReplacement(
                    context,
                    MaterialPageRoute(
                        builder: (context) => const MenuRacePage()),
                  );
                },
                icon: Icon(Icons.home, color: theme.colorScheme.onSurface),
                label: Text(
                  'Zpět na hlavní obrazovku',
                  style: TextStyle(
                    fontSize: 20,
                    color: theme.colorScheme.onPrimary,
                  ),
                  textAlign: TextAlign.center,
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: theme.colorScheme.primary,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 40,
                    vertical: 20,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(30),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
