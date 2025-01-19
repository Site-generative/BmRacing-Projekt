import 'dart:convert';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;
import 'package:web_socket_channel/web_socket_channel.dart';

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  late String _baseUrl;
  late String _apiKey;

  /*WebSocketChannel? _channel;
  bool _isWebSocketConnected = false;*/

  // private constructor
  ApiClient._internal();

  factory ApiClient() {
    return _instance;
  }

  Future<void> initialize() async {
    await dotenv.load(fileName: ".env.local");
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
      throw Exception('Uživatel nenalezen');
    } else if (response.statusCode == 400) {
      throw Exception('Špatné jméno nebo heslo');
    } else {
      throw Exception('Nepovedlo se přihlásit');
    }
  }

  Future<dynamic> getUserInfo(String webUser) async {
    final url = Uri.parse('$_baseUrl/drivers/get/$webUser');
    final response = await http.get(url, headers: _getHeaders());
    if (response.statusCode == 200) {
      final responseData = json.decode(utf8.decode(response.bodyBytes));
      return responseData;
    } else {
      throw Exception('Došlo k chybě při načítání informací o uživateli');
    }
  }

  Future<dynamic> getUserRaces(String webUser) async {
    final url = Uri.parse('$_baseUrl/drivers/drivers/$webUser/races');
    final response = await http.get(url, headers: _getHeaders());
    if (response.statusCode == 200) {
      final responseData = json.decode(utf8.decode(response.bodyBytes));
      return responseData['data'];
    } else {
      throw Exception('Došlo k chybě při načítání závodů');
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
      int eventId, String webUser, String laptime, int eventPhaseId) async {
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
    if (response.statusCode == 400) {
      throw Exception('Něco se pokazilo ${response.body}');
    }
  }

  Future<dynamic> postDriverEventState(
      String webUser, int eventId, bool dnf, bool finished) async {
    final url = Uri.parse('$_baseUrl/drivers/event/driver/state/$webUser');
    final response = await http.post(
      url,
      headers: _getHeaders(),
      body: jsonEncode({'event_id': eventId, 'dnf': dnf, 'finished': finished}),
    );
    if (response.statusCode == 400) {
      throw Exception('Něco se pokazilo ${response.body}');
    }
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

  /*String getWebSocketUrl(String baseUrl, int eventId, int? driverId) {
    final protocol = baseUrl.startsWith('https://') ? 'wss://' : 'ws://';
    final url = baseUrl.replaceFirst(RegExp(r'https?://'), protocol);
    return '$url/flags/$eventId/${driverId ?? ''}';
  }

  void connectToWebSocket(int eventId, int? driverId) {
    if (_isWebSocketConnected) {
      print('WebSocket již připojen!');
      return;
    }

    final baseUrl = dotenv.env['API_BASE_URL']!;
    final url = getWebSocketUrl(baseUrl, eventId, driverId);
    print('Připojuji k WebSocket: $url');

    try {
      _channel = WebSocketChannel.connect(Uri.parse(url));
      _isWebSocketConnected = true;
      print("WebSocket připojení úspěšné");
    } catch (e) {
      print("Chyba při připojení k WebSocket: $e");
      _isWebSocketConnected = false;
    }

    _channel?.stream.listen((data) {
      print("Přijatá zpráva: $data");
    });
  }

  void disconnectWebSocket() {
    _channel?.sink.close();
    _isWebSocketConnected = false;
  }

  Stream<dynamic>? get websocketStream => _channel?.stream;*/
}
