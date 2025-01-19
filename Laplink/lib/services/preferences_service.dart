import 'package:permission_handler/permission_handler.dart';
import 'package:shared_preferences/shared_preferences.dart';

class PreferencesService {
  static Future<void> checkPermissions() async {
    if (await Permission.bluetooth.isGranted &&
        await Permission.location.isGranted &&
        await Permission.storage.isGranted) {
      return;
    } else {
      await [Permission.bluetooth, Permission.location, Permission.storage]
          .request();
    }
  }

  static Future<SharedPreferences> getPreferences() async {
    return SharedPreferences.getInstance();
  }

  static Future<int?> getEventPhaseId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getInt('event_phase_id');
  }

  static Future<int?> getRaceId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getInt('race_id');
  }

  static Future<void> saveEventPhase(int eventPhaseId, int raceId) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt('event_phase_id', eventPhaseId);
    await prefs.setInt('race_id', raceId);
  }

  static Future<void> saveLapsOnTires(
      int raceId, int eventPhaseId, int laps) async {
    final prefs = await SharedPreferences.getInstance();
    final key = 'laps_on_tires_${raceId}_$eventPhaseId';
    await prefs.setInt(key, laps);
  }

  static Future<int> loadLapsOnTires(int raceId, int eventPhaseId) async {
    final prefs = await SharedPreferences.getInstance();
    final key = 'laps_on_tires_${raceId}_$eventPhaseId';
    return prefs.getInt(key) ?? 0;
  }
}
