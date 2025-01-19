import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'action_button.dart';

class RaceCard extends StatelessWidget {
  final Map<String, dynamic> race;
  final VoidCallback onTrainingStart;
  final VoidCallback onQualificationStart;
  final VoidCallback onRaceStart;
  final VoidCallback onShowResults;

  const RaceCard({
    super.key,
    required this.race,
    required this.onTrainingStart,
    required this.onQualificationStart,
    required this.onRaceStart,
    required this.onShowResults,
  });

  String _formatDate(String dateString) {
    DateTime parsedDate = DateTime.parse(dateString);
    return DateFormat('dd.MM.yyyy').format(parsedDate);
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0xFF2E2E31),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withAlpha((0.3 * 255).toInt()),
              blurRadius: 6,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(
                    race['event_phase_id'] == 1
                        ? Icons.directions_car
                        : race['event_phase_id'] == 2
                            ? Icons.timer
                            : Icons.sports_motorsports,
                    color: Colors.white,
                    size: 40,
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Text(
                      race['name'],
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.calendar_today, color: Colors.grey),
                      const SizedBox(width: 8),
                      Text(
                        'Datum: ${_formatDate(race['date'])}',
                        style: const TextStyle(
                          fontSize: 16,
                          color: Colors.white70,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.location_on, color: Colors.grey),
                      const SizedBox(width: 8),
                      Text(
                        'Lokalita: ${race['location']}',
                        style: const TextStyle(
                          fontSize: 16,
                          color: Colors.white70,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.flag, color: Colors.grey),
                      const SizedBox(width: 8),
                      Text(
                        'Počet kol: ${race['number_of_laps']}',
                        style: const TextStyle(
                          fontSize: 16,
                          color: Colors.white70,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 20),
              Center(
                child: Column(
                  children: [
                    ActionButton(
                      isActive: race['event_phase_id'] == 1,
                      label: 'Zahájit trénink',
                      icon: Icons.directions_run,
                      backgroundColor: const Color(0xFFDC2626),
                      onPressed: onTrainingStart,
                    ),
                    const SizedBox(height: 10),
                    ActionButton(
                      isActive: race['event_phase_id'] == 2,
                      label: 'Zahájit Kvalifikaci',
                      icon: Icons.emoji_events,
                      backgroundColor: const Color(0xFFDC2626),
                      onPressed: onQualificationStart,
                    ),
                    const SizedBox(height: 10),
                    ActionButton(
                      isActive: race['event_phase_id'] == 3 &&
                          !(race['finished'] ?? false),
                      label: 'Začít závod',
                      icon: Icons.sports_score,
                      backgroundColor: const Color(0xFFDC2626),
                      onPressed: onRaceStart,
                    ),
                    const SizedBox(height: 10),
                    ActionButton(
                      isActive: true,
                      label: 'Zobrazit časy závodu',
                      icon: Icons.access_time,
                      backgroundColor: const Color(0xFF607D8B),
                      onPressed: onShowResults,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
