import 'package:bm_racing_app/pages/event_results_page.dart';
import 'package:bm_racing_app/pages/results_page.dart';
import 'package:bm_racing_app/pages/serie_ranking_page.dart';
import 'package:bm_racing_app/services/api_service.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:lottie/lottie.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SerieEventPage extends StatefulWidget {
  final bool isPersonal;

  const SerieEventPage({Key? key, required this.isPersonal}) : super(key: key);

  @override
  _SerieEventPageState createState() => _SerieEventPageState();
}

class _SerieEventPageState extends State<SerieEventPage> {
  late Future<List<Series>> _futureSeries;
  int? _expandedSeriesId;
  String? _webUser = '';

  @override
  void initState() {
    super.initState();
    _futureSeries = _fetchSeries();
  }

  Future<List<Series>> _fetchSeries() async {
    final apiClient = ApiClient();
    await apiClient.initialize();

    List<dynamic> data;

    if (widget.isPersonal) {
      final prefs = await SharedPreferences.getInstance();
      _webUser = prefs.getString('web_user');
      if (_webUser == null) {
        throw Exception('web_user nebyl nalezen v SharedPreferences.');
      }
      data = await apiClient.getAllUserSeriesRaces(_webUser!);
    } else {
      data = await apiClient.getAllSeriesRaces();
    }

    final Map<int, Series> seriesMap = {};
    for (var item in data) {
      final seriesId = item['series_id'] as int;
      if (!seriesMap.containsKey(seriesId)) {
        seriesMap[seriesId] = Series(
          id: seriesId,
          name: item['series_name'],
          year: item['year'],
          events: [],
        );
      }
      seriesMap[seriesId]!.events.add(
            RaceEvent(
              eventId: item['event_id'] as int,
              eventName: item['event_name'],
              date: DateTime.parse(item['date']),
              location: item['location'],
            ),
          );
    }

    return seriesMap.values.toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Serie a závody'),
        titleTextStyle: const TextStyle(
          fontSize: 18,
        ),
        backgroundColor: Theme.of(context).colorScheme.primary,
      ),
      body: FutureBuilder<List<Series>>(
        future: _futureSeries,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return Center(
              child: Lottie.asset(
                'assets/loading.json',
                width: 150,
                height: 150,
              ),
            );
          }
          if (snapshot.hasError) {
            return Center(
              child: Text(
                'Chyba při načítání dat',
                style: TextStyle(color: Theme.of(context).colorScheme.error),
              ),
            );
          }
          if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return Center(
              child: Text(
                'Žádná data',
                style:
                    TextStyle(color: Theme.of(context).colorScheme.onSurface),
              ),
            );
          }
          final seriesList = snapshot.data!;
          return ListView.builder(
            itemCount: seriesList.length,
            itemBuilder: (context, index) {
              final series = seriesList[index];
              final bool isExpanded = _expandedSeriesId == series.id;
              return Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Card(
                  elevation: 3,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: Column(
                    children: [
                      InkWell(
                        onTap: () {
                          setState(() {
                            _expandedSeriesId = isExpanded ? null : series.id;
                          });
                        },
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Theme.of(context)
                                .colorScheme
                                .surfaceContainerHighest,
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      series.name,
                                      style: Theme.of(context)
                                          .textTheme
                                          .titleMedium
                                          ?.copyWith(
                                              fontWeight: FontWeight.bold),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      '${series.year}',
                                      style: Theme.of(context)
                                          .textTheme
                                          .bodyMedium,
                                    ),
                                  ],
                                ),
                              ),
                              Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  if (!widget.isPersonal)
                                    TextButton(
                                      onPressed: () {
                                        Navigator.push(
                                          context,
                                          MaterialPageRoute(
                                            builder: (context) =>
                                                SerieRankingsPage(
                                                    serieId: series.id),
                                          ),
                                        );
                                      },
                                      style: TextButton.styleFrom(
                                        foregroundColor: Theme.of(context)
                                            .colorScheme
                                            .primary,
                                      ),
                                      child: const Text('Zobrazit Výsledky'),
                                    ),
                                  IconButton(
                                    icon: Icon(
                                      isExpanded
                                          ? Icons.keyboard_arrow_up
                                          : Icons.keyboard_arrow_down,
                                      color: Theme.of(context)
                                          .colorScheme
                                          .onSurface,
                                    ),
                                    onPressed: () {
                                      setState(() {
                                        _expandedSeriesId =
                                            isExpanded ? null : series.id;
                                      });
                                    },
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                      AnimatedCrossFade(
                        firstChild: Container(),
                        secondChild: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 8),
                          child: Column(
                            children: List.generate(
                              series.events.length * 2 - 1,
                              (i) {
                                if (i.isEven) {
                                  final eventIndex = i ~/ 2;
                                  final event = series.events[eventIndex];
                                  return ListTile(
                                    contentPadding: EdgeInsets.zero,
                                    title: Text(
                                      event.eventName,
                                      style: Theme.of(context)
                                          .textTheme
                                          .titleSmall
                                          ?.copyWith(
                                              fontWeight: FontWeight.bold),
                                    ),
                                    subtitle: Padding(
                                      padding: const EdgeInsets.only(top: 4.0),
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            event.location,
                                            style: Theme.of(context)
                                                .textTheme
                                                .bodySmall,
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            DateFormat('dd.MM.yyyy')
                                                .format(event.date),
                                            style: Theme.of(context)
                                                .textTheme
                                                .bodySmall,
                                          ),
                                        ],
                                      ),
                                    ),
                                    trailing: TextButton(
                                      onPressed: () {
                                        if (widget.isPersonal) {
                                          Navigator.push(
                                            context,
                                            MaterialPageRoute(
                                              builder: (context) => ResultsPage(
                                                  raceId: event.eventId,
                                                  webUser: _webUser!),
                                            ),
                                          );
                                        } else {
                                          Navigator.push(
                                            context,
                                            MaterialPageRoute(
                                              builder: (context) =>
                                                  EventResultsPage(
                                                      eventId: event.eventId),
                                            ),
                                          );
                                        }
                                      },
                                      style: TextButton.styleFrom(
                                        foregroundColor: Theme.of(context)
                                            .colorScheme
                                            .primary,
                                      ),
                                      child: const Text('Zobrazit'),
                                    ),
                                  );
                                } else {
                                  return Divider(
                                    color: Theme.of(context)
                                        .dividerColor
                                        .withOpacity(0.5),
                                  );
                                }
                              },
                            ),
                          ),
                        ),
                        crossFadeState: isExpanded
                            ? CrossFadeState.showSecond
                            : CrossFadeState.showFirst,
                        duration: const Duration(milliseconds: 200),
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

/// Modelová třída pro sérii.
class Series {
  final int id;
  final String name;
  final int year;
  final List<RaceEvent> events;

  Series({
    required this.id,
    required this.name,
    required this.year,
    required this.events,
  });
}

/// Modelová třída pro závod.
class RaceEvent {
  final int eventId;
  final String eventName;
  final DateTime date;
  final String location;

  RaceEvent({
    required this.eventId,
    required this.eventName,
    required this.date,
    required this.location,
  });
}
//Třídy Series a RaceEvent byly vytvořeny a implementovány za pomocí chatGPT
