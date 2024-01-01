class TimeFormatters {
  static String formattedStopwatchTime(Stopwatch stopwatch) {
    final int minutes = stopwatch.elapsed.inMinutes;
    final int seconds = stopwatch.elapsed.inSeconds % 60;
    final int milliseconds = (stopwatch.elapsedMilliseconds % 1000) ~/
        10; // Správné 2 desetinná místa

    return '${minutes.toString().padLeft(2, '0')}:'
        '${seconds.toString().padLeft(2, '0')}.'
        '${milliseconds.toString().padLeft(2, '0')}';
  }

  static String formattedNotificationStopwatchTime(Stopwatch stopwatch) {
    final duration = stopwatch.elapsed;
    return '${duration.inMinutes.toString().padLeft(2, '0')}:${(duration.inSeconds % 60).toString().padLeft(2, '0')}';
  }

  static String formatLapTimeToTable(double lapTime) {
    final minutes = (lapTime ~/ 60).toString().padLeft(2, '0');
    final seconds = (lapTime % 60).toInt().toString().padLeft(2, '0');
    final milliseconds = ((lapTime * 100) % 100)
        .toInt()
        .toString()
        .padLeft(2, '0'); // Oprava na 2 desetinná místa

    return '$minutes:$seconds.$milliseconds';
  }

  static String formatLapTime(double lapTime) {
    final hours = (lapTime ~/ 3600).toString().padLeft(2, '0');
    final minutes = ((lapTime % 3600) ~/ 60).toString().padLeft(2, '0');
    final seconds = (lapTime % 60).toInt().toString().padLeft(2, '0');
    final milliseconds =
        ((lapTime * 100) % 100).toInt().toString().padLeft(2, '0');

    return '$hours:$minutes:$seconds.$milliseconds';
  }
}
