import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:laplink/pages/login_page.dart';
import 'package:laplink/models/race_state.dart';
import 'package:laplink/provider/theme_provider.dart';

void main() {
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
      title: 'Laplink',
      themeMode: themeProvider.themeMode,
      theme: ThemeData(
        brightness: Brightness.light,
        useMaterial3: true,
        colorScheme: const ColorScheme.light(
          primary: Color(0xFFDC2626), // Světle růžová tlačítka
          onPrimary: Color(0xFFF5F5F5), // Bílý text na tlačítkách
          secondary: Color(0xFF000000), // Černé ikony
          onSurface: Colors.black, // Černý text na povrchu
          surface: Colors.white, // Světle šedé pozadí
          tertiary: Color(0xFF2C2C2E),
          onTertiary: Color(0xFFF5F5F5),
          onSecondary: Color(0xFFFFFFFF),
        ),
        scaffoldBackgroundColor: const Color(0xFFF5F5F5), // Bílé pozadí
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
          fillColor: const Color(0xFFF5F5F5), // Světle šedé pozadí pro input
          prefixIconColor: const Color(0xFF000000), // Černé ikony
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
            primary: Color(0xFFDC2626), // Tmavě červená tlačítka
            onPrimary: Colors.white, // Bílý text na tlačítkách
            secondary: Colors.white, // Bílé texty
            onSurface: Colors.white, // Bílé texty
            surface: Color(0xFF2C2C2E), // Tmavé pozadí inputů
            tertiary: Color(0xFF2C2C2E),
            onTertiary: Color(0xFF1C1C1E),
            onSecondary: Color(0xFF2C2C2E)),
        scaffoldBackgroundColor: const Color(0xFF1C1C1E), // Tmavé pozadí
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
          fillColor: const Color(0xFF2C2C2E), // Tmavé pozadí pro input
          prefixIconColor: Colors.white70, // Bílé ikony
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
