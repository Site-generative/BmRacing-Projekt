import 'package:flutter/material.dart';
import 'package:bm_racing_app/utils/time_formatters.dart';

class LapTimeTable extends StatelessWidget {
  final List<double> lapTimes;
  final ScrollController scrollController;

  const LapTimeTable({
    super.key,
    required this.lapTimes,
    required this.scrollController,
  });

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      controller: scrollController,
      itemCount: lapTimes.length + 1,
      itemBuilder: (context, index) {
        if (index == 0) {
          return const ListTile(
            title: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '#',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  'Čas',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          );
        } else {
          return ListTile(
            title: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  index.toString(),
                  style: const TextStyle(color: Colors.white),
                ),
                Text(
                  TimeFormatters.formatLapTime(lapTimes[index - 1]),
                  style: TextStyle(
                    color: (index - 1 == lapTimes.length - 1)
                        ? Colors.red
                        : Colors.white,
                  ),
                ),
              ],
            ),
          );
        }
      },
    );
  }
}
