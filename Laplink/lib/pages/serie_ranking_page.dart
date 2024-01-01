import 'package:bm_racing_app/services/api_service.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:lottie/lottie.dart';

class SerieRankingsPage extends StatefulWidget {
  final int serieId;
  const SerieRankingsPage({Key? key, required this.serieId}) : super(key: key);

  @override
  _SerieRankingsPageState createState() => _SerieRankingsPageState();
}

class _SerieRankingsPageState extends State<SerieRankingsPage> {
  late Future<dynamic> _futureRankings;
  String? _currentUser;

  @override
  void initState() {
    super.initState();
    _futureRankings = _fetchRankings();
    _loadCurrentUser();
  }

  Future<dynamic> _fetchRankings() async {
    final apiClient = ApiClient();
    await apiClient.initialize();
    final data = await apiClient.getAllSerieRRankings(widget.serieId);
    return data;
  }

  Future<void> _loadCurrentUser() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _currentUser = prefs.getString('web_user');
    });
  }

  Future<void> _refreshRankings() async {
    setState(() {
      _futureRankings = _fetchRankings();
    });
    await _futureRankings;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Výsledky série'),
        titleTextStyle: const TextStyle(
          fontSize: 18,
        ),
        backgroundColor: Theme.of(context).colorScheme.primary,
      ),
      body: FutureBuilder<dynamic>(
        future: _futureRankings,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
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
                ),
              ],
            );
          }
          if (snapshot.hasError) {
            print(snapshot.error);
            return Center(
              child: Text(
                'Chyba při načítání výsledků',
                style: TextStyle(color: Theme.of(context).colorScheme.error),
              ),
            );
          }
          if (!snapshot.hasData) {
            return Center(
              child: Text(
                'Žádná data',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            );
          }
          final data = snapshot.data;
          if (data is! List) {
            return Center(
              child: Text(
                'Neplatný formát dat',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            );
          }

          Map<String, List<dynamic>> groupedResults = {};
          for (var result in data) {
            String category = result['car_category'] ?? 'Neznámá';
            if (!groupedResults.containsKey(category)) {
              groupedResults[category] = [];
            }
            groupedResults[category]!.add(result);
          }

          List<String> sortedCategories = groupedResults.keys.toList()..sort();

          List<Widget> groupWidgets = sortedCategories.map((category) {
            List<dynamic> results = groupedResults[category]!;

            // V každé skupině počítáme pozici jako index + 1 (předpokládáme, že data jsou již seřazená).
            Widget table = FittedBox(
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
                            color: Theme.of(context)
                                .colorScheme
                                .onPrimaryContainer,
                          ),
                    ),
                  ),
                  DataColumn(
                    label: Text(
                      'Jméno a příjmení',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Theme.of(context)
                                .colorScheme
                                .onPrimaryContainer,
                          ),
                    ),
                  ),
                  DataColumn(
                    label: Text(
                      'Číslo',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Theme.of(context)
                                .colorScheme
                                .onPrimaryContainer,
                          ),
                    ),
                  ),
                  DataColumn(
                    label: Text(
                      'Body',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Theme.of(context)
                                .colorScheme
                                .onPrimaryContainer,
                          ),
                    ),
                  ),
                ],
                rows: List<DataRow>.generate(results.length, (index) {
                  var result = results[index];
                  String fullName = '${result['name']} ${result['surname']}';
                  return DataRow(
                    color: WidgetStateProperty.resolveWith<Color?>(
                        (Set<WidgetState> states) {
                      if (_currentUser != null &&
                          result['web_user'] == _currentUser) {
                        return Colors.yellow.withOpacity(0.3);
                      }
                      return null;
                    }),
                    cells: [
                      DataCell(
                        Text(
                          (index + 1).toString(),
                          style: Theme.of(context)
                              .textTheme
                              .bodySmall
                              ?.copyWith(fontSize: 16),
                        ),
                      ),
                      DataCell(
                        Text(
                          fullName,
                          style: Theme.of(context)
                              .textTheme
                              .bodySmall
                              ?.copyWith(fontSize: 16),
                        ),
                      ),
                      DataCell(
                        Text(
                          result['race_number'].toString(),
                          style: Theme.of(context)
                              .textTheme
                              .bodySmall
                              ?.copyWith(fontSize: 16),
                        ),
                      ),
                      DataCell(
                        Text(
                          result['points'].toString(),
                          style: Theme.of(context)
                              .textTheme
                              .bodySmall
                              ?.copyWith(fontSize: 16),
                        ),
                      ),
                    ],
                  );
                }),
              ),
            );

            return Card(
              margin: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
              elevation: 3,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              child: Padding(
                padding: const EdgeInsets.all(12.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      category,
                      style: Theme.of(context)
                          .textTheme
                          .titleMedium
                          ?.copyWith(fontWeight: FontWeight.bold, fontSize: 18),
                    ),
                    const SizedBox(height: 8),
                    table,
                  ],
                ),
              ),
            );
          }).toList();

          return RefreshIndicator(
            onRefresh: _refreshRankings,
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: Column(
                children: groupWidgets,
              ),
            ),
          );
        },
      ),
    );
  }
}
