import { KalmanFilter } from './kalmanFilter.js';

export class CentroidTracker {
  constructor(options = {}) {
    this.maxDisappeared = options.maxDisappeared || 30;
    this.maxDistance = options.maxDistance || 100;
    this.useKalman = options.useKalman !== undefined ? options.useKalman : true;
    
    this.nextObjectId = 1;
    this.objects = new Map();
    this.completedTracks = [];
  }

  euclideanDistance(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  }

  register(detection) {
    const id = this.nextObjectId++;
    const kalman = this.useKalman ? new KalmanFilter({
      x: detection.centroid.x,
      y: detection.centroid.y,
      w: detection.bbox[2],
      h: detection.bbox[3]
    }) : null;

    this.objects.set(id, {
      id,
      centroid: detection.centroid,
      bbox: detection.bbox,
      class: detection.class,
      score: detection.score,
      kalman,
      disappeared: 0,
      trail: [detection.centroid],
      startTime: Date.now(),
      lastSeen: Date.now(),
      speed: 0
    });
  }

  deregister(objectId) {
    const obj = this.objects.get(objectId);
    if (obj) {
      this.completedTracks.push({
        id: obj.id,
        class: obj.class,
        startTime: obj.startTime,
        duration: Date.now() - obj.startTime,
        lastPosition: obj.centroid,
        speed: obj.speed
      });
      this.objects.delete(objectId);
    }
  }

  update(detections) {
    if (detections.length === 0) {
      for (const [id, obj] of this.objects.entries()) {
        obj.disappeared++;
        if (obj.kalman) {
            const pred = obj.kalman.predict();
            obj.centroid = { x: pred.x, y: pred.y };
            obj.bbox = [pred.x - pred.w / 2, pred.y - pred.h / 2, pred.w, pred.h];
            obj.kalman.markMissed();
        }
        // Don't add to trail during disappeared frames (prevents drift lines)
        if (obj.disappeared > this.maxDisappeared) {
          this.deregister(id);
        }
      }
      return this.objects;
    }

    if (this.objects.size === 0) {
      for (const det of detections) {
        this.register(det);
      }
      return this.objects;
    }

    const objectIds = Array.from(this.objects.keys());
    const objectCentroids = objectIds.map(id => this.objects.get(id).centroid);
    const inputCentroids = detections.map(d => d.centroid);

    const distances = [];
    for (let i = 0; i < objectCentroids.length; i++) {
      for (let j = 0; j < inputCentroids.length; j++) {
        distances.push({
          objIndex: i,
          detIndex: j,
          dist: this.euclideanDistance(objectCentroids[i], inputCentroids[j])
        });
      }
    }

    distances.sort((a, b) => a.dist - b.dist);

    const usedObjects = new Set();
    const usedDetections = new Set();

    for (const match of distances) {
      if (usedObjects.has(match.objIndex) || usedDetections.has(match.detIndex)) {
        continue;
      }
      if (match.dist > this.maxDistance) {
        continue;
      }

      const objectId = objectIds[match.objIndex];
      const obj = this.objects.get(objectId);
      const det = detections[match.detIndex];

      const prevCentroid = obj.centroid;
      
      let newCentroid = det.centroid;
      let newBbox = det.bbox;

      if (obj.kalman) {
          obj.kalman.predict();
          const corrected = obj.kalman.update({
              x: det.centroid.x,
              y: det.centroid.y,
              w: det.bbox[2],
              h: det.bbox[3]
          });
          newCentroid = { x: corrected.x, y: corrected.y };
          newBbox = [corrected.x - corrected.w / 2, corrected.y - corrected.h / 2, corrected.w, corrected.h];
      }

      obj.centroid = newCentroid;
      obj.bbox = newBbox;
      obj.class = det.class;
      obj.score = det.score;
      obj.disappeared = 0;
      obj.lastSeen = Date.now();
      
      obj.trail.push(newCentroid);
      if (obj.trail.length > 50) {
        obj.trail.shift();
      }

      obj.speed = this.euclideanDistance(prevCentroid, newCentroid);

      usedObjects.add(match.objIndex);
      usedDetections.add(match.detIndex);
    }

    for (let i = 0; i < objectIds.length; i++) {
      if (!usedObjects.has(i)) {
        const objectId = objectIds[i];
        const obj = this.objects.get(objectId);
        obj.disappeared++;
        
        if (obj.kalman) {
            const pred = obj.kalman.predict();
            obj.centroid = { x: pred.x, y: pred.y };
            obj.bbox = [pred.x - pred.w / 2, pred.y - pred.h / 2, pred.w, pred.h];
            obj.kalman.markMissed();
        }

        if (obj.disappeared > this.maxDisappeared) {
          this.deregister(objectId);
        }
      }
    }

    for (let i = 0; i < inputCentroids.length; i++) {
      if (!usedDetections.has(i)) {
        this.register(detections[i]);
      }
    }

    return this.objects;
  }

  getActiveTrackCount() {
    return this.objects.size;
  }

  getTotalTrackCount() {
    return this.nextObjectId - 1;
  }

  getCompletedTracks() {
    return this.completedTracks;
  }

  getTrackingMetrics() {
    let longestDuration = 0;
    let totalDuration = 0;
    
    this.completedTracks.forEach(t => {
      if (t.duration > longestDuration) longestDuration = t.duration;
      totalDuration += t.duration;
    });

    for (const obj of this.objects.values()) {
        const duration = Date.now() - obj.startTime;
        if (duration > longestDuration) longestDuration = duration;
        totalDuration += duration;
    }
    
    const totalCount = this.getTotalTrackCount();

    return {
      activeTracks: this.getActiveTrackCount(),
      totalTracks: totalCount,
      completedTracks: this.completedTracks.length,
      avgDuration: totalCount > 0 ? totalDuration / totalCount : 0,
      longestDuration
    };
  }

  reset() {
    this.objects.clear();
    this.completedTracks = [];
    this.nextObjectId = 1;
  }

  setUseKalman(use) {
    this.useKalman = use;
  }
}

export function classifySpeed(speed) {
  if (speed < 2) return 'stationary';
  if (speed < 10) return 'slow';
  if (speed < 30) return 'moderate';
  return 'fast';
}
