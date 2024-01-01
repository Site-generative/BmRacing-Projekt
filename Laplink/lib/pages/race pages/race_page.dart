// ignore_for_file: unused_field

import 'dart:async';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter_blue_plus/flutter_blue_plus.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'dart:math';

import 'package:shared_preferences/shared_preferences.dart';
import 'package:bm_racing_app/services/api_service.dart';
import 'package:bm_racing_app/pages/race%20pages/race_finished_page.dart';
import 'package:keep_screen_on/keep_screen_on.dart';
import 'package:bm_racing_app/utils/time_formatters.dart';
import 'package:bm_racing_app/components/stat_card.dart';
import 'package:bm_racing_app/services/background_service.dart';
import 'package:bm_racing_app/components/lap_time_table.dart';
import 'package:battery_plus/battery_plus.dart';
import 'package:bm_racing_app/utils/battery_helper.dart';

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
  // ------------------------------------------------------
  // Proměnné
  // ------------------------------------------------------
  List<int> buffer = [];

  double currentSpeed = 0.0;
  String currentTime = '';
  double? fastestLap;
  int completedLaps = 0;
  int numberOfLaps = 0;
  List<double> lapTimes = [];

  double currentLatitude = 0.0;
  double currentLongitude = 0.0;

  bool raceStarted = false;
  bool raceEnded = false;
  bool lock = false;
  bool isCalibrating = true;
  bool isLoading = true;
  bool dnf = false;

  final double maxValidSpeed = 250.0;
  final ScrollController _scrollController = ScrollController();
  final _bufferStreamController = StreamController<Uint8List>.broadcast();
  late StreamSubscription _bufferSubscription;

  final Stopwatch stopwatch = Stopwatch();
  late List<double> startLineP1;
  late List<double> startLineP2;

  int eventId = 0;
  int eventPhaseId = 0;
  String webUser = '';
  Map<String, dynamic>? raceInfo;

  Timer? _notificationTimer;
  bool isNotificationActive = false;

  final BatteryHelper batteryHelper = BatteryHelper();
  final Battery _battery = Battery();
  BatteryState _batteryState = BatteryState.unknown;
  int? batteryLevel = 0;
  bool isBatteryLevelKnown = false;

  int lapsOnTires = 0;
  late BackgroundService _backgroundService;
  final StatCard statCard = StatCard();

  // Držíme si minulou GPS pozici pro lineární interpolaci
  double? _lastLat;
  double? _lastLon;
  DateTime? _lastGnssTime;

  @override
  void initState() {
    super.initState();

    // Základní nastavení
    isCalibrating = true;
    buffer.clear();
    stopwatch
      ..reset()
      ..stop();
    raceStarted = false;
    raceEnded = false;
    completedLaps = 0;
    lapTimes.clear();

    _backgroundService = BackgroundService(context: context);
    WidgetsBinding.instance.addObserver(this);

    _initializeRaceData();
    _listenToCharacteristic();

    // Zobrazení dialogu "kalibrace"
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _backgroundService.showCalibrationDialog();
    });

    // Poslech na příchozí BLE data
    _bufferSubscription = _bufferStreamController.stream.listen((data) {
      buffer.addAll(data as Uint8List);
      _processData();
    });

    // Sledování stavu baterie
    _battery.onBatteryStateChanged.listen((BatteryState state) {
      setState(() {
        _batteryState = state;
      });
    });
  }

  // ------------------------------------------------------
  // Lifecycle & notifikace
  // ------------------------------------------------------
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused) {
      _backgroundService.enableBackgroundExecution();
      if (!isNotificationActive) {}
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

  // ------------------------------------------------------
  // Inicializace závodu
  // ------------------------------------------------------
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
        // startLine definován
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

  // Příznak ukončení závodu na serveru
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
      _showMessage('Nastala chyba při nastavení stavu závodu: $error');
    }
  }

  // ------------------------------------------------------
  // BLE
  // ------------------------------------------------------
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

  // ------------------------------------------------------
  //  Dekódování (lineární interpolace + segment check)
  // ------------------------------------------------------
  void _decodePacket(Uint8List payload) {
    if (raceEnded || payload.isEmpty) return;

    // 1) Čtení fix
    int fixStatus = payload[20]; // 0=no,2=2D,3=3D
    int fixFlags = payload[21]; // bit 0 = valid fix
    bool fixOk = (fixStatus == 3) && ((fixFlags & 0x01) != 0);

    // 2) Poloha
    double newLon = _getInt32(payload, 24) / 1e7;
    double newLat = _getInt32(payload, 28) / 1e7;

    // Baterie
    int currentBatteryLevel = payload[67] & 0x7F;

    // Kalibrace
    if (isCalibrating && fixOk && (newLat != 0.0 || newLon != 0.0)) {
      isCalibrating = false;
      Navigator.of(context).pop();
    }

    setState(() {
      batteryLevel = currentBatteryLevel;
      isBatteryLevelKnown = true;
      currentLatitude = newLat;
      currentLongitude = newLon;
      currentTime = DateTime.now().toIso8601String();

      // Baterie => dnf?
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
        return;
      }

      // Když fix není ok, ignorujeme
      if (!fixOk) {
        return;
      }

      // 3) Zkusíme spočítat crossing
      if (_lastLat != null && _lastLon != null) {
        double sidePrev = _sideOfLine(_lastLat!, _lastLon!, startLineP1[0],
            startLineP1[1], startLineP2[0], startLineP2[1]);
        double sideCurr = _sideOfLine(newLat, newLon, startLineP1[0],
            startLineP1[1], startLineP2[0], startLineP2[1]);

        bool signChanged =
            (sidePrev > 0 && sideCurr < 0) || (sidePrev < 0 && sideCurr > 0);

        if (signChanged && !lock && !isCalibrating) {
          // 4) alpha => lineární interpolace
          double alpha = sidePrev.abs() / (sidePrev.abs() + sideCurr.abs());

          // (Pro plnou robustnost bychom měli i GNSS time – offset 4..16,
          //  ale tady zůstaneme u stopek, jak to máte nastavené.)
          // Můžeme reálně se držet stopek, nebo zkusit "přesný crossing time".
          // Zde ponecháme stopwatch styl, abychom zachovali logiku vaší app.

          // 5) Vypočítáme "bod crossing" v lat/lon
          double oldLat = _lastLat!;
          double oldLon = _lastLon!;
          double latDelta = newLat - oldLat;
          double lonDelta = newLon - oldLon;

          double crossingLat = oldLat + alpha * latDelta;
          double crossingLon = oldLon + alpha * lonDelta;

          // 6) Zjistíme, zda crossing leží na segmentu startLineP1->startLineP2
          //    => spočteme param u
          double? u = _computeSegmentParam(
            startLineP1[0],
            startLineP1[1],
            startLineP2[0],
            startLineP2[1],
            crossingLat,
            crossingLon,
          );
          if (u != null && u >= 0.0 && u <= 1.0) {
            lock = true;

            if (!raceStarted) {
              // Start závodu
              stopwatch.start();
              raceStarted = true;
              completedLaps = 1;
            } else {
              // Další kolo
              _registerLap();
            }

            Future.delayed(const Duration(seconds: 2), () {
              lock = false;
            });
          }
        }
      }

      _lastLat = newLat;
      _lastLon = newLon;
    });
  }

  // ------------------------------------------------------
  // Registrace kola + stopek
  // ------------------------------------------------------
  void _registerLap() async {
    // Tady se držíme původního stylu => stopek
    stopwatch.stop();
    double lapTime = stopwatch.elapsedMilliseconds / 1000.0;

    if (lapTime > 0.0) {
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

      setState(() {
        lapTimes.add(lapTime);
        if (fastestLap == null || lapTime < fastestLap!) {
          fastestLap = lapTime;
        }
      });

      lapsOnTires++;
      await _saveLapsOnTires(eventId, lapsOnTires);

      if (completedLaps >= numberOfLaps) {
        _endRace();
      }
      completedLaps++;
    }

    // Reset stopek pro další kolo
    stopwatch
      ..reset()
      ..start();
  }

  // ------------------------------------------------------
  // Konec závodu
  // ------------------------------------------------------
  void _endRace() async {
    raceEnded = true;
    stopwatch.stop();

    // Součet kol
    double totalRaceTime = lapTimes.fold(0, (a, b) => a + b);

    final isDisc = await _disconnectDevice();
    await _backgroundService.disableBackgroundExecution();

    if (isDisc) {
      // Stav závodu na serveru
      await _markRaceAsCompleted(eventId, dnf);

      if (dnf) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => RaceFinishedPage(
              message: 'Byl jste DNF a závod byl ukončen. Celkový čas: ',
              time: totalRaceTime,
            ),
          ),
        );
      } else {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => RaceFinishedPage(
              message: 'Celkově jste ujeli závod za: ',
              time: totalRaceTime,
            ),
          ),
        );
      }
    } else {
      _showMessage(
          'Nelze ukončit závod, zařízení není připojeno, zkuste to prosím znovu.');
    }
  }

  void _registerLapManually() {
    stopwatch.stop();
    double lapTime = stopwatch.elapsedMilliseconds / 1000.0;
    stopwatch
      ..reset()
      ..start();
    _registerLap();
  }

  // ------------------------------------------------------
  // Výpočet parametru "u" => jestli crossing bod leží
  // v segmentu startLineP1->startLineP2
  // ------------------------------------------------------
  double? _computeSegmentParam(
    double x1lat,
    double x1lon,
    double x2lat,
    double x2lon,
    double px,
    double py,
  ) {
    final double dx = x2lat - x1lat;
    final double dy = x2lon - x1lon;
    final double denom = dx * dx + dy * dy;
    if (denom == 0.0) return null;

    final double pxRel = px - x1lat;
    final double pyRel = py - x1lon;

    final double dot = (pxRel * dx) + (pyRel * dy);
    final double param = dot / denom;
    return param;
  }

  // ------------------------------------------------------
  // sideOfLine
  // ------------------------------------------------------
  double _sideOfLine(double lat, double lon, double x1lat, double x1lon,
      double x2lat, double x2lon) {
    // cross = (x2lat - x1lat)*(lon - x1lon) - (x2lon - x1lon)*(lat - x1lat)
    return (x2lat - x1lat) * (lon - x1lon) - (x2lon - x1lon) * (lat - x1lat);
  }

  // ------------------------------------------------------
  // Pomocné funkce
  // ------------------------------------------------------
  void _showMessage(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        duration: const Duration(seconds: 3),
      ),
    );
  }

  List<double> _parseCoordinate(String coordinate) {
    final parts = coordinate.split(',');
    return [double.parse(parts[0]), double.parse(parts[1])];
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

  Future<int> _loadLapsOnTires(int eventId) async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getInt('laps_on_tires_$eventId') ?? 0;
  }

  Future<void> _saveLapsOnTires(int eventId, int laps) async {
    final prefs = await SharedPreferences.getInstance();
    prefs.setInt('laps_on_tires_$eventId', laps);
  }

  Future<bool> _disconnectDevice() async {
    try {
      await widget.characteristic.setNotifyValue(false);
      var currentState = await widget.device.connectionState.first;
      if (currentState == BluetoothConnectionState.connected) {
        await widget.device.disconnect();
        setState(() {
          batteryLevel = 0;
        });
        return true;
      } else {
        setState(() {
          batteryLevel = 0;
        });
        return true;
      }
    } catch (e) {
      return false;
    }
  }

  Future<void> _resetLapsOnTires(int eventId) async {
    setState(() {
      lapsOnTires = 0;
    });
    final prefs = await SharedPreferences.getInstance();
    prefs.remove('laps_on_tires_$eventId');
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

  Color _getLapTimeColor() {
    if (lapTimes.isEmpty) return Colors.green;
    final lastLap = lapTimes.last;
    return (fastestLap == null || lastLap < fastestLap!)
        ? Colors.green
        : lastLap > fastestLap!
            ? Colors.red
            : Colors.green;
  }

  // ------------------------------------------------------
  // BUILD
  // ------------------------------------------------------
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final size = MediaQuery.of(context).size;

    return Scaffold(
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
        centerTitle: true,
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
                            : '0:00.00',
                        valueColor: _getLapTimeColor(),
                        height: statCardHeight,
                        width: statCardWidth,
                      ),
                      statCard.buildStatCard(
                        context: context,
                        title: 'Nejrychlejší kolo',
                        value: fastestLap != null
                            ? TimeFormatters.formatLapTimeToTable(fastestLap!)
                            : '0:00.00',
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
                SizedBox(height: 16),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0),
                  child: ElevatedButton(
                    onPressed: () {
                      dnf = true;
                      _endRace();
                    },
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
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Text(
                    'Aktuální pozice: '
                    '${currentLatitude.toStringAsFixed(7)}, '
                    '${currentLongitude.toStringAsFixed(7)}',
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
