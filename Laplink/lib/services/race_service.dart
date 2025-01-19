import 'package:shared_preferences/shared_preferences.dart';
import 'package:laplink/services/api_service.dart';

class RaceService {
  /// Získání závodů pro uživatele z API a přidání informace, zda byl závod dokončen
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

  /// Uloží ID fáze a závodu do `SharedPreferences`
  static Future<void> saveEventPhase(int eventPhaseId, int raceId) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt('event_phase_id', eventPhaseId);
    await prefs.setInt('race_id', raceId);
  }

  /// Získání uživatelského jména uloženého v `SharedPreferences`
  static Future<String?> getWebUser() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('web_user');
  }

  /// Vymazání všech klíčů závodů označených jako dokončené
  static Future<void> clearAllRaceCompleted() async {
    final prefs = await SharedPreferences.getInstance();

    // Získání všech klíčů
    final keys = prefs.getKeys();

    // Filtrování klíčů začínajících na "race_completed_"
    final keysToRemove = keys.where((key) => key.startsWith('race_completed_'));

    // Smazání vybraných klíčů
    for (var key in keysToRemove) {
      await prefs.remove(key);
    }
  }
}
