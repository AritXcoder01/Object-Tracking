import React from 'react';

export default function Timeline({ videoRef, videoSource, onExportJSON, onExportCSV, onSnapshot, isFileVideo, currentTime, duration }) {
  const formatTime = (time) => {
    if (isNaN(time) || !time) return "00:00";
    const m = Math.floor(time / 60).toString().padStart(2, '0');
    const s = Math.floor(time % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeek = (e) => {
    if (!videoRef?.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pos * duration;
  };

  return (
    <div className="timeline-bar">
      <div className="time-display">
        {formatTime(currentTime)} / {formatTime(duration)}
      </div>

      <div className="timeline-progress" onClick={isFileVideo ? handleSeek : undefined}>
        <div className="timeline-fill" style={{ width: `${progress}%` }}>
          {isFileVideo && <div className="timeline-thumb" style={{ left: `${progress}%` }} />}
        </div>
      </div>

      <div className="export-actions">
        <button className="export-btn" onClick={onSnapshot}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
          </svg>
          Snapshot
        </button>
        <button className="export-btn" onClick={onExportJSON}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          JSON
        </button>
        <button className="export-btn" onClick={onExportCSV}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          CSV
        </button>
      </div>
    </div>
  );
}
