import 'package:bm_racing_app/services/api_service.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:lottie/lottie.dart';

class UserInfoPage extends StatefulWidget {
  const UserInfoPage({Key? key}) : super(key: key);

  @override
  State<UserInfoPage> createState() => _UserInfoPageState();
}

class _UserInfoPageState extends State<UserInfoPage> {
  Map<String, dynamic>? _userInfo;
  String? _webPassword;
  bool _showPassword = false;
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadUserCredentialsAndFetchInfo();
  }

  Future<void> _loadUserCredentialsAndFetchInfo() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final webUser = prefs.getString('web_user');
      final webPassword = prefs.getString('web_password');
      _webPassword = webPassword;

      if (webUser == null || webUser.isEmpty) {
        setState(() {
          _errorMessage = 'Nebyl nalezen uživatel v SharedPreferences.';
          _isLoading = false;
        });
        return;
      }

      final ApiClient apiClient = ApiClient();
      await apiClient.initialize();
      final info = await apiClient.getUserInfo(webUser);
      setState(() {
        _userInfo = info;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'Chyba při načítání dat: $e';
        _isLoading = false;
      });
    }
  }

  /// Vrací iniciály uživatele (např. "DV" pro Dominik Vinš)
  String _getInitials() {
    if (_userInfo == null) return "";
    String firstName = _userInfo!['name'] ?? "";
    String lastName = _userInfo!['surname'] ?? "";
    String initials = "";
    if (firstName.isNotEmpty) initials += firstName[0];
    if (lastName.isNotEmpty) initials += lastName[0];
    return initials.toUpperCase();
  }

  /// Formátuje datum narození ve tvaru DD.MM.YYYY
  String _formatBirthDate(String rawDate) {
    if (rawDate.isEmpty) return 'N/A';
    try {
      final date = DateTime.parse(rawDate);
      final day = date.day.toString().padLeft(2, '0');
      final month = date.month.toString().padLeft(2, '0');
      final year = date.year.toString();
      return '$day.$month.$year';
    } catch (_) {
      return rawDate; // pokud formát nelze převést, vrátí původní hodnotu
    }
  }

  Widget _buildInfoTile(String title, String value) {
    return ListTile(
      dense: true,
      contentPadding: EdgeInsets.zero,
      title: Text(
        title,
        style: TextStyle(
          fontWeight: FontWeight.w600,
          color: Theme.of(context).colorScheme.onSurface,
        ),
      ),
      subtitle: Padding(
        padding: const EdgeInsets.only(top: 4.0),
        child: Text(
          value,
          style: TextStyle(
            fontSize: 16,
            color: Theme.of(context).colorScheme.onSurface.withOpacity(0.8),
          ),
        ),
      ),
    );
  }

  Widget _buildBody(BuildContext context) {
    if (_isLoading) {
      // Místo CircularProgressIndicator se zde zobrazí Lottie animace.
      return Center(
        child: Lottie.asset(
          'assets/loading.json',
          width: 150,
          height: 150,
        ),
      );
    }

    if (_errorMessage != null) {
      return Center(
        child: Text(
          _errorMessage!,
          style: TextStyle(color: Theme.of(context).colorScheme.error),
        ),
      );
    }

    if (_userInfo == null) {
      return Center(
        child: Text(
          'Nenalezli jsme žádné informace o uživateli.',
          style: TextStyle(color: Theme.of(context).colorScheme.onSurface),
        ),
      );
    }

    // Extrahování jednotlivých hodnot
    final name = _userInfo!['name'] ?? '';
    final surname = _userInfo!['surname'] ?? '';
    final email = _userInfo!['email'] ?? '';
    final city = _userInfo!['city'] ?? '';
    final street = _userInfo!['street'] ?? '';
    final postcode = _userInfo!['postcode'] ?? '';
    final phone = _userInfo!['phone'] ?? '';
    final number = _userInfo!['number']?.toString() ?? '';
    final webUser = _userInfo!['web_user'] ?? '';
    final birthDate = _formatBirthDate(_userInfo!['birth_date'] ?? '');
    final raceboxText = _userInfo!['racebox_id'] == null
        ? "Nepřiřazen"
        : _userInfo!['racebox_id'].toString();
    final password = _webPassword ?? '';

    return SingleChildScrollView(
      child: Column(
        children: [
          // Profilová hlavička s pozadím podle primární barvy
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.primary,
              borderRadius:
                  const BorderRadius.vertical(bottom: Radius.circular(30)),
            ),
            child: Column(
              children: [
                CircleAvatar(
                  radius: 50,
                  backgroundColor: Theme.of(context).colorScheme.onPrimary,
                  child: Text(
                    _getInitials(),
                    style: TextStyle(
                      fontSize: 40,
                      fontWeight: FontWeight.bold,
                      color: Theme.of(context).colorScheme.primary,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  "$name $surname",
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).colorScheme.onPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  email,
                  style: TextStyle(
                    fontSize: 16,
                    color: Theme.of(context)
                        .colorScheme
                        .onPrimary
                        .withOpacity(0.9),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          // Karta s podrobnými informacemi
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Card(
              color: Theme.of(context).colorScheme.surface,
              elevation: 3,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    _buildInfoTile("Datum narození", birthDate),
                    const Divider(),
                    _buildInfoTile("Město", city),
                    const Divider(),
                    _buildInfoTile("Ulice", street),
                    const Divider(),
                    _buildInfoTile("PSČ", postcode),
                    const Divider(),
                    _buildInfoTile("Telefon", phone),
                    const Divider(),
                    _buildInfoTile("Start. číslo", number),
                    const Divider(),
                    _buildInfoTile("Racebox", raceboxText),
                    const Divider(),
                    _buildInfoTile("Uživatelské jméno", webUser),
                    const Divider(),
                    // Řádek pro heslo s tlačítkem pro zobrazení/skrývání
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text(
                        "Heslo",
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          color: Theme.of(context).colorScheme.onSurface,
                        ),
                      ),
                      subtitle: Padding(
                        padding: const EdgeInsets.only(top: 4.0),
                        child: Text(
                          _showPassword ? password : '*' * password.length,
                          style: TextStyle(
                            fontSize: 16,
                            color: Theme.of(context)
                                .colorScheme
                                .onSurface
                                .withOpacity(0.8),
                          ),
                        ),
                      ),
                      trailing: IconButton(
                        icon: Icon(
                          _showPassword
                              ? Icons.visibility_off
                              : Icons.visibility,
                          color: Theme.of(context).colorScheme.primary,
                        ),
                        onPressed: () {
                          setState(() {
                            _showPassword = !_showPassword;
                          });
                        },
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          'Profil uživatele',
          style: TextStyle(color: Theme.of(context).colorScheme.onPrimary),
        ),
        titleTextStyle: const TextStyle(
          fontSize: 18,
        ),
        backgroundColor: Theme.of(context).colorScheme.tertiary,
      ),
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: _buildBody(context),
    );
  }
}
