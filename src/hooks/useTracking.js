import { useState, useRef, useCallback, useEffect } from 'react';
import { CentroidTracker } from '../utils/tracker';

export function useTracking() {
  const trackerRef = useRef(new CentroidTracker());
  const [tracks, setTracks] = useState([]);
  const [metrics, setMetrics] = useState({ activeTracks: 0, totalTracks: 0, avgDuration: 0, longestDuration: 0 });
  const [detectionHistory, setDetectionHistory] = useState([]);
  const [classCounts, setClassCounts] = useState({});
  const useKalmanRef = useRef(false);
  const tracksRef = useRef([]);

  tracksRef.current = tracks;

  const setUseKalman = useCallback((bool) => {
    useKalmanRef.current = bool;
    trackerRef.current.useKalman = bool;
  }, []);

  const resetTracker = useCallback(() => {
    trackerRef.current = new CentroidTracker();
    trackerRef.current.useKalman = useKalmanRef.current;
    setTracks([]);
    setMetrics({ activeTracks: 0, totalTracks: 0, avgDuration: 0, longestDuration: 0 });
  }, []);

  const updateTracks = useCallback((detections) => {
    const updatedTracks = trackerRef.current.update(detections);
    const tracksArray = Array.from(updatedTracks.values());
    setTracks(tracksArray);
    
    if (typeof trackerRef.current.getTrackingMetrics === 'function') {
      setMetrics(trackerRef.current.getTrackingMetrics());
    } else {
      setMetrics({
        activeTracks: updatedTracks.size,
        totalTracks: trackerRef.current.nextObjectId,
        avgDuration: 0,
        longestDuration: 0
      });
    }

    const counts = {};
    detections.forEach(d => {
      counts[d.class] = (counts[d.class] || 0) + 1;
    });
    setClassCounts(counts);

  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setDetectionHistory(prev => {
        const now = Date.now();
        const count = tracksRef.current.length;
        const newEntry = { timestamp: now, count };
        const updated = [...prev, newEntry];
        if (updated.length > 60) updated.shift();
        return updated;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return { tracks, metrics, updateTracks, resetTracker, setUseKalman, detectionHistory, classCounts };
}
