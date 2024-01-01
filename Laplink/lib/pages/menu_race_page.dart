import 'dart:async';

import 'package:bm_racing_app/components/auto_connect_popup.dart';
import 'package:bm_racing_app/pages/race%20pages/training_qualification_page_test.dart';
import 'package:bm_racing_app/provider/theme_provider.dart';
import 'package:flutter/material.dart';
import 'package:flutter_background/flutter_background.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:bm_racing_app/services/race_service.dart';
import 'package:bm_racing_app/pages/results_page.dart';
import 'package:lottie/lottie.dart';
import 'package:bm_racing_app/pages/racebox_connection_page.dart';
import 'package:bm_racing_app/components/header.dart';
import 'package:bm_racing_app/pages/race%20pages/race_page_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:bm_racing_app/pages/login_page.dart';
import 'package:bm_racing_app/pages/user_info_page.dart';
import 'package:bm_racing_app/pages/serie_event_page.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
// Importujeme RouteObserver z main.dart
import 'package:bm_racing_app/main.dart';

class MenuRacePage extends StatefulWidget {
  const MenuRacePage({Key? key}) : super(key: key);

  @override
  State<MenuRacePage> createState() => _MenuRacePageState();
}

class _MenuRacePageState extends State<MenuRacePage> with RouteAware {
  late Future<List<Map<String, dynamic>>> _racesFuture;
  late StreamSubscription<List<ConnectivityResult>> _connectivitySubscription;
  bool _isNoInternetDialogShowing = false;

  @override
  void initState() {
    super.initState();
    print('MenuRacePage - initState');

    _checkAndRequestPermissions();
    _loadRaces();
    // Sledování připojení
    _connectivitySubscription = Connectivity()
        .onConnectivityChanged
        .listen((List<ConnectivityResult> results) {
      final result =
          results.isNotEmpty ? results.first : ConnectivityResult.none;
      if (result == ConnectivityResult.none) {
        _showNoInternetDialog();
      }
    });
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Přihlášení do RouteObserver
    routeObserver.subscribe(this, ModalRoute.of(context)! as PageRoute);
  }

  @override
  void dispose() {
    routeObserver.unsubscribe(this);
    _connectivitySubscription.cancel();
    super.dispose();
  }

  // Tato metoda se zavolá, když se uživatel vrátí na tuto stránku
  @override
  void didPopNext() {
    _refreshRaces();
  }

  Future<bool> _checkConnectivity() async {
    List<ConnectivityResult> result = await Connectivity().checkConnectivity();
    return result != ConnectivityResult.none;
  }

  void _showNoInternetDialog() {
    if (_isNoInternetDialogShowing) return;
    _isNoInternetDialogShowing = true;
    showDialog(
      context: context,
      barrierDismissible:
          false, // Uživatel nemůže dialog zavřít kliknutím mimo něj
      builder: (context) => AlertDialog(
        title: const Text('Bez připojení k internetu'),
        content: const Text('Zkontrolujte, prosím, své připojení k internetu.'),
        actions: [
          TextButton(
            onPressed: () async {
              Navigator.of(context).pop();
              _isNoInternetDialogShowing = false;
              bool isConnected = await _checkConnectivity();
              if (!isConnected) {
                _showNoInternetDialog();
              } else {
                _refreshRaces();
              }
            },
            child: const Text('OK'),
          )
        ],
      ),
    ).then((_) {
      _isNoInternetDialogShowing = false;
    });
  }

  void _loadRaces() {
    _racesFuture = RaceService.getDriverRaces();
  }

  Future<void> _refreshRaces() async {
    setState(() {
      _loadRaces();
    });
    await _racesFuture;
  }

  Future<void> _checkAndRequestPermissions() async {
    List<Permission> permissions = [
      Permission.bluetooth,
      Permission.bluetoothScan,
      Permission.bluetoothConnect,
      Permission.location,
      Permission.notification,
    ];

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

    Map<Permission, PermissionStatus> statuses = await permissions.request();
    bool allGranted = statuses.values.every((status) => status.isGranted);
    if (!allGranted) {
      print("Některá oprávnění nebyla udělena.");
    }
  }

  Future<void> _logout(BuildContext context) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('web_user');
    await prefs.remove('web_password');

    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (context) => const LoginPage()),
    );
  }

  void _startTestTraining(BuildContext context, int raceId) async {
    await RaceService.saveEventPhase(1, raceId);
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => TrainingQualificationPageTest(),
      ),
    );
  }

  void _startTestQualification(BuildContext context, int raceId) async {
    await RaceService.saveEventPhase(2, raceId);
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => TrainingQualificationPageTest(),
      ),
    );
  }

  void _startTestRace(BuildContext context, int raceId) async {
    await RaceService.saveEventPhase(3, raceId);
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => RacePageTest(),
      ),
    );
  }

  void _navigateToRaceStartPage(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const RaceStartPage(),
      ),
    );
  }

  void _autoStartRace(BuildContext context) async {
    final result = await showDialog<String>(
      context: context,
      barrierDismissible: false,
      builder: (_) => AutoConnectPopup(),
    );
    print('result: $result');

    if (result == "success") {
      print('Úspěch - nic nedělat');
    } else {
      print('Navigace na RaceStartPage');
      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const RaceStartPage()),
      );
    }
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

  Future<void> _showSettingsPopup(BuildContext context) async {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        final themeProvider =
            Provider.of<ThemeProvider>(context, listen: false);
        bool isDarkMode = themeProvider.themeMode == ThemeMode.dark;

        return AlertDialog(
          backgroundColor: Theme.of(context).colorScheme.surface,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          title: Text(
            'Nastavení',
            style: TextStyle(color: Theme.of(context).colorScheme.secondary),
          ),
          content: StatefulBuilder(
            builder: (context, setState) {
              return Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Tmavý motiv',
                        style: TextStyle(
                          color: Theme.of(context).colorScheme.onSurface,
                        ),
                      ),
                      Switch(
                        value: isDarkMode,
                        onChanged: (value) {
                          setState(() => isDarkMode = value);
                          themeProvider.toggleTheme(value);
                        },
                        activeColor: Theme.of(context).colorScheme.primary,
                      ),
                    ],
                  ),
                  FutureBuilder<PackageInfo>(
                    future: PackageInfo.fromPlatform(),
                    builder: (context, snapshot) {
                      if (snapshot.connectionState == ConnectionState.waiting) {
                        return const SizedBox.shrink();
                      }
                      if (snapshot.hasData) {
                        final packageInfo = snapshot.data!;
                        return Padding(
                          padding: const EdgeInsets.only(top: 20.0),
                          child: Text(
                            'Verze: ${packageInfo.version}',
                            style: TextStyle(
                              color: Theme.of(context)
                                  .colorScheme
                                  .onSurface
                                  .withOpacity(0.6),
                              fontSize: 14,
                            ),
                          ),
                        );
                      }
                      return const SizedBox.shrink();
                    },
                  ),
                ],
              );
            },
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      drawer: Drawer(
        width: MediaQuery.of(context).size.width * 0.6,
        child: SafeArea(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(
                color: Colors.transparent,
                padding: const EdgeInsets.only(top: 16, left: 16, right: 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Menu',
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.secondary,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    IconButton(
                      icon: Icon(
                        Icons.close,
                        color: Theme.of(context).colorScheme.secondary,
                      ),
                      onPressed: () {
                        Navigator.pop(context);
                      },
                    ),
                  ],
                ),
              ),
              Expanded(
                child: Container(
                  color: Theme.of(context).colorScheme.surface,
                  child: ListView(
                    physics: const NeverScrollableScrollPhysics(),
                    padding: EdgeInsets.zero,
                    children: [
                      _buildDrawerItem(
                        context,
                        icon: Icons.show_chart,
                        title: 'Moje výsledky',
                        onTap: () {
                          Navigator.pop(context);
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                                builder: (context) => const SerieEventPage(
                                      isPersonal: true,
                                    )),
                          );
                        },
                      ),
                      _buildDrawerDivider(context),
                      _buildDrawerItem(
                        context,
                        icon: Icons.emoji_events,
                        title: 'Výsledky',
                        onTap: () {
                          Navigator.pop(context);
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                                builder: (context) => const SerieEventPage(
                                      isPersonal: false,
                                    )),
                          );
                        },
                      ),
                      _buildDrawerDivider(context),
                      _buildDrawerItem(
                        context,
                        icon: Icons.person_outline,
                        title: 'Profil Uživatele',
                        onTap: () {
                          Navigator.pop(context);
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                                builder: (context) => const UserInfoPage()),
                          );
                        },
                      ),
                      _buildDrawerDivider(context),
                      _buildDrawerItem(
                        context,
                        icon: Icons.settings,
                        title: 'Nastavení',
                        onTap: () => _showSettingsPopup(context),
                      ),
                    ],
                  ),
                ),
              ),
              Container(
                color: Theme.of(context).colorScheme.surface,
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                child: OutlinedButton.icon(
                  onPressed: () => _logout(context),
                  icon: Icon(
                    Icons.exit_to_app,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                  label: Text(
                    'Odhlásit se',
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.primary,
                    ),
                  ),
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size(double.infinity, 48),
                    side: BorderSide(
                      color: Theme.of(context).colorScheme.primary,
                    ),
                  ),
                ),
              ),
              FutureBuilder<PackageInfo>(
                future: PackageInfo.fromPlatform(),
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const SizedBox.shrink();
                  }
                  return const SizedBox.shrink();
                },
              ),
            ],
          ),
        ),
      ),
      appBar: AppBar(
        automaticallyImplyLeading: false,
        title: Builder(
          builder: (BuildContext context) {
            return Header(
              onHamburgerTap: () {
                Scaffold.of(context).openDrawer();
              },
            );
          },
        ),
        backgroundColor: Theme.of(context).colorScheme.tertiary,
        centerTitle: true,
      ),
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: _racesFuture,
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
            return RefreshIndicator(
              onRefresh: _refreshRaces,
              child: _buildRaceList(context, races),
            );
          }
        },
      ),
    );
  }

  Widget _buildDrawerDivider(BuildContext context) {
    return Divider(
      color: Theme.of(context).dividerColor.withOpacity(0.3),
      thickness: 0.5,
      height: 0.5,
      indent: 16,
      endIndent: 16,
    );
  }

  Widget _buildDrawerItem(
    BuildContext context, {
    required IconData icon,
    required String title,
    required VoidCallback onTap,
  }) {
    return ListTile(
      dense: true,
      visualDensity: const VisualDensity(vertical: 0),
      leading: Icon(
        icon,
        color: Theme.of(context).colorScheme.primary,
      ),
      title: Align(
        alignment: Alignment.centerRight,
        child: Text(
          title,
          style: TextStyle(
            fontSize: 16,
            color: Theme.of(context).colorScheme.onSurface,
          ),
        ),
      ),
      onTap: onTap,
      hoverColor: Theme.of(context).colorScheme.primary.withOpacity(0.05),
      splashColor: Theme.of(context).colorScheme.primary.withOpacity(0.08),
      tileColor: Colors.transparent,
      selectedTileColor: Theme.of(context).colorScheme.primary.withOpacity(0.1),
      enableFeedback: true,
    );
  }

  Widget _buildRaceList(
      BuildContext context, List<Map<String, dynamic>> races) {
    return ListView.builder(
      physics: const AlwaysScrollableScrollPhysics(),
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
        Expanded(
          child: Text(
            text,
            style: TextStyle(
              color: Theme.of(context)
                  .colorScheme
                  .onSurface
                  .withAlpha((0.8 * 255).toInt()),
              fontSize: 16,
            ),
            softWrap: true,
          ),
        ),
      ],
    );
  }

  void _startTraining(BuildContext context, int raceId) async {
    await RaceService.saveEventPhase(1, raceId);
    _autoStartRace(context);
  }

  void _startQualification(BuildContext context, int raceId) async {
    await RaceService.saveEventPhase(2, raceId);
    _autoStartRace(context);
  }

  void _startRace(BuildContext context, int raceId) async {
    await RaceService.saveEventPhase(3, raceId);
    _autoStartRace(context);
  }

  Widget _buildActionButtons(BuildContext context, Map<String, dynamic> race) {
    String buttonText;
    IconData buttonIcon;
    VoidCallback? onPressed;
    print(race);
    switch (race['event_phase_id']) {
      case 1:
        buttonText = 'Zahájit trénink';
        buttonIcon = Icons.directions_run;
        onPressed = () => _startTraining(context, race['id']);
        break;
      case 2:
        buttonText = 'Zahájit kvalifikaci';
        buttonIcon = Icons.timer;
        onPressed = () => _startQualification(context, race['id']);
        break;
      case 3:
        buttonText = 'Zahájit závod';
        buttonIcon = Icons.flag;
        if (race['finished'] == true) {
          onPressed = null;
        } else {
          onPressed = () => _startRace(context, race['id']);
        }
        break;
      default:
        buttonText = 'Neznámá fáze';
        buttonIcon = Icons.help_outline;
        onPressed = null;
    }

    return ElevatedButton.icon(
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
      label: const Text('Moje výsledky'),
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
    return RefreshIndicator(
      onRefresh: _refreshRaces,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          SizedBox(
            height: MediaQuery.of(context).size.height * 0.8,
            child: Center(
              child: Text(
                'Žádné závody k dispozici',
                style: TextStyle(
                  color: Theme.of(context).colorScheme.onSurface,
                  fontSize: 18,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
