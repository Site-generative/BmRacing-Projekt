// ignore_for_file: unused_field

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:bm_racing_app/components/lap_time_table.dart';
import 'dart:math';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:bm_racing_app/services/api_service.dart';
import 'package:bm_racing_app/pages/race%20pages/race_finished_page.dart';
import 'package:keep_screen_on/keep_screen_on.dart';
import 'package:awesome_notifications/awesome_notifications.dart';
import 'package:bm_racing_app/utils/time_formatters.dart';
import 'package:bm_racing_app/components/stat_card.dart';
import 'package:bm_racing_app/services/background_service.dart';
import 'package:battery_plus/battery_plus.dart';
import 'package:bm_racing_app/utils/battery_helper.dart';

class TrainingQualificationPageTest extends StatefulWidget {
  const TrainingQualificationPageTest({
    super.key,
  });

  @override
  _TrainingQualificationPageTestState createState() =>
      _TrainingQualificationPageTestState();
}

class _TrainingQualificationPageTestState
    extends State<TrainingQualificationPageTest> with WidgetsBindingObserver {
  String currentTime = '';
  int completedLaps = 0;
  List<double> lapTimes = [];
  bool raceStarted = false;
  bool raceEnded = false;
  final double maxValidSpeed = 250.0;
  Stopwatch stopwatch = Stopwatch();
  late List<double> startLineP1;
  late List<double> startLineP2;
  bool lock = false;
  int eventId = 0;
  int eventPhaseId = 0;
  String webUser = '';
  Map<String, dynamic>? raceInfo;
  double currentLatitude = 0.0;
  double currentLongitude = 0.0;
  Timer? _notificationTimer;
  late String notificationMessage = 'Není známo';
  double? fastestLap;
  int lapsOnTires = 0;

  final ScrollController _scrollController = ScrollController();
  bool isNotificationActive = false;
  bool isCalibrating = true;
  final StatCard statCard = StatCard();
  final BatteryHelper batteryHelper = BatteryHelper();
  late BackgroundService _backgroundService;

  final Battery _battery = Battery();
  int? batteryLevel = 69;
  bool isCharging = false;
  bool isBatteryLevelKnown = false;

  @override
  void initState() {
    super.initState();

    isCalibrating = true;
    stopwatch.reset();
    stopwatch.stop();
    raceStarted = false;
    raceEnded = false;
    completedLaps = 0;
    lapTimes.clear();

    _backgroundService = BackgroundService(context: context);
    WidgetsBinding.instance.addObserver(this);
    _initializeRaceData();
    checkNotificationPermission();
    _initializeNotifications();

    Timer.periodic(Duration(milliseconds: 30), (timer) {
      if (!mounted) timer.cancel();
      setState(() {}); // aktualizace UI každých 30 ms
    });
  }

  void checkNotificationPermission() async {
    bool isAllowed = await AwesomeNotifications().isNotificationAllowed();
    if (!isAllowed) {
      await AwesomeNotifications().requestPermissionToSendNotifications();
    }
  }

  Future<void> _saveLapsOnTires(int eventId, int laps) async {
    final prefs = await SharedPreferences.getInstance();
    prefs.setInt('laps_on_tires_$eventId', laps);
  }

  Future<int> _loadLapsOnTires(int eventId) async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getInt('laps_on_tires_$eventId') ?? 0;
  }

  Future<void> _resetLapsOnTires(int eventId) async {
    setState(() {
      lapsOnTires = 0;
    });
    final prefs = await SharedPreferences.getInstance();
    prefs.remove('laps_on_tires_$eventId');
  }

  @override
  void dispose() {
    _backgroundService.disableBackgroundExecution();
    WidgetsBinding.instance.removeObserver(this);
    _cancelNotification();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused) {
      _backgroundService.enableBackgroundExecution();
    } else if (state == AppLifecycleState.resumed) {
      _backgroundService.disableBackgroundExecution();
    }
  }

  void _initializeNotifications() {
    AwesomeNotifications().initialize(
      null,
      [
        NotificationChannel(
          channelKey: 'race_channel',
          channelName: 'Závodní Notifikace',
          channelDescription: 'Notifikace na zobrazování informací o závodu',
          defaultColor: Colors.teal,
          importance: NotificationImportance.High,
          ledColor: Colors.white,
          locked: true,
        )
      ],
    );
  }

  void _cancelNotification() {
    _notificationTimer?.cancel();
    _notificationTimer = null;
    isNotificationActive = false;
    AwesomeNotifications().cancel(1);
  }

  Future<void> _initializeRaceData() async {
    KeepScreenOn.turnOn();

    final prefs = await SharedPreferences.getInstance();
    eventId = prefs.getInt('race_id') ?? 0;
    eventPhaseId = prefs.getInt('event_phase_id') ?? 0;
    webUser = prefs.getString('web_user') ?? '';
    notificationMessage = eventPhaseId == 1 ? 'Trénink' : 'Kvalifikace';

    final laps = await _loadLapsOnTires(eventId);
    setState(() {
      lapsOnTires = laps;
    });

    final ApiClient apiClient = ApiClient();
    apiClient.initialize();

    try {
      final data = await apiClient.getRaceDetail(eventId);
      setState(() {
        raceInfo = data;
        startLineP1 =
            _parseCoordinate(raceInfo!['start_coordinates'].split(';')[0]);
        startLineP2 =
            _parseCoordinate(raceInfo!['start_coordinates'].split(';')[1]);
      });
    } catch (error) {
      _showMessage('Error při načítání informací o závodě: $error');
    }
  }

  List<double> _parseCoordinate(String coordinate) {
    final parts = coordinate.split(',');
    return [double.parse(parts[0]), double.parse(parts[1])];
  }

  // Po úspěšné registraci kola resetujeme stopky
  void _registerLapWithTime(double lapTime) async {
    if (lapTime > 0.0) {
      if (fastestLap == null || lapTime < fastestLap!) {
        fastestLap = lapTime;
      }
      final apiClient = ApiClient();
      print('Laptime: ${TimeFormatters.formatLapTimeToTable(lapTime)}');
      apiClient.initialize();
      apiClient
          .postLapData(
        eventId,
        webUser,
        TimeFormatters.formatLapTime(lapTime),
        eventPhaseId,
      )
          .catchError((error, stackTrace) {
        _showMessage('Chyba při odesílání dat: $error');
      });
      lapTimes.add(lapTime);
      _scrollToBottom();
    }
    lapsOnTires++;
    await _saveLapsOnTires(eventId, lapsOnTires);
    completedLaps++;
  }

  void _endRace() async {
    raceEnded = true;
    await _backgroundService.disableBackgroundExecution();
    var validLapTimes = lapTimes.where((time) => time > 0).toList();
    double fastestLap =
        validLapTimes.isNotEmpty ? validLapTimes.reduce(min) : 0.0;
    String message = lapTimes.isEmpty
        ? 'Závod byl ukončen bez ujetého kola'
        : 'Nejrychlejší kolo trvalo: ';
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (context) => RaceFinishedPage(
          message: message,
          time: fastestLap,
        ),
      ),
    );
  }

  // Metoda pro zobrazení zprávy pomocí SnackBar
  void _showMessage(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        duration: const Duration(seconds: 3),
      ),
    );
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _handleTireChange() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        final theme = Theme.of(context);
        return AlertDialog(
          backgroundColor: theme.colorScheme.surface,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12.0),
          ),
          title: Text(
            'Změna sady kol',
            style: TextStyle(
              color: theme.colorScheme.onSurface,
              fontWeight: FontWeight.bold,
              fontSize: 18,
            ),
          ),
          content: Text(
            'Opravdu chcete provést změnu sady kol? Počet kol na sadě bude resetován.',
            style: TextStyle(
              color: theme.colorScheme.onSurface.withAlpha((0.7 * 255).toInt()),
              fontSize: 16,
            ),
          ),
          actions: <Widget>[
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
              },
              style: TextButton.styleFrom(
                foregroundColor: theme.colorScheme.primary,
              ),
              child: const Text('Zrušit'),
            ),
            TextButton(
              onPressed: () {
                _resetLapsOnTires(eventId);
                Navigator.of(context).pop();
              },
              style: TextButton.styleFrom(
                foregroundColor: Colors.green,
              ),
              child: const Text('Potvrdit'),
            ),
          ],
        );
      },
    );
  }

  void registerLap() {
    stopwatch.stop();
    setState(() {
      _registerLapWithTime(stopwatch.elapsedMilliseconds / 1000);
      stopwatch.reset();
      stopwatch.start();
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final size = MediaQuery.of(context).size;

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: theme.colorScheme.surface,
        centerTitle: false,
        leadingWidth: 0,
        title: Text(
          'Trénink / Kvalifikace',
          style: TextStyle(
            color: theme.colorScheme.onSurface,
            fontWeight: FontWeight.bold,
            fontSize: 18.0,
          ),
        ),
        automaticallyImplyLeading: false,
        actions: [
          Row(
            children: [
              Row(
                children: [
                  Icon(
                    isBatteryLevelKnown
                        ? batteryHelper.getBatteryIcon(batteryLevel!, false)
                        : Icons.battery_unknown,
                    color: isBatteryLevelKnown
                        ? batteryHelper.getBatteryColor(batteryLevel!)
                        : Colors.grey,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    isBatteryLevelKnown ? '$batteryLevel%' : 'N/A',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: isBatteryLevelKnown
                          ? batteryHelper.getBatteryColor(batteryLevel!)
                          : Colors.grey,
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 4),
            ],
          ),
          IconButton(
            icon: const Icon(Icons.tire_repair_outlined),
            onPressed: _handleTireChange,
            tooltip: 'Změna sady kol',
          ),
        ],
      ),
      body: LayoutBuilder(
        builder: (context, constraints) {
          final double statCardHeight = constraints.maxHeight * 0.1;
          final double statCardWidth = constraints.maxWidth * 0.4;
          final double timerFontSize = constraints.maxHeight * 0.08;

          return Center(
            child: Column(
              children: [
                const SizedBox(height: 24),
                Text(
                  TimeFormatters.formattedStopwatchTime(stopwatch),
                  style: TextStyle(
                    fontSize: timerFontSize,
                    fontWeight: FontWeight.bold,
                    color: theme.colorScheme.onSurface,
                    letterSpacing: 2.0,
                  ),
                ),
                const SizedBox(height: 16),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0),
                  child: Wrap(
                    spacing: 16,
                    runSpacing: 16,
                    alignment: WrapAlignment.center,
                    children: [
                      statCard.buildStatCard(
                        context: context,
                        title: 'Poslední kolo',
                        value: lapTimes.isNotEmpty
                            ? TimeFormatters.formatLapTimeToTable(lapTimes.last)
                            : '0:00.000',
                        height: statCardHeight,
                        width: statCardWidth,
                      ),
                      statCard.buildStatCard(
                        context: context,
                        title: 'Nejrychlejší kolo',
                        value: fastestLap != null
                            ? fastestLap!.toStringAsFixed(3)
                            : '0:00.000',
                        valueColor: Colors.green,
                        height: statCardHeight,
                        width: statCardWidth,
                      ),
                      statCard.buildStatCard(
                        context: context,
                        title: 'Kol na sadě',
                        value: lapsOnTires.toString(),
                        height: statCardHeight,
                        width: statCardWidth,
                      ),
                      statCard.buildStatCard(
                        context: context,
                        title: 'Aktuální kolo',
                        value: completedLaps.toString(),
                        height: statCardHeight,
                        width: statCardWidth,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Místo ConstrainedBox použijeme Expanded, aby tabulka nevyvolávala overflow
                Expanded(
                  child: Container(
                    width: size.width * 0.9,
                    decoration: BoxDecoration(
                      color: theme.colorScheme.tertiary,
                      borderRadius: BorderRadius.circular(8.0),
                      boxShadow: [
                        BoxShadow(
                          color:
                              theme.shadowColor.withAlpha((0.3 * 255).toInt()),
                          blurRadius: 6,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: LapTimeTable(
                      lapTimes: lapTimes,
                      scrollController: _scrollController,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0),
                  child: Row(
                    children: [
                      Expanded(
                        child: ElevatedButton(
                          onPressed: registerLap,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: theme.colorScheme.primary,
                            padding: EdgeInsets.symmetric(
                                vertical: constraints.maxWidth * 0.08),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(30.0),
                            ),
                          ),
                          child: const Text(
                            'Registrovat kolo',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: _endRace,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: theme.colorScheme.primary,
                            padding: EdgeInsets.symmetric(
                                vertical: constraints.maxWidth * 0.08),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(30.0),
                            ),
                          ),
                          child: const Text(
                            'STOP',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Text(
                    'Aktuální pozice: Režim testování, pozice není k dispozici',
                    style: TextStyle(
                      fontSize: constraints.maxHeight * 0.02,
                      color: theme.colorScheme.onSurface
                          .withAlpha((0.7 * 255).toInt()),
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
                const SizedBox(height: 16),
              ],
            ),
          );
        },
      ),
    );
  }
}
