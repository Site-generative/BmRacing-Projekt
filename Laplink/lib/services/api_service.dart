import 'dart:convert';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  late String _baseUrl;
  late String _apiKey;

  // private constructor
  ApiClient._internal();

  factory ApiClient() {
    return _instance;
  }

  Future<void> initialize() async {
    await dotenv.load(fileName: "data.env");
    final baseUrl = dotenv.env['API_BASE_URL'];
    final apiKey = dotenv.env['API_KEY'];
    if (baseUrl == null) {
      throw Exception('API_BASE_URL is not defined in .env file');
    }
    if (apiKey == null) {
      throw Exception('API_KEY is not defined in .env file');
    }
    _baseUrl = baseUrl;
    _apiKey = apiKey;
  }

  Map<String, String> _getHeaders() {
    return {
      'Content-Type': 'application/json',
      'X-API-KEY': _apiKey,
    };
  }

  Future<bool> login(String user, String password) async {
    final url = Uri.parse('$_baseUrl/auth/app/login');
    final response = await http.post(
      url,
      headers: _getHeaders(),
      body: jsonEncode({
        'web_user': user,
        'web_password': password,
      }),
    );

    if (response.statusCode == 200) {
      final responseBody = json.decode(utf8.decode(response.bodyBytes));
      return responseBody['message'] == 'Authentication successful';
    } else if (response.statusCode == 404) {
      throw LoginException('Uživatel nenalezen');
    } else if (response.statusCode == 400) {
      throw LoginException('Špatné jméno nebo heslo');
    } else {
      throw LoginException('Nepovedlo se přihlásit');
    }
  }

  Future<dynamic> getUserRaces(String webUser) async {
    final url = Uri.parse('$_baseUrl/drivers/drivers/$webUser/races');
    final response = await http.get(url, headers: _getHeaders());
    if (response.statusCode == 200) {
      final responseData = json.decode(utf8.decode(response.bodyBytes));
      return responseData;
    } else {
      throw Exception('Došlo k chybě při načítání závodů');
    }
  }

  Future<dynamic> getAllUserRaces(String webUser) async {
    final url = Uri.parse('$_baseUrl/drivers/all/$webUser/races');
    final response = await http.get(url, headers: _getHeaders());
    if (response.statusCode == 200) {
      final responseData = json.decode(utf8.decode(response.bodyBytes));
      return responseData;
    } else {
      throw Exception('Došlo k chybě při načítání závodů');
    }
  }

  Future<dynamic> getAllUserSeriesRaces(String webUser) async {
    final url = Uri.parse('$_baseUrl/drivers/get/grouped/series/events/driver')
        .replace(queryParameters: {'web_user': webUser});
    final response = await http.get(url, headers: _getHeaders());
    if (response.statusCode == 200) {
      final responseData = json.decode(utf8.decode(response.bodyBytes));
      return responseData;
    } else {
      throw Exception('Došlo k chybě při načítání závodů');
    }
  }

  Future<dynamic> getAllSeriesRaces() async {
    final url = Uri.parse('$_baseUrl/drivers/get/grouped/series/events');
    final response = await http.get(url, headers: _getHeaders());
    if (response.statusCode == 200) {
      final responseData = json.decode(utf8.decode(response.bodyBytes));
      return responseData;
    } else {
      throw Exception('Došlo k chybě při načítání závodů');
    }
  }

  Future<dynamic> getAllEventResults(int eventId) async {
    final url = Uri.parse('$_baseUrl/results/get/app/event/results')
        .replace(queryParameters: {
      'event_id': eventId.toString(), // <-- Převod na String
    });
    final response = await http.get(url, headers: _getHeaders());
    if (response.statusCode == 200) {
      final responseData = json.decode(utf8.decode(response.bodyBytes));
      return responseData['data'];
    } else {
      throw Exception('Došlo k chybě při načítání výsledků');
    }
  }

  Future<dynamic> getAllSerieRRankings(int serieId) async {
    final url = Uri.parse('$_baseUrl/results/get/series/all-rankings')
        .replace(queryParameters: {
      'series_id': serieId.toString(), // <-- Převod na String
    });
    final response = await http.get(url, headers: _getHeaders());
    if (response.statusCode == 200) {
      final responseData = json.decode(utf8.decode(response.bodyBytes));
      return responseData;
    } else {
      throw Exception('Došlo k chybě při načítání výsledků');
    }
  }

  Future<dynamic> getUserInfo(String webUser) async {
    final url = Uri.parse('$_baseUrl/drivers/get/driver/app/$webUser');
    final response = await http.get(url, headers: _getHeaders());
    if (response.statusCode == 200) {
      final responseData = json.decode(utf8.decode(response.bodyBytes));
      return responseData;
    } else {
      throw Exception('Došlo k chybě při načítání informací o uživateli');
    }
  }

  Future<dynamic> getRaceDetail(int id) async {
    final url = Uri.parse('$_baseUrl/events/get/event/detail/$id');
    final response = await http.get(url, headers: _getHeaders());
    if (response.statusCode == 200) {
      final responseData = json.decode(utf8.decode(response.bodyBytes));
      return responseData['data'];
    } else {
      throw Exception('Došlo k chybě při načítání informací o závodu');
    }
  }

  Future<dynamic> postLapData(
      int eventId, String webUser, String laptime, int eventPhaseId,
      {int ttl = 1}) async {
    final url = Uri.parse('$_baseUrl/laps/event/lap/data');
    final response = await http.post(
      url,
      headers: _getHeaders(),
      body: jsonEncode({
        'event_id': eventId,
        'web_user': webUser,
        'laptime': laptime,
        'event_phase_id': eventPhaseId,
      }),
    );

    //Pokud se nepovede odeslat data, zkusí se to znovu, ale max 5x
    if (response.statusCode != 200) {
      if (ttl < 5) {
        await postLapData(eventId, webUser, laptime, eventPhaseId,
            ttl: ttl + 1);
      } else {
        throw Exception('Něco se pokazilo ${response.body}');
      }
    }
  }

  Future<dynamic> postDriverEventState(
      String webUser, int eventId, bool dnf, bool finished) async {
    final url = Uri.parse('$_baseUrl/drivers/event/driver/state/$webUser');
    final response = await http.put(
      url,
      headers: _getHeaders(),
      body: jsonEncode({
        'event_id': eventId,
        'dnf': dnf,
        'finished': finished,
      }),
    );
    print('Data: $webUser, $eventId, $dnf, $finished');
    print('Request: ${response.request}');
    print('Response: ${response.body}');

    if (response.statusCode >= 400) {
      throw Exception('Něco se pokazilo: ${response.body}');
    }
    return jsonDecode(response.body);
  }

  Future<dynamic> getEventPhaseResults(
      String webUser, int eventId, int eventPhaseId) async {
    final url = Uri.parse('$_baseUrl/laps/get/event/phase/driver/results')
        .replace(queryParameters: {
      'web_user': webUser,
      'event_id': eventId.toString(),
      'event_phase_id': eventPhaseId.toString(),
    });
    final response = await http.get(url, headers: _getHeaders());
    if (response.statusCode == 200) {
      final responseData = json.decode(utf8.decode(response.bodyBytes));
      return responseData;
    } else {
      throw Exception('Došlo k chybě při načítání výsledků');
    }
  }
}

class LoginException implements Exception {
  final String message;
  LoginException(this.message);

  @override
  String toString() => message;
}
