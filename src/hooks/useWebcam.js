import { useState, useRef, useCallback } from 'react';

export function useWebcam() {
  const videoRef = useRef(null);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);

  const enumerateDevices = useCallback(async () => {
    try {
      const mediaDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = mediaDevices.filter(device => device.kind === 'videoinput');
      setDevices(videoDevices);
      return videoDevices;
    } catch (err) {
      setError(err.message);
      return [];
    }
  }, []);

  const stopWebcam = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
    }
  }, []);

  const startWebcam = useCallback(async (deviceId) => {
    stopWebcam();
    setError(null);
    try {
      const constraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : true,
        audio: false
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play().catch(e => console.error("Webcam play error:", e));
            setIsStreaming(true);
          }
        };
      }
      setSelectedDevice(deviceId);
    } catch (err) {
      setError(err.message);
      setIsStreaming(false);
    }
  }, [stopWebcam]);

  const switchCamera = useCallback(async (deviceId) => {
    await startWebcam(deviceId);
  }, [startWebcam]);

  return { videoRef, devices, selectedDevice, isStreaming, error, startWebcam, stopWebcam, switchCamera, enumerateDevices };
}
