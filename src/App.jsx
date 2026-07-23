import { useState, useRef, useCallback, useEffect } from 'react';
import './App.css';
import TopBar from './components/TopBar';
import VideoCanvas from './components/VideoCanvas';
import ControlPanel from './components/ControlPanel';
import StatsPanel from './components/StatsPanel';
import Timeline from './components/Timeline';
import AlertSystem from './components/AlertSystem';
import { useWebcam } from './hooks/useWebcam';
import { useDetection } from './hooks/useDetection';
import { useTracking } from './hooks/useTracking';
import { ZoneManager } from './utils/zoneManager';
import { CanvasRecorder, captureSnapshot } from './utils/recorder';
import { exportDetectionsJSON, exportTrackingCSV } from './utils/exportUtils';

function App() {
  const [videoSource, setVideoSource] = useState('webcam');
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.5);
  const [showBoxes, setShowBoxes] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showTrails, setShowTrails] = useState(true);
  const [showZones, setShowZones] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [boxThickness, setBoxThickness] = useState(2);
  const [targetFps, setTargetFps] = useState(30);
  const [useKalmanFilter, setUseKalmanFilter] = useState(true);
  const [motionDetection, setMotionDetection] = useState(false);
  const [crowdDetection, setCrowdDetection] = useState(true);
  const [isDrawingZone, setIsDrawingZone] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [fileVideoUrl, setFileVideoUrl] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [fpsHistory, setFpsHistory] = useState([]);

  const canvasRef = useRef(null);
  const fileVideoRef = useRef(null);
  const recorderRef = useRef(null);
  const zoneManagerRef = useRef(new ZoneManager());
  const alertIdRef = useRef(0);

  const { videoRef, devices, selectedDevice, isStreaming, error: webcamError, startWebcam, stopWebcam, switchCamera, enumerateDevices } = useWebcam();
  const { modelStatus, detections, fps, latency, isRunning, frameCount, initModel, startDetection, stopDetection } = useDetection();
  const { tracks, metrics, updateTracks, resetTracker, setUseKalman, detectionHistory, classCounts } = useTracking();

  const fpsRef = useRef(fps);
  fpsRef.current = fps;

  useEffect(() => {
    initModel();
    enumerateDevices();
  }, []);

  // Auto-start webcam and detection loop as soon as model and camera are ready
  useEffect(() => {
    if (modelStatus === 'ready' && videoSource === 'webcam') {
      if (!isStreaming) {
        startWebcam();
      } else if (!isRunning && videoRef.current) {
        startDetection(videoRef.current, { confidenceThreshold, targetFps });
      }
    }
  }, [modelStatus, videoSource, isStreaming, isRunning, startWebcam, startDetection, confidenceThreshold, targetFps, videoRef]);

  useEffect(() => {
    if (detections) {
      updateTracks(detections);
    }
  }, [detections, updateTracks]);

  // Record FPS history without tearing down timer on every frame
  useEffect(() => {
    const interval = setInterval(() => {
      setFpsHistory(prev => {
        const newHistory = [...prev, fpsRef.current];
        if (newHistory.length > 30) newHistory.shift();
        return newHistory;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const addAlert = useCallback((type, message) => {
    const id = alertIdRef.current++;
    setAlerts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setAlerts(prev => prev.filter(alert => alert.id !== id));
    }, 5000);
  }, []);

  useEffect(() => {
    if (crowdDetection && tracks && tracks.length > 0 && zoneManagerRef.current.getZones().length > 0) {
      const tracksMap = new Map(tracks.map(t => [t.id, t]));
      const zoneResults = zoneManagerRef.current.checkObjectsInZones(tracksMap);
      const crowded = zoneResults.filter(z => z.isCrowded);
      if (crowded.length > 0) {
        addAlert('warning', `Crowd detected in ${crowded.length} zone(s)`);
      }
    }
  }, [tracks, crowdDetection, addAlert]);

  const handleSourceChange = (source) => {
    stopDetection();
    if (videoSource === 'webcam') {
      stopWebcam();
    } else {
      if (fileVideoUrl) URL.revokeObjectURL(fileVideoUrl);
      setFileVideoUrl(null);
    }
    setVideoSource(source);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setFileVideoUrl(url);
      setVideoSource('file');
      addAlert('success', `Loaded video: ${file.name}`);
      
      setTimeout(() => {
        const video = fileVideoRef.current;
        if (video) {
          video.play().catch(() => {});
          startDetection(video, { confidenceThreshold, targetFps });
        }
      }, 300);
    }
  };

  const handleToggleRunning = () => {
    const activeVideo = videoSource === 'webcam' ? videoRef.current : fileVideoRef.current;
    if (isRunning) {
      stopDetection();
      if (activeVideo && videoSource === 'file') activeVideo.pause();
    } else {
      if (activeVideo) {
        if (videoSource === 'file') activeVideo.play().catch(() => {});
        startDetection(activeVideo, { confidenceThreshold, targetFps });
      } else {
        addAlert('danger', 'Video source not ready');
      }
    }
  };

  const handleSnapshot = () => {
    if (canvasRef.current) {
      captureSnapshot(canvasRef.current);
      addAlert('success', 'Snapshot saved');
    }
  };

  const handleToggleRecord = async () => {
    if (isRecording) {
      if (recorderRef.current) {
        await recorderRef.current.stopRecording();
        recorderRef.current.downloadRecording();
        addAlert('info', 'Recording saved');
      }
      setIsRecording(false);
    } else {
      if (canvasRef.current) {
        recorderRef.current = new CanvasRecorder(canvasRef.current);
        recorderRef.current.startRecording();
        setIsRecording(true);
        addAlert('info', 'Recording started');
      }
    }
  };

  const handleExportJSON = () => {
    if (detections && detections.length > 0) {
      exportDetectionsJSON(detections);
      addAlert('success', 'Detections exported to JSON');
    } else {
      addAlert('warning', 'No detections to export');
    }
  };

  const handleExportCSV = () => {
    if (tracks && tracks.length > 0) {
      exportTrackingCSV(tracks);
      addAlert('success', 'Tracking data exported to CSV');
    } else {
      addAlert('warning', 'No tracking data to export');
    }
  };

  const handleFullscreen = () => {
    if (canvasRef.current && canvasRef.current.parentElement) {
      canvasRef.current.parentElement.requestFullscreen().catch(err => {
        addAlert('danger', `Fullscreen error: ${err.message}`);
      });
    }
  };

  const handleStop = () => {
    stopDetection();
    if (videoSource === 'webcam') {
      stopWebcam();
    } else if (fileVideoRef.current) {
      fileVideoRef.current.pause();
    }
    addAlert('info', 'Stopped all processes');
  };

  const handleReset = () => {
    resetTracker();
    setAlerts([]);
    addAlert('success', 'Tracker reset');
  };

  const handleCanvasClick = (e) => {
    if (isDrawingZone) {
      zoneManagerRef.current.handleDraw(e);
      addAlert('info', 'ROI Zone created');
    }
  };

  return (
    <div className="app-container">
      <TopBar
        videoSource={videoSource}
        onSourceChange={handleSourceChange}
        devices={devices}
        selectedDevice={selectedDevice}
        onDeviceChange={switchCamera}
        modelStatus={modelStatus}
        fps={fps}
        isRunning={isRunning}
      />
      
      <div className="main-content">
        <ControlPanel
          videoSource={videoSource}
          onSourceChange={handleSourceChange}
          onFileUpload={handleFileUpload}
          confidenceThreshold={confidenceThreshold}
          onConfidenceChange={setConfidenceThreshold}
          showBoxes={showBoxes}
          onToggleBoxes={() => setShowBoxes(v => !v)}
          showLabels={showLabels}
          onToggleLabels={() => setShowLabels(v => !v)}
          showTrails={showTrails}
          onToggleTrails={() => setShowTrails(v => !v)}
          boxThickness={boxThickness}
          onBoxThicknessChange={setBoxThickness}
          isRunning={isRunning}
          onToggleRunning={handleToggleRunning}
          onSnapshot={handleSnapshot}
          onToggleRecord={handleToggleRecord}
          isRecording={isRecording}
          targetFps={targetFps}
          onTargetFpsChange={setTargetFps}
          useKalman={useKalmanFilter}
          onToggleKalman={() => {
            setUseKalmanFilter(v => !v);
            setUseKalman(!useKalmanFilter);
          }}
          showZones={showZones}
          onToggleZones={() => setShowZones(v => !v)}
          isDrawingZone={isDrawingZone}
          onToggleDrawZone={() => setIsDrawingZone(v => !v)}
          motionDetection={motionDetection}
          onToggleMotion={() => setMotionDetection(v => !v)}
          crowdDetection={crowdDetection}
          onToggleCrowd={() => setCrowdDetection(v => !v)}
          onFullscreen={handleFullscreen}
          onStop={handleStop}
          onReset={handleReset}
          showHeatmap={showHeatmap}
          onToggleHeatmap={() => setShowHeatmap(v => !v)}
        />

        <VideoCanvas
          videoRef={videoSource === 'webcam' ? videoRef : fileVideoRef}
          canvasRef={canvasRef}
          videoSource={videoSource}
          fileVideoUrl={fileVideoUrl}
          detections={detections}
          tracks={tracks}
          showBoxes={showBoxes}
          showLabels={showLabels}
          showTrails={showTrails}
          showZones={showZones}
          zones={zoneManagerRef.current.getZones()}
          fps={fps}
          isProcessing={modelStatus === 'loading'}
          onCanvasClick={handleCanvasClick}
          boxThickness={boxThickness}
          showHeatmap={showHeatmap}
          onLoadedMetadata={() => setDuration(fileVideoRef.current?.duration || 0)}
          onTimeUpdate={() => setCurrentTime(fileVideoRef.current?.currentTime || 0)}
        />

        <StatsPanel
          detections={detections}
          tracks={tracks}
          metrics={metrics}
          fps={fps}
          latency={latency}
          classCounts={classCounts}
          detectionHistory={detectionHistory}
          frameCount={frameCount}
          fpsHistory={fpsHistory}
        />
      </div>

      <Timeline
        videoRef={videoSource === 'webcam' ? videoRef : fileVideoRef}
        videoSource={videoSource}
        onExportJSON={handleExportJSON}
        onExportCSV={handleExportCSV}
        onSnapshot={handleSnapshot}
        isFileVideo={videoSource === 'file'}
        currentTime={currentTime}
        duration={duration}
      />

      <AlertSystem alerts={alerts} />
    </div>
  );
}

export default App;
