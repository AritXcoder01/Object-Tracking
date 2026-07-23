import { useState, useRef, useCallback, useEffect } from 'react';
import { loadModel, detectObjects, isModelLoaded } from '../utils/detector';

export function useDetection() {
  const [modelStatus, setModelStatus] = useState('idle');
  const [detections, setDetections] = useState([]);
  const [fps, setFps] = useState(0);
  const [latency, setLatency] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [frameCount, setFrameCount] = useState(0);
  const runningRef = useRef(false);

  const requestRef = useRef(null);
  const lastDetectTime = useRef(0);
  const framesInLastSecond = useRef(0);
  const lastFpsTime = useRef(performance.now());
  const thresholdRef = useRef(0.5);

  const initModel = useCallback(async () => {
    setModelStatus('loading');
    try {
      await loadModel();
      setModelStatus('ready');
    } catch (error) {
      console.error(error);
      setModelStatus('error');
    }
  }, []);

  const setConfidenceThreshold = useCallback((value) => {
    thresholdRef.current = value;
  }, []);

  const stopDetection = useCallback(() => {
    runningRef.current = false;
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
    setIsRunning(false);
  }, []);

  const startDetection = useCallback((videoElement, options = {}) => {
    if (!isModelLoaded()) {
      console.warn("Model not loaded yet");
      return;
    }
    const { confidenceThreshold = 0.5, targetFps = 30 } = options;
    thresholdRef.current = confidenceThreshold;
    runningRef.current = true;
    setIsRunning(true);
    
    const minTimePerFrame = 1000 / targetFps;

    const detectFrame = async (time) => {
      if (!runningRef.current) return;

      // Allow readyState >= 2 (HAVE_CURRENT_DATA or HAVE_ENOUGH_DATA) with valid dimensions
      if (!videoElement || videoElement.readyState < 2 || !videoElement.videoWidth) {
        requestRef.current = requestAnimationFrame(detectFrame);
        return;
      }

      if (time - lastDetectTime.current < minTimePerFrame) {
        requestRef.current = requestAnimationFrame(detectFrame);
        return;
      }
      lastDetectTime.current = time;

      const start = performance.now();
      try {
        const newDetections = await detectObjects(videoElement, thresholdRef.current);
        const end = performance.now();
        
        setLatency(Math.round(end - start));
        setDetections(newDetections);
        setFrameCount(prev => prev + 1);
        
        framesInLastSecond.current++;
        if (end - lastFpsTime.current >= 500) {
          setFps(Math.round((framesInLastSecond.current * 1000) / (end - lastFpsTime.current)));
          framesInLastSecond.current = 0;
          lastFpsTime.current = end;
        }
      } catch (err) {
        console.error("Detection frame error:", err);
      }
      
      if (runningRef.current) {
        requestRef.current = requestAnimationFrame(detectFrame);
      }
    };

    requestRef.current = requestAnimationFrame(detectFrame);
  }, []);

  useEffect(() => {
    return () => stopDetection();
  }, [stopDetection]);

  return { modelStatus, detections, fps, latency, isRunning, frameCount, initModel, startDetection, stopDetection, setConfidenceThreshold };
}
