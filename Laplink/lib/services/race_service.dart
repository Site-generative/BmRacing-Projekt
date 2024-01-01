import 'package:shared_preferences/shared_preferences.dart';
import 'package:bm_racing_app/services/api_service.dart';

class RaceService {
  static Future<List<Map<String, dynamic>>> getDriverRaces() async {
    final prefs = await SharedPreferences.getInstance();
    final apiClient = ApiClient();
    await apiClient.initialize();

    // Získání uživatelského jména z `SharedPreferences`
    String? webUser = prefs.getString('web_user');
    if (webUser == null) {
      return []; // Pokud není uživatel přihlášen
    }

    try {
      final races = await apiClient.getUserRaces(webUser);
      List<Map<String, dynamic>> racesList =
          List<Map<String, dynamic>>.from(races);

      return racesList;
    } catch (error) {
      print('Chyba při načítání závodů: $error');
      return [];
    }
  }

  static Future<void> saveEventPhase(int eventPhaseId, int raceId) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt('event_phase_id', eventPhaseId);
    await prefs.setInt('race_id', raceId);
  }

  static Future<String?> getWebUser() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('web_user');
  }

  static Future<void> clearAllRaceCompleted() async {
    final prefs = await SharedPreferences.getInstance();

    final keys = prefs.getKeys();

    final keysToRemove = keys.where((key) => key.startsWith('race_completed_'));

    for (var key in keysToRemove) {
      await prefs.remove(key);
    }
  }
}
