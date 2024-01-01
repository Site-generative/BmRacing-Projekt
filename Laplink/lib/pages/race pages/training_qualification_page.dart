// ignore_for_file: unused_field

import 'dart:async';
import 'dart:typed_data';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter_blue_plus/flutter_blue_plus.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:bm_racing_app/components/lap_time_table.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:bm_racing_app/services/api_service.dart';
import 'package:bm_racing_app/pages/race%20pages/race_finished_page.dart';
import 'package:keep_screen_on/keep_screen_on.dart';
import 'package:bm_racing_app/utils/time_formatters.dart';
import 'package:bm_racing_app/components/stat_card.dart';
import 'package:bm_racing_app/services/background_service.dart';
import 'package:battery_plus/battery_plus.dart';
import 'package:bm_racing_app/utils/battery_helper.dart';

class TrainingQualificationPage extends StatefulWidget {
  final BluetoothDevice device;
  final BluetoothCharacteristic characteristic;

  const TrainingQualificationPage({
    super.key,
    required this.device,
    required this.characteristic,
  });

  @override
  _TrainingQualificationPageState createState() =>
      _TrainingQualificationPageState();
}

class _TrainingQualificationPageState extends State<TrainingQualificationPage>
    with WidgetsBindingObserver {
  // --------------------------------------------------
  //  Hlavní proměnné
  // --------------------------------------------------
  List<int> buffer = [];
  String currentTime = '';
  int completedLaps = 0;
  List<double> lapTimes = [];
  bool raceStarted = false;
  bool raceEnded = false;

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
  double currentSpeed = 0.0;

  Timer? _notificationTimer;
  late String notificationMessage;
  double? fastestLap;
  int lapsOnTires = 0;

  final ScrollController _scrollController = ScrollController();
  final _bufferStreamController = StreamController<Uint8List>.broadcast();
  late StreamSubscription _bufferSubscription;
  bool isNotificationActive = false;
  bool isCalibrating = true;
  final StatCard statCard = StatCard();
  final BatteryHelper batteryHelper = BatteryHelper();
  late BackgroundService _backgroundService;

  final Battery _battery = Battery();
  int? batteryLevel = 69;
  bool isBatteryLevelKnown = false;

  // Pro lineární interpolaci + fix
  double? _lastLat;
  double? _lastLon;
  DateTime? _lastGnssTime;
  double? _lastCrossingSec;

  @override
  void initState() {
    super.initState();

    isCalibrating = true;
    buffer.clear();
    stopwatch
      ..stop()
      ..reset();
    raceStarted = false;
    raceEnded = false;
    completedLaps = 0;
    lapTimes.clear();

    _backgroundService = BackgroundService(context: context);
    WidgetsBinding.instance.addObserver(this);

    _initializeRaceData();
    _listenToCharacteristic();

    // Po zobrazení => ukážeme kalibrační dialog
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _backgroundService.showCalibrationDialog();
    });

    // Příjem BLE => buffering
    _bufferSubscription = _bufferStreamController.stream.listen((data) {
      buffer.addAll(data as Uint8List);
      _processData();
    });
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused) {
      _backgroundService.enableBackgroundExecution();
    } else if (state == AppLifecycleState.resumed) {
      _backgroundService.disableBackgroundExecution();
    }
  }

  @override
  void dispose() {
    _disconnectDevice();
    _backgroundService.disableBackgroundExecution();
    _bufferSubscription.cancel();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  // --------------------------------------------------
  //  Inicializace závodu
  // --------------------------------------------------
  Future<void> _initializeRaceData() async {
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
      });
    } catch (error) {
      _showMessage('Error při načítání informací o závodě: $error');
    }

    // Případně config RaceBox - vynechán pro stručnost
  }

  List<double> _parseCoordinate(String coordinate) {
    final parts = coordinate.split(',');
    return [double.parse(parts[0]), double.parse(parts[1])];
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

  // --------------------------------------------------
  //  BLE - poslech
  // --------------------------------------------------
  void _listenToCharacteristic() {
    widget.characteristic.setNotifyValue(true).then((_) {
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

  // --------------------------------------------------
  //  Zpracování UBX packetu
  // --------------------------------------------------
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
          buffer.sublist(startIndex, startIndex + packetSize),
        );
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

  // --------------------------------------------------
  //  Dekódování + lineární interpolace
  // --------------------------------------------------
  void _decodePacket(Uint8List payload) {
    // 1) Přečteme polohu, fix atd. (vynecháme nedůležité řádky pro stručnost)
    int fixStatus = payload[20];
    int fixFlags = payload[21];
    bool fixOk = (fixStatus == 3) && ((fixFlags & 0x01) != 0);

    int horizAccRaw = _getUint32(payload, 40);
    double horizAccM = horizAccRaw / 1000.0;

    double newLon = _getInt32(payload, 24) / 1e7;
    double newLat = _getInt32(payload, 28) / 1e7;

    // GNSS time
    int year = _getUint16(payload, 4);
    int month = payload[6];
    int day = payload[7];
    int hour = payload[8];
    int minute = payload[9];
    int second = payload[10];
    int nanoSec = _getInt32(payload, 16);

    DateTime? newGnssTime =
        _buildGnssTime(year, month, day, hour, minute, second, nanoSec);

    // Baterie
    int currentBatteryLevel = payload[67] & 0x7F;

    setState(() {
      // Uložíme pro UI
      batteryLevel = currentBatteryLevel;
      isBatteryLevelKnown = true;
      currentLatitude = newLat;
      currentLongitude = newLon;
      currentTime = DateTime.now().toIso8601String();

      // Kalibrace
      if (isCalibrating && fixOk && (newLat != 0.0 || newLon != 0.0)) {
        isCalibrating = false;
        Navigator.of(context).pop();
      }

      // Zkontrolujeme fix
      if (!fixOk || horizAccM > 3.0) {
        return; // ignorovat
      }

      if (_lastLat != null &&
          _lastLon != null &&
          _lastGnssTime != null &&
          newGnssTime != null) {
        // 2) Ověříme crossing se sign-of-line, ALE navíc zkontrolujeme,
        //    zda průsečík leží v "omezené" části startLine (nikoli na nekonečné přímce).
        double sidePrev = sideOfLine(_lastLat!, _lastLon!, startLineP1[0],
            startLineP1[1], startLineP2[0], startLineP2[1]);
        double sideCurr = sideOfLine(newLat, newLon, startLineP1[0],
            startLineP1[1], startLineP2[0], startLineP2[1]);

        bool signChanged =
            (sidePrev > 0 && sideCurr < 0) || (sidePrev < 0 && sideCurr > 0);
        if (signChanged && !lock && !isCalibrating) {
          // 3) Najdeme param 'alpha' => kde mezi starou a novou polohou k průsečíku došlo
          double alpha = sidePrev.abs() / (sidePrev.abs() + sideCurr.abs());
          Duration dt = newGnssTime.difference(_lastGnssTime!);
          double crossingSec = _lastGnssTime!.millisecondsSinceEpoch / 1000.0 +
              alpha * (dt.inMilliseconds / 1000.0);

          // 4) SPOČTEME reálnou polohu crossingPoint => abychom ověřili, že leží v segmentu startLine
          //    K tomu použijeme lineIntersectionSegment => vrátí param u, jestli je v [0..1].
          //    A param t pro "naší dráhu" je alpha => jestli je v [0..1], OK.
          //    Ale u = param, jestli crossing v segmentu startLineP1->startLineP2.

          // Convert lat/lon do "2D" = klidně jen lat/lon, malé chyby nevadí
          // p0 = _lastLat/lon, p1 = newLat/lon
          // s0 = startLineP1, s1 = startLineP2
          final double oldLat = _lastLat!;
          final double oldLon = _lastLon!;
          final double latDelta = newLat - oldLat;
          final double lonDelta = newLon - oldLon;

          // Bod crossing v lat/lon
          final double crossingLat = oldLat + alpha * latDelta;
          final double crossingLon = oldLon + alpha * lonDelta;

          // Ověříme, zda crossingLat/Lon leží "v úseku" startLineP1 -> startLineP2
          // Budeme dělat tzv. param pro lineSegment. (s0 -> s1)
          double? u = _computeSegmentParam(
            startLineP1[0],
            startLineP1[1],
            startLineP2[0],
            startLineP2[1],
            crossingLat,
            crossingLon,
          );
          // Pokud je u v [0..1], je to v segmentu

          if (u != null && u >= 0.0 && u <= 1.0) {
            // => reálný crossing uvnitř modré zóny
            lock = true;

            if (!raceStarted) {
              stopwatch.start();
              raceStarted = true;
              completedLaps = 1;
              _lastCrossingSec = crossingSec;
            } else {
              if (_lastCrossingSec != null) {
                double lapTime = crossingSec - _lastCrossingSec!;
                _lastCrossingSec = crossingSec;
                registerLapWithTime(lapTime);
              }
            }

            Future.delayed(const Duration(seconds: 2), () {
              lock = false;
            });
          }
        }
      }

      // Uložíme new => last
      _lastLat = newLat;
      _lastLon = newLon;
      if (newGnssTime != null) {
        _lastGnssTime = newGnssTime;
      }

      // Baterie=0 => konec
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
        _endRace();
      }
    });
  }

  // --------------------------------------------------
  //  Registrace kola
  // --------------------------------------------------
  void registerLapWithTime(double lapTime) async {
    if (lapTime > 0.0) {
      if (fastestLap == null || lapTime < fastestLap!) {
        fastestLap = lapTime;
      }
      final apiClient = ApiClient();
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

    stopwatch
      ..stop()
      ..reset()
      ..start();

    completedLaps++;
  }

  // --------------------------------------------------
  //  Pomocná funkce: zjištění param. u => jestli crossing
  //  leží v segmentu startLineP1->startLineP2
  // --------------------------------------------------
  double? _computeSegmentParam(
    double x1lat,
    double x1lon,
    double x2lat,
    double x2lon,
    double px,
    double py,
  ) {
    // budeme se držet lineárního parametru:
    // param = ((Px - X1) dot (X2 - X1)) / |X2-X1|^2
    // v lat/lon rovině
    final double dx = x2lat - x1lat;
    final double dy = x2lon - x1lon;
    final double denom = dx * dx + dy * dy;
    if (denom == 0.0) return null; // degenerate line

    final double pxRel = px - x1lat;
    final double pyRel = py - x1lon;

    final double dot = (pxRel * dx) + (pyRel * dy);
    final double param = dot / denom;
    return param;
  }

  // --------------------------------------------------
  //  Konec závodu
  // --------------------------------------------------
  void _endRace() async {
    raceEnded = true;
    final isDisconnected = await _disconnectDevice();
    await _backgroundService.disableBackgroundExecution();

    var currentState = await widget.device.connectionState.first;
    if (currentState != BluetoothConnectionState.connected && isDisconnected) {
      var validLapTimes = lapTimes.where((time) => time > 0).toList();
      double fastest =
          validLapTimes.isNotEmpty ? validLapTimes.reduce(min) : 0.0;
      String message = lapTimes.isEmpty
          ? 'Závod byl ukončen bez ujetého kola'
          : 'Nejrychlejší kolo trvalo: ';

      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => RaceFinishedPage(
            message: message,
            time: fastest,
          ),
        ),
      );
    } else {
      _showMessage(
          'Nepodařilo se odpojit od zařízení a tím pádem ukončit závod');
    }
  }

  Future<bool> _disconnectDevice() async {
    try {
      await widget.characteristic.setNotifyValue(false);
      var currentState = await widget.device.connectionState.first;
      if (currentState == BluetoothConnectionState.connected) {
        await widget.device.disconnect();
        return true;
      } else {
        return true;
      }
    } catch (e) {
      _showMessage('Selhání odpojení od ${widget.device.platformName}: $e');
      return false;
    }
  }

  // --------------------------------------------------
  //  Pomocné funkce
  // --------------------------------------------------
  DateTime? _buildGnssTime(int year, int month, int day, int hour, int minute,
      int second, int nano) {
    if (year < 1970 || month < 1 || day < 1) {
      return null;
    }
    try {
      int micros = (nano / 1000.0).round();
      int msPart = micros ~/ 1000;
      int usPart = micros % 1000;
      return DateTime.utc(
          year, month, day, hour, minute, second, msPart, usPart * 1000);
    } catch (_) {
      return null;
    }
  }

  double sideOfLine(double lat, double lon, double x1lat, double x1lon,
      double x2lat, double x2lon) {
    // cross = (x2lat - x1lat)*(lon - x1lon) - (x2lon - x1lon)*(lat - x1lat)
    return (x2lat - x1lat) * (lon - x1lon) - (x2lon - x1lon) * (lat - x1lat);
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

  void _showMessage(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 200),
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
              onPressed: () => Navigator.of(context).pop(),
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

  // --------------------------------------------------
  //  BUILD
  // --------------------------------------------------
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
                // Stopky v UI (pouze pro orientaci jezdce)
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
                // Stat Cards
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
                            ? TimeFormatters.formatLapTimeToTable(fastestLap!)
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
                  child: ElevatedButton(
                    onPressed: _endRace,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: theme.colorScheme.primary,
                      padding: EdgeInsets.all(constraints.maxWidth * 0.08),
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
                // Debug - pozice
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
          );
        },
      ),
    );
  }
}
