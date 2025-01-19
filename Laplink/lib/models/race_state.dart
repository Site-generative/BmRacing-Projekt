import 'package:flutter/material.dart';

class RaceState extends ChangeNotifier {
  bool raceStarted = false;
  bool raceEnded = false;
  int completedLaps = 0;
  double? fastestLap;
  double currentLatitude = 0.0;
  double currentLongitude = 0.0;
  List<double> lapTimes = [];

  Stopwatch stopwatch = Stopwatch();

  void startRace() {
    raceStarted = true;
    stopwatch.start();
    notifyListeners();
  }

  void endRace() {
    raceEnded = true;
    stopwatch.stop();
    notifyListeners();
  }

  void addLap(double lapTime) {
    lapTimes.add(lapTime);
    completedLaps++;
    if (fastestLap == null || lapTime < fastestLap!) {
      fastestLap = lapTime;
    }
    notifyListeners();
  }

  void updateLocation(double latitude, double longitude) {
    currentLatitude = latitude;
    currentLongitude = longitude;
    notifyListeners();
  }

  void resetRace() {
    raceStarted = false;
    raceEnded = false;
    completedLaps = 0;
    fastestLap = null;
    lapTimes.clear();
    stopwatch.reset();
    notifyListeners();
  }
}
