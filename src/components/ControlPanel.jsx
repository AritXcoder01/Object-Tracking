import React, { useRef } from 'react';

function Toggle({ label, active, onToggle }) {
  return (
    <div className="toggle-row">
      <span className="toggle-label">{label}</span>
      <div className={`toggle-switch ${active ? 'active' : ''}`} onClick={onToggle}>
        <div className="toggle-knob" />
      </div>
    </div>
  );
}

export default function ControlPanel({
  videoSource, onSourceChange, onFileUpload,
  confidenceThreshold, onConfidenceChange,
  showBoxes, onToggleBoxes,
  showLabels, onToggleLabels,
  showTrails, onToggleTrails,
  boxThickness, onBoxThicknessChange,
  isRunning, onToggleRunning,
  onSnapshot, onToggleRecord, isRecording,
  targetFps, onTargetFpsChange,
  useKalman, onToggleKalman,
  showZones, onToggleZones,
  isDrawingZone, onToggleDrawZone,
  motionDetection, onToggleMotion,
  crowdDetection, onToggleCrowd,
  onFullscreen, onStop, onReset,
  showHeatmap, onToggleHeatmap
}) {
  const fileInputRef = useRef(null);

  return (
    <div className="control-panel">
      {/* Video Source */}
      <div className="control-section">
        <h3>Video Source</h3>
        <div className="control-card">
          <div
            className="file-upload-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6, verticalAlign: 'middle' }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Upload Video File
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/avi,video/*"
            onChange={onFileUpload}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {/* Detection Settings */}
      <div className="control-section">
        <h3>Detection Settings</h3>
        <div className="control-card">
          <div className="slider-control">
            <div className="slider-label">
              <span>Confidence</span>
              <span className="slider-value">{Math.round(confidenceThreshold * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round(confidenceThreshold * 100)}
              onChange={(e) => onConfidenceChange(Number(e.target.value) / 100)}
            />
          </div>
        </div>
        <div className="control-card">
          <Toggle label="Bounding Boxes" active={showBoxes} onToggle={onToggleBoxes} />
          <Toggle label="Labels" active={showLabels} onToggle={onToggleLabels} />
          <Toggle label="Tracking Trails" active={showTrails} onToggle={onToggleTrails} />
          <Toggle label="Heatmap" active={showHeatmap} onToggle={onToggleHeatmap} />
        </div>
        <div className="control-card">
          <div className="slider-control">
            <div className="slider-label">
              <span>Box Thickness</span>
              <span className="slider-value">{boxThickness}px</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={boxThickness}
              onChange={(e) => onBoxThicknessChange(Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* Video Controls */}
      <div className="control-section">
        <h3>Video Controls</h3>
        <div className="btn-row">
          <button className={`control-btn ${isRunning ? 'active' : ''}`} onClick={onToggleRunning} title={isRunning ? 'Pause' : 'Play'}>
            {isRunning ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            )}
          </button>
          <button className="control-btn danger" onClick={onStop} title="Stop">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
          </button>
          <button className="control-btn" onClick={onFullscreen} title="Fullscreen">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
          </button>
          <button className="control-btn" onClick={onSnapshot} title="Snapshot">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          </button>
          <button className={`control-btn ${isRecording ? 'recording' : ''}`} onClick={onToggleRecord} title={isRecording ? 'Stop Recording' : 'Record'}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill={isRecording ? '#ff3366' : 'currentColor'}><circle cx="12" cy="12" r="8"/></svg>
          </button>
        </div>
      </div>

      {/* Performance */}
      <div className="control-section">
        <h3>Performance</h3>
        <div className="control-card">
          <div className="slider-label">
            <span>Target FPS</span>
          </div>
          <select
            className="control-select"
            value={targetFps}
            onChange={(e) => onTargetFpsChange(Number(e.target.value))}
          >
            <option value={15}>15 FPS</option>
            <option value={30}>30 FPS</option>
            <option value={60}>60 FPS</option>
          </select>
        </div>
      </div>

      {/* Advanced */}
      <div className="control-section">
        <h3>Advanced</h3>
        <div className="control-card">
          <Toggle label="Kalman Filter" active={useKalman} onToggle={onToggleKalman} />
          <Toggle label="Motion Detection" active={motionDetection} onToggle={onToggleMotion} />
          <Toggle label="Crowd Detection" active={crowdDetection} onToggle={onToggleCrowd} />
          <Toggle label="Zone Detection" active={showZones} onToggle={onToggleZones} />
        </div>
        <div className="btn-row" style={{ marginTop: 8 }}>
          <button
            className={`control-btn ${isDrawingZone ? 'active' : ''}`}
            onClick={onToggleDrawZone}
            title="Draw Zone"
            style={{ width: 'auto', padding: '0 12px', fontSize: 12 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 4 }}><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
            Draw Zone
          </button>
          <button
            className="control-btn danger"
            onClick={onReset}
            title="Reset Tracker"
            style={{ width: 'auto', padding: '0 12px', fontSize: 12 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 4 }}><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
