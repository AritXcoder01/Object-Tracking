import React from 'react';

export default function TopBar({ videoSource, onSourceChange, devices, selectedDevice, onDeviceChange, modelStatus, fps, isRunning }) {
  const statusClass = modelStatus === 'ready' ? 'ready' : modelStatus === 'loading' ? 'loading' : modelStatus === 'error' ? 'error' : '';

  return (
    <div className="topbar">
      <div className="topbar-title">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="2" x2="12" y2="6"/>
          <line x1="12" y1="18" x2="12" y2="22"/>
          <line x1="2" y1="12" x2="6" y2="12"/>
          <line x1="18" y1="12" x2="22" y2="12"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
        <span>Object Detection &amp; Tracking</span>
      </div>

      <div className="source-selector">
        <button
          className={`source-btn ${videoSource === 'webcam' ? 'active' : ''}`}
          onClick={() => onSourceChange('webcam')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 4, verticalAlign: 'middle' }}>
            <path d="M23 7l-7 5 7 5V7z"/>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
          </svg>
          Webcam
        </button>
        <button
          className={`source-btn ${videoSource === 'file' ? 'active' : ''}`}
          onClick={() => onSourceChange('file')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 4, verticalAlign: 'middle' }}>
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
            <polyline points="13 2 13 9 20 9"/>
          </svg>
          Upload Video
        </button>
      </div>

      <div className="topbar-status">
        <span className={`status-dot ${statusClass}`} />
        <span className="fps-badge">{fps} FPS</span>
        {isRunning && <span style={{ fontSize: 12, color: '#00ff88', fontWeight: 600 }}>● Live</span>}
      </div>
    </div>
  );
}
