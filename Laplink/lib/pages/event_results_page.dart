import 'package:bm_racing_app/services/api_service.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:lottie/lottie.dart';

class EventResultsPage extends StatefulWidget {
  final int eventId;
  const EventResultsPage({Key? key, required this.eventId}) : super(key: key);

  @override
  _EventResultsPageState createState() => _EventResultsPageState();
}

class _EventResultsPageState extends State<EventResultsPage> {
  late Future<dynamic> _futureResults;
  // Seznam záložek (fází závodu)
  final List<String> _tabs = ["Trénink", "Kvalifikace", "Závod"];
  String? _currentUser;

  @override
  void initState() {
    super.initState();
    _futureResults = ApiClient().getAllEventResults(widget.eventId);
    _loadCurrentUser();
  }

  // Načte web_user ze SharedPreferences
  Future<void> _loadCurrentUser() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _currentUser = prefs.getString('web_user');
    });
  }

  /// Metoda pro obnovu výsledků (reload)
  Future<void> _reloadResults() async {
    setState(() {
      _futureResults = ApiClient().getAllEventResults(widget.eventId);
    });
    await _futureResults;
  }

  /// Metoda, která z dat vyfiltruje a vykreslí výsledky pro danou fázi.
  Widget buildResultsForPhase(String phaseName, List data) {
    List<Widget> categoryWidgets = [];

    // Pro každou kategorii
    for (var category in data) {
      // Získáme seznam fází – pokud není seznam, použijeme prázdný seznam.
      List phases = category['phases'] is List ? category['phases'] : [];
      // Vyfiltrujeme pouze ty fáze, jejichž název odpovídá aktuálně zvolené záložce.
      var matchingPhases =
          phases.where((phase) => phase['phase_name'] == phaseName).toList();

      if (matchingPhases.isNotEmpty) {
        List<Widget> phaseWidgets = [];
        for (var phase in matchingPhases) {
          // Získáme výsledky; pokud nejsou seznam, použijeme prázdný seznam.
          List results = phase['results'] is List ? phase['results'] : [];

          Widget dataTable = FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerLeft,
            child: DataTable(
              headingRowColor: WidgetStateProperty.all(
                Theme.of(context).colorScheme.primaryContainer,
              ),
              columns: [
                DataColumn(
                  label: Text(
                    'Pozice',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color:
                              Theme.of(context).colorScheme.onPrimaryContainer,
                        ),
                  ),
                ),
                DataColumn(
                  label: Text(
                    'Jméno a příjmení',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color:
                              Theme.of(context).colorScheme.onPrimaryContainer,
                        ),
                  ),
                ),
                DataColumn(
                  label: Text(
                    'Čas',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color:
                              Theme.of(context).colorScheme.onPrimaryContainer,
                        ),
                  ),
                ),
              ],
              rows: results.map<DataRow>((result) {
                return DataRow(
                  // Pokud se web_user shoduje s aktuálním uživatelem, změníme barvu pozadí.
                  color: WidgetStateProperty.resolveWith<Color?>((states) {
                    if (_currentUser != null &&
                        result['web_user'] == _currentUser) {
                      return Colors.yellow.withOpacity(0.3);
                    }
                    return null;
                  }),
                  cells: [
                    DataCell(
                      Text(
                        result['position'].toString(),
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              fontSize: 16,
                            ),
                      ),
                    ),
                    DataCell(
                      Text(
                        result['full_name'] ?? '',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              fontSize: 16,
                            ),
                      ),
                    ),
                    DataCell(
                      Text(
                        result['total_time'] ?? '',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              fontSize: 16,
                            ),
                      ),
                    ),
                  ],
                );
              }).toList(),
            ),
          );

          phaseWidgets.add(
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    phaseName,
                    style: Theme.of(context)
                        .textTheme
                        .titleSmall
                        ?.copyWith(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  const SizedBox(height: 8),
                  dataTable,
                ],
              ),
            ),
          );
        }

        // Vykreslíme kartu s výsledky pro danou kategorii.
        categoryWidgets.add(
          Card(
            margin: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
            elevation: 3,
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: Padding(
              padding: const EdgeInsets.all(12.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    category['category_name'] ?? '',
                    style: Theme.of(context)
                        .textTheme
                        .titleMedium
                        ?.copyWith(fontWeight: FontWeight.bold, fontSize: 18),
                  ),
                  const SizedBox(height: 8),
                  ...phaseWidgets,
                ],
              ),
            ),
          ),
        );
      }
    }

    // Vytvoříme obsah, který bude vždy obalený scrollovatelným widgetem
    Widget content;
    if (categoryWidgets.isEmpty) {
      content = Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 100.0),
          child: Text(
            "Žádné výsledky pro $phaseName",
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ),
      );
    } else {
      content = Column(
        children: categoryWidgets,
      );
    }
    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      child: content,
    );
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: _tabs.length,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Výsledky závodu'),
          titleTextStyle: const TextStyle(
            fontSize: 18,
          ),
          backgroundColor: Theme.of(context).colorScheme.primary,
          bottom: TabBar(
            tabs: _tabs.map((tabName) => Tab(text: tabName)).toList(),
            labelStyle: Theme.of(context).textTheme.bodyMedium,
          ),
        ),
        body: FutureBuilder<dynamic>(
          future: _futureResults,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              // Pro RefreshIndicator je potřeba scrollovatelný widget
              return ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                children: [
                  SizedBox(
                    height: 200,
                    child: Center(
                      child: Lottie.asset(
                        'assets/loading.json',
                        width: 150,
                        height: 150,
                      ),
                    ),
                  )
                ],
              );
            }
            if (snapshot.hasError) {
              print(snapshot.error);
              return ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                children: [
                  SizedBox(
                    height: 200,
                    child: Center(
                      child: Text(
                        'Chyba při načítání výsledků',
                        style: TextStyle(
                            color: Theme.of(context).colorScheme.error),
                      ),
                    ),
                  )
                ],
              );
            }
            if (!snapshot.hasData) {
              return ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                children: [
                  SizedBox(
                    height: 200,
                    child: Center(
                      child: Text(
                        'Žádná data',
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ),
                  )
                ],
              );
            }

            final data = snapshot.data;
            // Očekáváme, že data jsou seznam kategorií.
            if (data is! List) {
              return ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                children: [
                  SizedBox(
                    height: 200,
                    child: Center(
                      child: Text(
                        'Neplatný formát dat',
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ),
                  )
                ],
              );
            }

            return TabBarView(
              children: _tabs.map((phaseName) {
                // Obalíme obsah každé záložky RefreshIndicator-em,
                // který při "pull-to-refresh" zavolá _reloadResults.
                return RefreshIndicator(
                  onRefresh: _reloadResults,
                  child: buildResultsForPhase(phaseName, data),
                );
              }).toList(),
            );
          },
        ),
      ),
    );
  }
}
