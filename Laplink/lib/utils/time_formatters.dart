class TimeFormatters {
  static String formattedStopwatchTime(Stopwatch stopwatch) {
    final duration = stopwatch.elapsed;
    return '${duration.inMinutes.toString().padLeft(2, '0')}:${(duration.inSeconds % 60).toString().padLeft(2, '0')}.${(duration.inMilliseconds % 1000 ~/ 10).toString().padLeft(2, '0')}';
  }

  static String formattedNotificationStopwatchTime(Stopwatch stopwatch) {
    final duration = stopwatch.elapsed;
    return '${duration.inMinutes.toString().padLeft(2, '0')}:${(duration.inSeconds % 60).toString().padLeft(2, '0')}';
  }

  static String formatLapTimeToTable(double lapTime) {
    final minutes = (lapTime ~/ 60).toString().padLeft(2, '0');
    final seconds = ((lapTime % 60).toInt()).toString().padLeft(2, '0');
    final milliseconds =
        ((lapTime - lapTime.toInt()) * 1000).toInt().toString().padLeft(3, '0');
    return '$minutes:$seconds.$milliseconds';
  }

  static String formatLapTime(double lapTime) {
    final hours = (lapTime ~/ 3600).toString().padLeft(2, '0');
    final minutes = ((lapTime % 3600) ~/ 60).toString().padLeft(2, '0');
    final seconds = (lapTime % 60).toInt().toString().padLeft(2, '0');
    final milliseconds =
        ((lapTime * 1000) % 1000).toInt().toString().padLeft(3, '0');
    return '$hours:$minutes:$seconds.$milliseconds';
  }
}
