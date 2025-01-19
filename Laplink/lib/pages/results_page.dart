import 'package:flutter/material.dart';
import 'package:laplink/services/api_service.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:async';

class ResultsPage extends StatelessWidget {
  final String webUser;
  final int raceId;
  final apiClient = ApiClient();

  ResultsPage({
    super.key,
    required this.webUser,
    required this.raceId,
  });

  Future<Map<String, dynamic>> _getRaceDetails() async {
    final prefs = await SharedPreferences.getInstance();
    int savedRaceId = prefs.getInt('race_id') ?? raceId;

    return {
      'web_user': webUser,
      'race_id': savedRaceId,
    };
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        backgroundColor: Theme.of(context).scaffoldBackgroundColor,
        appBar: AppBar(
          automaticallyImplyLeading: true, // Bez šipky zpět
          backgroundColor: Theme.of(context).colorScheme.tertiary,
          title: Text(
            'Detaily závodu',
            style: TextStyle(
              color: Theme.of(context).colorScheme.onPrimary,
              fontWeight: FontWeight.bold,
              fontSize: 20,
            ),
          ),
          bottom: TabBar(
            labelColor: Theme.of(context).colorScheme.primary,
            unselectedLabelColor: Theme.of(context)
                .colorScheme
                .onPrimary
                .withAlpha((0.9 * 255).toInt()),
            indicatorColor: Theme.of(context).colorScheme.primary,
            tabs: const [
              Tab(text: 'Trénink'),
              Tab(text: 'Kvalifikace'),
              Tab(text: 'Závod'),
            ],
          ),
          centerTitle: true,
        ),
        body: FutureBuilder<Map<String, dynamic>>(
          future: _getRaceDetails(),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return Center(
                child: CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(
                      Theme.of(context).colorScheme.primary),
                ),
              );
            } else if (snapshot.hasError) {
              return Center(
                child: Text(
                  'Chyba při načítání detailů závodu',
                  style: TextStyle(
                    color: Theme.of(context).colorScheme.onSurface,
                  ),
                ),
              );
            } else {
              final raceDetails = snapshot.data!;
              return TabBarView(
                children: [
                  _buildPhaseContent(context, 'Trénink', raceDetails, 1),
                  _buildPhaseContent(context, 'Kvalifikace', raceDetails, 2),
                  _buildPhaseContent(context, 'Závod', raceDetails, 3),
                ],
              );
            }
          },
        ),
      ),
    );
  }

  Widget _buildPhaseContent(BuildContext context, String phase,
      Map<String, dynamic> raceDetails, int phaseId) {
    return FutureBuilder(
      future: apiClient.getEventPhaseResults(
          raceDetails['web_user'], raceId, phaseId),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return Center(
            child: CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(
                  Theme.of(context).colorScheme.primary),
            ),
          );
        } else if (!snapshot.hasData || (snapshot.data as List).isEmpty) {
          return Center(
            child: Text(
              'Žádná data pro tuto fázi závodu',
              style: TextStyle(
                color: Theme.of(context).colorScheme.onSurface,
                fontSize: 18,
              ),
            ),
          );
        } else {
          final results = snapshot.data as List<dynamic>;
          return _buildResultsTable(context, results, phase);
        }
      },
    );
  }

  Widget _buildResultsTable(
      BuildContext context, List<dynamic> results, String phase) {
    final fastestLap =
        results.reduce((a, b) => a['time'].compareTo(b['time']) < 0 ? a : b);
    final fastestLapIndex = results.indexOf(fastestLap) + 1;

    String totalTime = '';
    if (phase == 'Závod') {
      totalTime = _calculateTotalTime(results);
    }

    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha((0.1 * 255).toInt()),
            blurRadius: 6,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      margin: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Výsledky: $phase',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Theme.of(context).colorScheme.secondary,
            ),
          ),
          const SizedBox(height: 10),
          Expanded(
            child: ListView.builder(
              padding: EdgeInsets.zero,
              itemCount: results.length,
              itemBuilder: (context, index) {
                final result = results[index];
                final isFastest = index + 1 == fastestLapIndex;

                return Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.symmetric(
                          vertical: 6.0, horizontal: 12.0),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Kolo ${index + 1}',
                            style: TextStyle(
                              color: isFastest
                                  ? Theme.of(context).colorScheme.primary
                                  : Theme.of(context).colorScheme.onSurface,
                              fontWeight: isFastest
                                  ? FontWeight.bold
                                  : FontWeight.normal,
                            ),
                          ),
                          Text(
                            result['time'],
                            style: TextStyle(
                              color: isFastest
                                  ? Theme.of(context).colorScheme.primary
                                  : Theme.of(context).colorScheme.onSurface,
                              fontWeight: isFastest
                                  ? FontWeight.bold
                                  : FontWeight.normal,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Divider(
                      color: Theme.of(context)
                          .colorScheme
                          .onSurface
                          .withAlpha((0.2 * 255).toInt()),
                      thickness: 1,
                      indent: 20,
                      endIndent: 20,
                    ),
                  ],
                );
              },
            ),
          ),
          const SizedBox(height: 25),
          if (phase != 'Závod')
            Center(
              child: Text(
                'Nejrychlejší kolo: Kolo $fastestLapIndex - ${fastestLap['time']}',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Theme.of(context).colorScheme.primary,
                ),
              ),
            ),
          if (phase == 'Závod')
            Center(
              child: Text(
                'Celkový čas: $totalTime',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Theme.of(context).colorScheme.primary,
                ),
              ),
            ),
        ],
      ),
    );
  }

  String _calculateTotalTime(List<dynamic> results) {
    Duration totalDuration = Duration.zero;
    for (var result in results) {
      final timeString = result['time'];
      final parts = timeString.split(':');
      final hours = int.parse(parts[0]);
      final minutes = int.parse(parts[1]);
      final seconds = int.parse(parts[2].split('.')[0]);
      final milliseconds = int.parse(parts[2].split('.')[1]);

      totalDuration += Duration(
        hours: hours,
        minutes: minutes,
        seconds: seconds,
        milliseconds: milliseconds,
      );
    }

    return totalDuration.toString().split('.').first;
  }
}
