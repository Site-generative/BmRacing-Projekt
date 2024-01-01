import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:bm_racing_app/pages/login_page.dart';
import 'package:bm_racing_app/models/race_state.dart';
import 'package:bm_racing_app/provider/theme_provider.dart';

// Globální RouteObserver, který se využije pro sledování změn tras (navigace)
final RouteObserver<PageRoute> routeObserver = RouteObserver<PageRoute>();

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Povolení pouze svislé orientace
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
  ]);
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => RaceState()),
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
      ],
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    final themeProvider = Provider.of<ThemeProvider>(context);

    return MaterialApp(
      title: 'BM Racing App',
      navigatorObservers: [routeObserver], // Přidání RouteObserver
      themeMode: themeProvider.themeMode,
      theme: ThemeData(
        brightness: Brightness.light,
        useMaterial3: true,
        colorScheme: const ColorScheme.light(
          primary: Color(0xFFDC2626),
          onPrimary: Color(0xFFF5F5F5),
          secondary: Color(0xFF000000),
          onSurface: Colors.black,
          surface: Colors.white,
          tertiary: Color(0xFF2C2C2E),
          onTertiary: Color(0xFFF5F5F5),
          onSecondary: Color(0xFFFFFFFF),
        ),
        scaffoldBackgroundColor: const Color(0xFFF5F5F5),
        textTheme: const TextTheme(
          titleLarge: TextStyle(
            fontSize: 36,
            fontWeight: FontWeight.bold,
            color: Colors.black,
          ),
          bodyMedium: TextStyle(
            color: Colors.black87,
            fontSize: 16,
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: const Color(0xFFF5F5F5),
          prefixIconColor: const Color(0xFF000000),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(30),
            borderSide: BorderSide.none,
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(30),
            borderSide:
                const BorderSide(color: Color.fromARGB(255, 226, 71, 71)),
          ),
        ),
      ),
      darkTheme: ThemeData(
        brightness: Brightness.dark,
        useMaterial3: true,
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFFDC2626),
          onPrimary: Colors.white,
          secondary: Colors.white,
          onSurface: Colors.white,
          surface: Color(0xFF2C2C2E),
          tertiary: Color(0xFF2C2C2E),
          onTertiary: Color(0xFF1C1C1E),
          onSecondary: Color(0xFF2C2C2E),
        ),
        scaffoldBackgroundColor: const Color(0xFF1C1C1E),
        textTheme: const TextTheme(
          titleLarge: TextStyle(
            fontSize: 36,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
          bodyMedium: TextStyle(
            color: Colors.white70,
            fontSize: 16,
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: const Color(0xFF2C2C2E),
          prefixIconColor: Colors.white70,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(30),
            borderSide: BorderSide.none,
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(30),
            borderSide: const BorderSide(color: Color(0xFFDC2626)),
          ),
        ),
      ),
      home: const LoginPage(),
    );
  }
}
