export class KalmanFilter {
  constructor(initialState) {
    // State vector: [x, y, w, h, vx, vy]
    this.x = [
      initialState.x,
      initialState.y,
      initialState.w,
      initialState.h,
      0, // vx
      0  // vy
    ];

    // State covariance matrix (P)
    this.P = [
      [1, 0, 0, 0, 0, 0],
      [0, 1, 0, 0, 0, 0],
      [0, 0, 1, 0, 0, 0],
      [0, 0, 0, 1, 0, 0],
      [0, 0, 0, 0, 10, 0],
      [0, 0, 0, 0, 0, 10]
    ];

    // State transition matrix (F)
    this.F = [
      [1, 0, 0, 0, 1, 0], // x = x + vx
      [0, 1, 0, 0, 0, 1], // y = y + vy
      [0, 0, 1, 0, 0, 0],
      [0, 0, 0, 1, 0, 0],
      [0, 0, 0, 0, 1, 0],
      [0, 0, 0, 0, 0, 1]
    ];

    // Process noise covariance (Q)
    this.Q = [
      [1, 0, 0, 0, 0, 0],
      [0, 1, 0, 0, 0, 0],
      [0, 0, 1, 0, 0, 0],
      [0, 0, 0, 1, 0, 0],
      [0, 0, 0, 0, 0.01, 0],
      [0, 0, 0, 0, 0, 0.01]
    ];

    // Measurement matrix (H)
    this.H = [
      [1, 0, 0, 0, 0, 0],
      [0, 1, 0, 0, 0, 0],
      [0, 0, 1, 0, 0, 0],
      [0, 0, 0, 1, 0, 0]
    ];

    // Measurement noise covariance (R)
    this.R = [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1]
    ];

    this.missedFrames = 0;
  }

  multiplyMatrixVector(mat, vec) {
    const res = new Array(mat.length).fill(0);
    for (let i = 0; i < mat.length; i++) {
      for (let j = 0; j < vec.length; j++) {
        res[i] += mat[i][j] * vec[j];
      }
    }
    return res;
  }

  multiplyMatrix6x6(A, B) {
    const res = Array.from({ length: 6 }, () => new Array(6).fill(0));
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 6; j++) {
        for (let k = 0; k < 6; k++) {
          res[i][j] += A[i][k] * B[k][j];
        }
      }
    }
    return res;
  }
  
  addMatrix6x6(A, B) {
     const res = Array.from({ length: 6 }, () => new Array(6).fill(0));
     for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 6; j++) {
           res[i][j] = A[i][j] + B[i][j];
        }
     }
     return res;
  }

  transposeMatrix6x6(A) {
    const res = Array.from({ length: 6 }, () => new Array(6).fill(0));
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 6; j++) {
        res[j][i] = A[i][j];
      }
    }
    return res;
  }

  predict() {
    this.x = this.multiplyMatrixVector(this.F, this.x);

    const FP = this.multiplyMatrix6x6(this.F, this.P);
    const FT = this.transposeMatrix6x6(this.F);
    const FPFT = this.multiplyMatrix6x6(FP, FT);
    this.P = this.addMatrix6x6(FPFT, this.Q);

    return {
      x: this.x[0],
      y: this.x[1],
      w: this.x[2],
      h: this.x[3]
    };
  }

  update(measurement) {
    this.missedFrames = 0;
    const z = [measurement.x, measurement.y, measurement.w, measurement.h];

    const Hx = [this.x[0], this.x[1], this.x[2], this.x[3]];
    const y = [z[0] - Hx[0], z[1] - Hx[1], z[2] - Hx[2], z[3] - Hx[3]];

    const S = [
      [this.P[0][0] + this.R[0][0], 0, 0, 0],
      [0, this.P[1][1] + this.R[1][1], 0, 0],
      [0, 0, this.P[2][2] + this.R[2][2], 0],
      [0, 0, 0, this.P[3][3] + this.R[3][3]]
    ];

    const Sinv = [
      1 / S[0][0],
      1 / S[1][1],
      1 / S[2][2],
      1 / S[3][3]
    ];

    const K = [
      [this.P[0][0] * Sinv[0], 0, 0, 0],
      [0, this.P[1][1] * Sinv[1], 0, 0],
      [0, 0, this.P[2][2] * Sinv[2], 0],
      [0, 0, 0, this.P[3][3] * Sinv[3]],
      [this.P[4][0] * Sinv[0], 0, 0, 0],
      [0, this.P[5][1] * Sinv[1], 0, 0]
    ];

    for (let i = 0; i < 6; i++) {
      let Ky = 0;
      for(let j = 0; j < 4; j++){
         if(K[i][j]) Ky += K[i][j] * y[j];
      }
      this.x[i] += Ky;
    }

    for (let i = 0; i < 4; i++) {
        this.P[i][i] = (1 - K[i][i]) * this.P[i][i];
    }
    
    return {
      x: this.x[0],
      y: this.x[1],
      w: this.x[2],
      h: this.x[3]
    };
  }

  getState() {
    return {
      x: this.x[0],
      y: this.x[1],
      w: this.x[2],
      h: this.x[3],
      vx: this.x[4],
      vy: this.x[5]
    };
  }

  getMissedFrames() {
    return this.missedFrames;
  }

  markMissed() {
    this.missedFrames++;
  }
}
