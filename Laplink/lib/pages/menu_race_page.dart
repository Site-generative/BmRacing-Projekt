import 'package:flutter/material.dart';
import 'package:flutter_background/flutter_background.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:laplink/services/race_service.dart';
import 'package:laplink/pages/results_page.dart';
import 'package:lottie/lottie.dart';
import 'package:laplink/pages/racebox_connection_page.dart';
import 'package:laplink/components/header.dart';

class MenuRacePage extends StatelessWidget {
  const MenuRacePage({super.key});

  Future<void> _checkAndRequestPermissions() async {
    // Seznam požadovaných oprávnění
    List<Permission> permissions = [
      Permission.bluetooth,
      Permission.bluetoothScan,
      Permission.bluetoothConnect,
      Permission.location,
      Permission.notification, // Pro notifikace
    ];

    // Kontrola dostupnosti oprávnění pro běh na pozadí
    bool hasBackgroundPermission = await FlutterBackground.hasPermissions;
    if (!hasBackgroundPermission) {
      bool initialized = await FlutterBackground.initialize(
        androidConfig: const FlutterBackgroundAndroidConfig(
          notificationTitle: "Aplikace běží na pozadí",
          notificationText: "Sbíráme data závodu na pozadí.",
          notificationImportance: AndroidNotificationImportance.high,
          notificationIcon:
              AndroidResource(name: 'background_icon', defType: 'drawable'),
        ),
      );
      if (initialized) {
        await FlutterBackground.enableBackgroundExecution();
      }
    }

    // Žádost o ostatní oprávnění
    Map<Permission, PermissionStatus> statuses = await permissions.request();

    // Kontrola, zda všechna oprávnění byla udělena
    bool allGranted = statuses.values.every((status) => status.isGranted);
    /*if (!allGranted) {
      print("Některá oprávnění nebyla udělena.");
      // Zde můžete přidat dialog pro upozornění uživatele
    }*/
  }

  void _startTraining(BuildContext context, int raceId) async {
    await RaceService.saveEventPhase(1, raceId);
    _navigateToRaceStartPage(context);
  }

  void _startQualification(BuildContext context, int raceId) async {
    await RaceService.saveEventPhase(2, raceId);
    _navigateToRaceStartPage(context);
  }

  void _startRace(BuildContext context, int raceId) async {
    await RaceService.saveEventPhase(3, raceId);
    _navigateToRaceStartPage(context);
  }

  void _navigateToRaceStartPage(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const RaceStartPage(),
      ),
    );
  }

  void _navigateToRaceDetailsPage(BuildContext context, int raceId) async {
    final webUser = await RaceService.getWebUser();
    if (webUser == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Uživatel není přihlášen')),
      );
      return;
    }
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ResultsPage(
          webUser: webUser,
          raceId: raceId,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    _checkAndRequestPermissions(); // Kontrola oprávnění při sestavení widgetu

    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        title: const Header(),
        backgroundColor: Theme.of(context).colorScheme.tertiary,
        centerTitle: true,
      ),
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: RaceService.getDriverRaces(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return Center(
              child: Lottie.asset(
                'assets/loading.json',
                width: 150,
                height: 150,
              ),
            );
          } else if (snapshot.hasError) {
            return _buildErrorState(context);
          } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return _buildEmptyState(context);
          } else {
            final races = snapshot.data!;
            return _buildRaceList(context, races);
          }
        },
      ),
    );
  }

  Widget _buildRaceList(
      BuildContext context, List<Map<String, dynamic>> races) {
    return ListView.builder(
      itemCount: races.length,
      padding: const EdgeInsets.all(12),
      itemBuilder: (context, index) {
        final race = races[index];
        return Card(
          color: Theme.of(context).colorScheme.surface,
          elevation: 3,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          child: Padding(
            padding: const EdgeInsets.all(12.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildRaceHeader(context, race),
                const SizedBox(height: 8),
                _buildRaceDetails(context, race),
                const SizedBox(height: 12),
                _buildActionButtons(context, race),
                const SizedBox(height: 8),
                _buildResultsButton(context, race['id']),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildRaceHeader(BuildContext context, Map<String, dynamic> race) {
    return Center(
      child: Text(
        race['name'] ?? 'Unnamed Race',
        style: TextStyle(
          fontSize: 24,
          fontWeight: FontWeight.bold,
          color: Theme.of(context).colorScheme.onSurface,
        ),
      ),
    );
  }

  Widget _buildRaceDetails(BuildContext context, Map<String, dynamic> race) {
    String formattedDate = 'N/A';
    if (race['date'] != null) {
      try {
        final parsedDate = DateTime.parse(race['date']);
        formattedDate =
            "${parsedDate.day.toString().padLeft(2, '0')}.${parsedDate.month.toString().padLeft(2, '0')}.${parsedDate.year}";
      } catch (e) {
        formattedDate = 'Neplatné datum';
      }
    }

    String lapsText =
        'Počet kol: ${(race['event_phase_id'] == 1 || race['event_phase_id'] == 2) ? 'Neomezeno' : (race['number_of_laps']?.toString() ?? 'N/A')}';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildDetailRow(context, Icons.calendar_today, formattedDate),
        _buildDetailRow(context, Icons.location_pin,
            'Lokace: ${race['location'] ?? 'N/A'}'),
        _buildDetailRow(context, Icons.flag, lapsText),
      ],
    );
  }

  Widget _buildDetailRow(BuildContext context, IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, color: Theme.of(context).colorScheme.primary, size: 20),
        const SizedBox(width: 8),
        Text(
          text,
          style: TextStyle(
            color: Theme.of(context)
                .colorScheme
                .onSurface
                .withAlpha((0.8 * 255).toInt()),
            fontSize: 16,
          ),
        ),
      ],
    );
  }

  Widget _buildActionButtons(BuildContext context, Map<String, dynamic> race) {
    String buttonText;
    IconData buttonIcon;
    VoidCallback? onPressed;

    switch (race['event_phase_id']) {
      case 1: // Trénink
        buttonText = 'Zahájit trénink';
        buttonIcon = Icons.directions_run;
        onPressed = () => _startTraining(context, race['id']);
        break;
      case 2: // Kvalifikace
        buttonText = 'Zahájit kvalifikaci';
        buttonIcon = Icons.timer;
        onPressed = () => _startQualification(context, race['id']);
        break;
      case 3: // Závod
        buttonText = 'Zahájit závod';
        buttonIcon = Icons.flag;

        // Pokud je závod již ve stavu "finished == 1", tlačítko bude neaktivní
        if (race['finished'] == 1) {
          onPressed = null;
        } else {
          onPressed = () => _startRace(context, race['id']);
        }
        break;
      default:
        buttonText = 'Neznámá fáze';
        buttonIcon = Icons.help_outline;
        onPressed = () {}; // Kliknutí v neznámé fázi nedělá nic
    }

    return ElevatedButton.icon(
      // Pokud onPressed == null, ElevatedButton se sám vypne (disabled)
      onPressed: onPressed,
      icon: Icon(buttonIcon, color: Colors.white),
      label: Text(buttonText),
      style: ElevatedButton.styleFrom(
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
        minimumSize: const Size(double.infinity, 48),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
    );
  }

  Widget _buildResultsButton(BuildContext context, int raceId) {
    return OutlinedButton.icon(
      onPressed: () => _navigateToRaceDetailsPage(context, raceId),
      icon: const Icon(Icons.access_time),
      label: const Text('Zobrazit výsledky'),
      style: OutlinedButton.styleFrom(
        foregroundColor: Theme.of(context).colorScheme.primary,
        minimumSize: const Size(double.infinity, 48),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        side: BorderSide(color: Theme.of(context).colorScheme.primary),
      ),
    );
  }

  Widget _buildErrorState(BuildContext context) {
    return Center(
      child: Text(
        'Chyba při načítání závodů',
        style: TextStyle(color: Theme.of(context).colorScheme.onSurface),
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Text(
        'Žádné závody k dispozici',
        style: TextStyle(color: Theme.of(context).colorScheme.onSurface),
      ),
    );
  }
}
