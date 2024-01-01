import 'dart:math';

class SimpleKalmanFilter2D {
  final List<double> _state = [0.0, 0.0, 0.0, 0.0];

  // Kovarianční matice odhadu (4×4)
  List<List<double>> _P = [
    [1000.0, 0.0, 0.0, 0.0],
    [0.0, 1000.0, 0.0, 0.0],
    [0.0, 0.0, 1000.0, 0.0],
    [0.0, 0.0, 0.0, 1000.0],
  ];

  // Parametry šumu
  final double _processNoise; // Q – šum dynamického modelu
  final double _measurementNoise; // R – šum měření polohy
  final double _measurementNoiseVelocity; // volitelný šum měření rychlosti

  List<double> get position => [_state[0], _state[1]];

  SimpleKalmanFilter2D({
    required double initialLat,
    required double initialLon,
    double processNoise = 1e-7,
    double measurementNoise = 1e-5,
    double measurementNoiseVelocity = 1e-4,
  })  : _processNoise = processNoise,
        _measurementNoise = measurementNoise,
        _measurementNoiseVelocity = measurementNoiseVelocity {
    _state[0] = initialLat;
    _state[1] = initialLon;
  }

  void predict(double dt) {
    final lat = _state[0];
    final lon = _state[1];
    final vLat = _state[2];
    final vLon = _state[3];

    _state[0] = lat + vLat * dt;
    _state[1] = lon + vLon * dt;

    final F = [
      [1.0, 0.0, dt, 0.0],
      [0.0, 1.0, 0.0, dt],
      [0.0, 0.0, 1.0, 0.0],
      [0.0, 0.0, 0.0, 1.0],
    ];
    final Q = [
      [_processNoise, 0.0, 0.0, 0.0],
      [0.0, _processNoise, 0.0, 0.0],
      [0.0, 0.0, _processNoise, 0.0],
      [0.0, 0.0, 0.0, _processNoise],
    ];

    _P = _matrixAdd(
      _matrixMult(_matrixMult(F, _P), _matrixTranspose(F)),
      Q,
    );
  }

  void update(double latMeas, double lonMeas,
      {double? speed, double? heading}) {
    if (speed != null && heading != null) {
      // Převod měřené rychlosti a směru na složky rychlosti v [deg/s].
      final double latRad = latMeas * pi / 180;
      final double mPerDegLat = 111320.0;
      final double mPerDegLon = 111320.0 * cos(latRad);
      final double speed_m_s = speed / 3.6; // km/h -> m/s
      final double vLatMeas =
          (speed_m_s * cos(heading * pi / 180)) / mPerDegLat;
      final double vLonMeas =
          (speed_m_s * sin(heading * pi / 180)) / mPerDegLon;

      // Měřicí vektor rozšířený o rychlost:
      final Z = [latMeas, lonMeas, vLatMeas, vLonMeas];
      // Matici měření nastavena jako identita 4×4:
      final H = _identity4();
      // Matici měřícího šumu R v diagonální matici
      final R = [
        [_measurementNoise, 0.0, 0.0, 0.0],
        [0.0, _measurementNoise, 0.0, 0.0],
        [0.0, 0.0, _measurementNoiseVelocity, 0.0],
        [0.0, 0.0, 0.0, _measurementNoiseVelocity],
      ];

      // Inovační kovariance: S = H * P * H^T + R. Protože H je identita, S = P + R.
      final S = _matrixAdd(_P, R);
      final SInv = _matrixInverse4x4(S);
      final K = _matrixMult(_P, SInv);

      final y = [
        Z[0] - _state[0],
        Z[1] - _state[1],
        Z[2] - _state[2],
        Z[3] - _state[3],
      ];

      final updateVec = _matrixVectMult(K, y);
      _state[0] += updateVec[0];
      _state[1] += updateVec[1];
      _state[2] += updateVec[2];
      _state[3] += updateVec[3];

      final KH = _matrixMult(K, H);
      final I = _identity4();
      final IminusKH = _matrixSub(I, KH);
      _P = _matrixMult(IminusKH, _P);
    } else {
      final H = [
        [1.0, 0.0, 0.0, 0.0],
        [0.0, 1.0, 0.0, 0.0],
      ];
      final R = [
        [_measurementNoise, 0.0],
        [0.0, _measurementNoise],
      ];

      final S = _matrixAdd(
        _matrixMult(H, _matrixMult(_P, _matrixTranspose(H))),
        R,
      );
      final PHt = _matrixMult(_P, _matrixTranspose(H));
      final SInv = _matrixInverse2x2(S);
      final K = _matrixMult(PHt, SInv);

      final hx = [_state[0], _state[1]];
      final y = [latMeas - hx[0], lonMeas - hx[1]];

      final updateVec = _matrixVectMult(K, y);
      _state[0] += updateVec[0];
      _state[1] += updateVec[1];
      _state[2] += updateVec[2];
      _state[3] += updateVec[3];

      final KH = _matrixMult(K, H);
      final I = _identity4();
      final IminusKH = _matrixSub(I, KH);
      _P = _matrixMult(IminusKH, _P);
    }
  }

  /// Jednotné volání predict a update – volitelně se předá i rychlost a heading.
  List<double> filter(double latMeas, double lonMeas, double dt,
      {double? speed, double? heading}) {
    predict(dt);
    update(latMeas, lonMeas, speed: speed, heading: heading);
    return position;
  }

  List<List<double>> _matrixMult(List<List<double>> A, List<List<double>> B) {
    final n = A.length;
    final m = A[0].length;
    final p = B[0].length;
    final result = List.generate(n, (_) => List.filled(p, 0.0));
    for (var i = 0; i < n; i++) {
      for (var j = 0; j < p; j++) {
        double sum = 0.0;
        for (var k = 0; k < m; k++) {
          sum += A[i][k] * B[k][j];
        }
        result[i][j] = sum;
      }
    }
    return result;
  }

  List<double> _matrixVectMult(List<List<double>> A, List<double> v) {
    final n = A.length;
    final result = List.filled(n, 0.0);
    for (var i = 0; i < n; i++) {
      double sum = 0;
      for (var j = 0; j < A[0].length; j++) {
        sum += A[i][j] * v[j];
      }
      result[i] = sum;
    }
    return result;
  }

  List<List<double>> _matrixTranspose(List<List<double>> A) {
    final n = A.length;
    final m = A[0].length;
    final result = List.generate(m, (_) => List.filled(n, 0.0));
    for (var i = 0; i < n; i++) {
      for (var j = 0; j < m; j++) {
        result[j][i] = A[i][j];
      }
    }
    return result;
  }

  List<List<double>> _matrixAdd(List<List<double>> A, List<List<double>> B) {
    final n = A.length;
    final m = A[0].length;
    final result = List.generate(n, (_) => List.filled(m, 0.0));
    for (var i = 0; i < n; i++) {
      for (var j = 0; j < m; j++) {
        result[i][j] = A[i][j] + B[i][j];
      }
    }
    return result;
  }

  List<List<double>> _matrixSub(List<List<double>> A, List<List<double>> B) {
    final n = A.length;
    final m = A[0].length;
    final result = List.generate(n, (_) => List.filled(m, 0.0));
    for (var i = 0; i < n; i++) {
      for (var j = 0; j < m; j++) {
        result[i][j] = A[i][j] - B[i][j];
      }
    }
    return result;
  }

  List<List<double>> _identity4() {
    return [
      [1.0, 0.0, 0.0, 0.0],
      [0.0, 1.0, 0.0, 0.0],
      [0.0, 0.0, 1.0, 0.0],
      [0.0, 0.0, 0.0, 1.0],
    ];
  }

  List<List<double>> _matrixInverse2x2(List<List<double>> M) {
    final a = M[0][0];
    final b = M[0][1];
    final c = M[1][0];
    final d = M[1][1];
    final det = a * d - b * c;
    if (det.abs() < 1e-14) {
      return [
        [0.0, 0.0],
        [0.0, 0.0],
      ];
    }
    final invDet = 1.0 / det;
    return [
      [d * invDet, -b * invDet],
      [-c * invDet, a * invDet],
    ];
  }

  /// implementace inverze 4×4 matice pomocí Gaussovy eliminace.
  List<List<double>> _matrixInverse4x4(List<List<double>> m) {
    int n = 4;
    // matice [m|I]
    List<List<double>> aug = List.generate(n, (i) => List.filled(2 * n, 0.0));
    for (int i = 0; i < n; i++) {
      for (int j = 0; j < n; j++) {
        aug[i][j] = m[i][j];
      }
      aug[i][n + i] = 1.0;
    }
    // Gaussova eliminace
    for (int i = 0; i < n; i++) {
      double pivot = aug[i][i];
      if (pivot.abs() < 1e-12) {
        for (int k = i + 1; k < n; k++) {
          if (aug[k][i].abs() > 1e-12) {
            List<double> temp = aug[i];
            aug[i] = aug[k];
            aug[k] = temp;
            pivot = aug[i][i];
            break;
          }
        }
      }
      if (pivot.abs() < 1e-12) {
        return List.generate(n, (_) => List.filled(n, 0.0));
      }
      for (int j = 0; j < 2 * n; j++) {
        aug[i][j] /= pivot;
      }
      for (int k = 0; k < n; k++) {
        if (k != i) {
          double factor = aug[k][i];
          for (int j = 0; j < 2 * n; j++) {
            aug[k][j] -= factor * aug[i][j];
          }
        }
      }
    }
    List<List<double>> inv = List.generate(n, (i) => List.filled(n, 0.0));
    for (int i = 0; i < n; i++) {
      for (int j = 0; j < n; j++) {
        inv[i][j] = aug[i][n + j];
      }
    }
    return inv;
  }
}
