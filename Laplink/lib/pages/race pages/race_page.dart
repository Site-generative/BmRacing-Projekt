// ignore_for_file: unused_field

import 'dart:async';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter_blue_plus/flutter_blue_plus.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:laplink/utils/battery_helper.dart';
import 'dart:math';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:laplink/services/api_service.dart';
import 'package:laplink/pages/race%20pages/race_finished_page.dart';
import 'package:keep_screen_on/keep_screen_on.dart';
import 'package:awesome_notifications/awesome_notifications.dart';
import 'package:laplink/utils/time_formatters.dart';
import 'package:laplink/components/stat_card.dart';
import 'package:laplink/services/background_service.dart';
import 'package:laplink/components/lap_time_table.dart';
import 'package:battery_plus/battery_plus.dart';

class RacePage extends StatefulWidget {
  final BluetoothDevice device;
  final BluetoothCharacteristic characteristic;

  const RacePage({
    super.key,
    required this.device,
    required this.characteristic,
  });

  @override
  _RacePageState createState() => _RacePageState();
}

class _RacePageState extends State<RacePage> with WidgetsBindingObserver {
  List<int> buffer = [];
  double currentSpeed = 0.0;
  String currentTime = '';
  double? fastestLap;
  int completedLaps = 0;
  int numberOfLaps = 0;
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
  bool isLoading = true;
  Timer? _notificationTimer;
  bool isNotificationActive = false;

  final ScrollController _scrollController = ScrollController();
  final _bufferStreamController = StreamController<Uint8List>.broadcast();
  late StreamSubscription _bufferSubscription;
  bool isCalibrating = true;
  final StatCard statCard = StatCard();
  final BatteryHelper batteryHelper = BatteryHelper();
  late BackgroundService _backgroundService;
  bool dnf = false;
  int lapsOnTires = 0;

  final Battery _battery = Battery();
  BatteryState _batteryState = BatteryState.unknown;
  int? batteryLevel = 0;
  bool isBatteryLevelKnown = false; // Indikátor, zda je hodnota baterie známa

  bool lowBatteryWarningShown = false;
  bool criticalBatteryWarningShown = false;
  bool isCharging = false;

  Timer? _connectionStateTimer;
  bool _ignoreConnectionState = true;

  @override
  void initState() {
    super.initState();

    _connectionStateTimer = Timer(const Duration(seconds: 3), () {
      _ignoreConnectionState = false;
      _listenToDeviceConnectionState(); // Spuštění sledování připojení
    });

    // Resetování stavu
    isCalibrating = true; // Začátek kalibrace
    buffer.clear(); // Vymazání bufferu
    stopwatch.reset(); // Reset stopek
    stopwatch.stop();
    raceStarted = false; // Reset stavu závodu
    raceEnded = false;
    completedLaps = 0;
    lapTimes.clear(); // Vymazání seznamu časů kol
    currentLatitude = 0.0;
    currentLongitude = 0.0;
    lock = false; // Reset zámku

    // Inicializace dalších komponent
    _backgroundService = BackgroundService(context: context);
    WidgetsBinding.instance.addObserver(this);
    _initializeRaceData();
    _listenToCharacteristic();
    checkNotificationPermission();
    _initializeNotifications();
    _backgroundService.showCalibrationDialog();

    _bufferSubscription = _bufferStreamController.stream
        .transform(StreamTransformer.fromHandlers(handleData: (data, sink) {
      Future.delayed(const Duration(milliseconds: 300), () {
        sink.add(data);
      });
    })).listen((data) {
      buffer.addAll(data as Uint8List);
      _processData();
    });

    _battery.onBatteryStateChanged.listen((BatteryState state) {
      setState(() {
        _batteryState = state;
      });
    });
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused) {
      _backgroundService.enableBackgroundExecution();
      if (!isNotificationActive) {
        _startUpdatingNotification();
      }
    } else if (state == AppLifecycleState.resumed) {
      _backgroundService.disableBackgroundExecution();
      _cancelNotification();
    }
  }

  void checkNotificationPermission() async {
    bool isAllowed = await AwesomeNotifications().isNotificationAllowed();
    if (!isAllowed) {
      await AwesomeNotifications().requestPermissionToSendNotifications();
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

  void _listenToDeviceConnectionState() {
    widget.device.connectionState.listen((state) {
      if (_ignoreConnectionState) return; // Ignorace během kalibrace

      if (state == BluetoothConnectionState.disconnected) {
        setState(() {
          dnf = true;
        });
        _endRace();
      }
    });
  }

  void _startUpdatingNotification() {
    if (isNotificationActive) return;

    _notificationTimer?.cancel();
    _notificationTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (isNotificationActive) return;

      String currentTime = TimeFormatters.formattedStopwatchTime(stopwatch);
      _showPersistentNotification(currentTime);
      isNotificationActive = true;
    });
  }

  void _cancelNotification() {
    _notificationTimer?.cancel();
    _notificationTimer = null;
    isNotificationActive = false;
    AwesomeNotifications().cancel(1);
  }

  void _showPersistentNotification(String time) {
    AwesomeNotifications().createNotification(
      content: NotificationContent(
        id: 1,
        channelKey: 'race_channel',
        title: "Závod",
        body: 'Aplikace je spuštěna na pozadí',
        notificationLayout: NotificationLayout.Default,
        displayOnForeground: true,
        displayOnBackground: true,
        locked: true, // Non-dismissible
      ),
    );
  }

  @override
  void dispose() {
    _disconnectDevice();
    _backgroundService.disableBackgroundExecution();
    _bufferSubscription.cancel();
    WidgetsBinding.instance.removeObserver(this);
    _cancelNotification();
    super.dispose();
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
    final prefs = await SharedPreferences.getInstance();
    prefs.remove('laps_on_tires_$eventId');
  }

  Future<void> _initializeRaceData() async {
    setState(() {
      isLoading = true;
    });

    KeepScreenOn.turnOn();

    final prefs = await SharedPreferences.getInstance();
    eventId = prefs.getInt('race_id') ?? 0;
    eventPhaseId = prefs.getInt('event_phase_id') ?? 0;
    webUser = prefs.getString('web_user') ?? '';

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
        numberOfLaps = raceInfo!['number_of_laps'];
        isLoading = false;
      });
    } catch (error) {
      setState(() {
        isLoading = false;
      });
      _showMessage('Nastala chyba při načítání informací o závodě: $error');
    }
  }

  Future<void> _markRaceAsCompleted(int raceId, bool dnf) async {
    try {
      final ApiClient apiClient = ApiClient();
      apiClient.initialize();
      apiClient
          .postDriverEventState(webUser, eventId, dnf, raceEnded)
          .catchError((error, stackTrace) {
        _showMessage('Chyba při odesílání stavu závodu: $error');
      });
    } catch (error) {
      _showMessage('Nastala chyba při nastavení stavu závodu $error');
    }
  }

  List<double> _parseCoordinate(String coordinate) {
    final parts = coordinate.split(',');
    return [double.parse(parts[0]), double.parse(parts[1])];
  }

  void _listenToCharacteristic() {
    widget.characteristic.setNotifyValue(true).then((_) {
      // Nastavení časové bariéry

      widget.characteristic.lastValueStream.listen((value) {
        if (value.isNotEmpty) {
          _bufferStreamController.add(Uint8List.fromList(value));
        }
      }, onError: (error) {
        _showMessage('Chyba při čtení BLE dat: $error');
      });
    }).catchError((error) {
      _showMessage('Chyba při nastavování notifikací: $error');
    });
  }

  void _processData() {
    if (raceEnded || buffer.length < 8) return;

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
          _decodePacket(packet.sublist(6, 6 + length));
        }
      }
    } else {
      buffer.removeAt(0);
    }
  }

  bool _validateChecksum(Uint8List packet) {
    int ckA = 0, ckB = 0;
    for (int i = 2; i < packet.length - 2; i++) {
      ckA = (ckA + packet[i]) & 0xFF;
      ckB = (ckB + ckA) & 0xFF;
    }
    return ckA == packet[packet.length - 2] && ckB == packet[packet.length - 1];
  }

  void _decodePacket(Uint8List payload) {
    if (raceEnded || payload.isEmpty) return;

    currentLongitude = _getInt32(payload, 24) / 1e7;
    currentLatitude = _getInt32(payload, 28) / 1e7;
    double speed = _getInt32(payload, 48) / 1e3 * 3.6;
    int currentBatteryLevel = payload[67] & 0x7F;

    // Přidáme kontrolu na Fix Status, jestli je GNSS fix ve stavu 3D
    int fixStatus =
        payload[20]; // Hodnota Fix Status je na 20. pozici v payloadu

    // Kontrola platnosti polohy a GNSS fixu (3 = 3D fix)
    if (isCalibrating &&
        fixStatus == 3 &&
        (currentLatitude != 0.0 || currentLongitude != 0.0)) {
      isCalibrating = false;
      Navigator.of(context).pop(); // Zavře dialog
    }

    if (speed > maxValidSpeed) return;

    setState(() {
      batteryLevel = currentBatteryLevel;
      isBatteryLevelKnown = true;

      currentTime = DateTime.now().toLocal().toIso8601String();
      currentSpeed = speed;

      bool crossingStart = _isCrossingLine(
          currentLatitude, currentLongitude, startLineP1, startLineP2);

      if (crossingStart && !lock) {
        lock = true;
        if (!raceStarted) {
          stopwatch.start();
          raceStarted = true;
          completedLaps = 1;
        } else {
          registerLap();
        }

        Future.delayed(const Duration(seconds: 5), () {
          lock = false;
        });
      }
      if (currentBatteryLevel == 0) {
        _showMessage('Baterie je na 0%. Zařízení bude odpojeno.');
        Fluttertoast.showToast(
          msg: 'Baterie je na 0%. Zařízení bude odpojeno.',
          toastLength: Toast.LENGTH_LONG,
          gravity: ToastGravity.TOP,
          backgroundColor: Colors.redAccent,
          textColor: Colors.white,
          fontSize: 16.0,
        );
        dnf = true;
        _endRace();
      }
    });
  }

  void registerLap() async {
    double lapTime = stopwatch.elapsedMilliseconds / 1000;

    if (lapTime > 0.0) {
      final apiClient = ApiClient();
      apiClient.initialize();

      apiClient
          .postLapData(eventId, webUser, TimeFormatters.formatLapTime(lapTime),
              eventPhaseId)
          .catchError((error, stackTrace) {
        _showMessage('Chyba při odesílání dat: $error');
      });
      lapTimes.add(lapTime);
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _scrollToBottom();
      });
      if (fastestLap == null || lapTime < fastestLap!) {
        fastestLap = lapTime;
      }
    }
    lapsOnTires++;
    await _saveLapsOnTires(eventId, lapsOnTires);

    stopwatch.stop();
    stopwatch.reset();
    stopwatch.start();

    int currentLap = completedLaps + 1;

    if (currentLap > numberOfLaps) {
      completedLaps = numberOfLaps;
      _endRace();
    } else {
      completedLaps++;
    }
  }

  void _endRace() async {
    setState(() {
      raceEnded = true;
    });
    _ignoreConnectionState = true;
    stopwatch.stop();
    _cancelNotification(); // Zruší notifikaci
    double totalRaceTime = lapTimes.fold(0, (a, b) => a + b);

    final isDisc = await _disconnectDevice();
    await _backgroundService.disableBackgroundExecution();

    if (!isDisc) {
      _showMessage('Nepodařilo se odpojit zařízení (nebo už bylo odpojené), '
          'ale pokračuji v ukončení závodu.');
    }

    // Uložíme stav (včetně DNF) na server
    await _markRaceAsCompleted(eventId, dnf).catchError((error, stackTrace) {
      _showMessage('Chyba při odesílání stavu závodu: $error');
    });

    // A přejdeme na stránku s výsledkem
    if (dnf) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => RaceFinishedPage(
            message: 'Závod ukončen jako DNF.',
            time: totalRaceTime,
          ),
        ),
      );
    } else {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => RaceFinishedPage(
            message: 'Celkový čas závodu: ',
            time: totalRaceTime,
          ),
        ),
      );
    }
  }

  void _handleTireChange() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        final theme = Theme.of(context);
        return AlertDialog(
          backgroundColor: theme.colorScheme.surface, // Dynamic background
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
                foregroundColor: theme.colorScheme.primary, // Dynamic red
              ),
              child: const Text('Zrušit'),
            ),
            TextButton(
              onPressed: () {
                _resetLapsOnTires(eventId).then((_) {
                  setState(() {
                    completedLaps = 0; // Reset aktuální hodnoty
                  });
                });
                Navigator.of(context).pop();
              },
              style: TextButton.styleFrom(
                foregroundColor: Colors.green, // Confirm button color
              ),
              child: const Text('Potvrdit'),
            ),
          ],
        );
      },
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

  Color _getLapTimeColor() {
    if (lapTimes.isEmpty) return Colors.green;

    final lastLap = lapTimes.last;
    if (fastestLap == null || lastLap < fastestLap!) {
      fastestLap = lastLap;
      return Colors.green;
    }

    return lastLap > fastestLap! ? Colors.red : Colors.green;
  }

  bool _isCrossingLine(
      double lat, double lon, List<double> lineP1, List<double> lineP2) {
    double threshold = 0.0001;
    double d1 = _distanceToLineSegment(
        lat, lon, lineP1[0], lineP1[1], lineP2[0], lineP2[1]);
    return d1 < threshold;
  }

  double _distanceToLineSegment(
      double px, double py, double x1, double y1, double x2, double y2) {
    double A = px - x1;
    double B = py - y1;
    double C = x2 - x1;
    double D = y2 - y1;

    double dot = A * C + B * D;
    double lenSq = C * C + D * D;
    double param = (lenSq != 0) ? dot / lenSq : -1;

    double xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    double dx = px - xx;
    double dy = py - yy;
    return sqrt(dx * dx + dy * dy);
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

  Future<bool> _disconnectDevice() async {
    try {
      // Zjistíme, zda je skutečně připojeno
      var currentState = await widget.device.connectionState.first;

      if (currentState == BluetoothConnectionState.connected) {
        // Pokud je connected, vypneme notifikace a zkusíme odpojit
        await widget.characteristic.setNotifyValue(false);
        await widget.device.disconnect();
      }

      // V každém případě nastavíme batteryLevel na nulu (jen pro UI)
      setState(() {
        batteryLevel = 0;
      });
      // Když proběhne vše OK (nebo je už dávno odpojeno), vrátíme true
      return true;
    } catch (e) {
      // Pokud nastala nějaká chyba, odchytíme ji a vrátíme false
      debugPrint('Chyba při odpojování: $e');
      return false;
    }
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        duration: const Duration(seconds: 3),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final size = MediaQuery.of(context).size;

    return PopScope(
      canPop: false,
      child: Scaffold(
        backgroundColor: theme.scaffoldBackgroundColor,
        appBar: AppBar(
          backgroundColor: theme.colorScheme.surface,
          title: Text(
            'Závod',
            style: TextStyle(
              color: theme.colorScheme.onSurface,
              fontWeight: FontWeight.bold,
              fontSize: 20,
            ),
          ),
          elevation: 2,
          centerTitle: true,
          automaticallyImplyLeading: false, // No back button
          actions: [
            // Zobrazíme baterii pouze pokud máme validní data
            Row(
              children: [
                Row(
                  children: [
                    Icon(
                      isBatteryLevelKnown
                          ? batteryHelper.getBatteryIcon(batteryLevel!, false)
                          : Icons
                              .battery_unknown, // Původně tam bylo getBatteryIcon() bez parametrů
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
            final double lapFontSize = constraints.maxHeight * 0.04;

            return Center(
              child: Column(
                children: [
                  const SizedBox(height: 24),
                  // Timer display
                  Text(
                    TimeFormatters.formattedStopwatchTime(stopwatch),
                    style: TextStyle(
                      fontSize: timerFontSize,
                      fontWeight: FontWeight.bold,
                      color: theme.colorScheme.onSurface,
                      letterSpacing: 2.0,
                    ),
                  ),
                  const SizedBox(height: 8),
                  // Lap time display
                  Text(
                    lapTimes.length > 1
                        ? (lapTimes.last == fastestLap
                            ? lapTimes.last.toStringAsFixed(2)
                            : (lapTimes.last - fastestLap!).toStringAsFixed(2))
                        : '',
                    style: TextStyle(
                      fontSize: lapFontSize,
                      fontWeight: FontWeight.w600,
                      color: _getLapTimeColor(),
                    ),
                  ),
                  const SizedBox(height: 16),
                  // Statistics grid (responsive)
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
                              ? lapTimes.last.toStringAsFixed(3)
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
                          value: '$completedLaps / $numberOfLaps',
                          height: statCardHeight,
                          width: statCardWidth,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  // Lap time table
                  ConstrainedBox(
                    constraints: BoxConstraints(
                      maxHeight: size.height * 0.3,
                    ),
                    child: Container(
                      width: size.width * 0.9,
                      decoration: BoxDecoration(
                        color: theme.colorScheme.tertiary,
                        borderRadius: BorderRadius.circular(8.0),
                        boxShadow: [
                          BoxShadow(
                            color: theme.shadowColor
                                .withAlpha((0.3 * 255).toInt()),
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
                  const Spacer(),
                  // STOP button and location aligned to the bottom
                  Column(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16.0),
                        child: ElevatedButton(
                          onPressed: () {
                            dnf = true;
                            _endRace();
                          },
                          onLongPress: registerLap,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: theme.colorScheme.primary,
                            padding:
                                EdgeInsets.all(constraints.maxWidth * 0.08),
                            shape: const CircleBorder(),
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
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Text(
                          'Aktuální pozice: $currentLatitude, $currentLongitude',
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
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}
