import React, { useMemo } from 'react';
import DetectionChart from './DetectionChart';
import ClassPieChart from './ClassPieChart';
import FpsChart from './FpsChart';
import { getClassColor } from '../utils/detector';

function formatDuration(ms) {
  if (!ms || ms < 0) return '0s';
  const secs = Math.floor(ms / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  return `${mins}m ${secs % 60}s`;
}

export default function StatsPanel({ detections, tracks, metrics, fps, latency, classCounts, detectionHistory, fpsHistory, frameCount }) {
  const sortedClasses = useMemo(() => {
    return Object.entries(classCounts || {}).sort((a, b) => b[1] - a[1]);
  }, [classCounts]);

  const topClass = sortedClasses.length > 0 ? sortedClasses[0][0] : 'None';

  return (
    <div className="stats-panel">
      {/* Live Detection Stats */}
      <div className="stats-section">
        <h3>Live Detection</h3>
        <div className="stat-grid">
          <div className="stat-card accent">
            <div className="stat-value">{detections ? detections.length : 0}</div>
            <div className="stat-label">Objects in Frame</div>
          </div>
          <div className="stat-card success">
            <div className="stat-value" style={{ fontSize: topClass.length > 6 ? 16 : 22 }}>{topClass}</div>
            <div className="stat-label">Most Common</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{fps}</div>
            <div className="stat-label">FPS</div>
          </div>
          <div className="stat-card warning">
            <div className="stat-value">{latency}<span style={{ fontSize: 11, opacity: 0.6 }}>ms</span></div>
            <div className="stat-label">Latency</div>
          </div>
        </div>
      </div>

      {/* Class Breakdown */}
      <div className="stats-section">
        <h3>Class Breakdown</h3>
        <div className="control-card">
          {sortedClasses.length === 0 ? (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', padding: 8, textAlign: 'center' }}>No objects detected</div>
          ) : (
            <ul className="class-list">
              {sortedClasses.map(([cls, count]) => (
                <li key={cls} className="class-item">
                  <span className="class-dot" style={{ backgroundColor: getClassColor(cls) }} />
                  <span className="class-name">{cls}</span>
                  <span className="class-count">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Tracking Metrics */}
      <div className="stats-section">
        <h3>Tracking</h3>
        <div className="stat-grid">
          <div className="stat-card accent">
            <div className="stat-value">{metrics?.activeTracks || 0}</div>
            <div className="stat-label">Active Tracks</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{metrics?.totalTracks || 0}</div>
            <div className="stat-label">Total Tracks</div>
          </div>
          <div className="stat-card success">
            <div className="stat-value">{formatDuration(metrics?.avgDuration)}</div>
            <div className="stat-label">Avg Duration</div>
          </div>
          <div className="stat-card warning">
            <div className="stat-value">{formatDuration(metrics?.longestDuration)}</div>
            <div className="stat-label">Longest Track</div>
          </div>
        </div>
      </div>

      {/* Detection Timeline Chart */}
      <div className="stats-section">
        <h3>Detection Timeline</h3>
        <div className="chart-container">
          <DetectionChart detectionHistory={detectionHistory || []} />
        </div>
      </div>

      {/* Class Distribution Pie */}
      <div className="stats-section">
        <h3>Class Distribution</h3>
        <div className="chart-container">
          <ClassPieChart classCounts={classCounts || {}} />
        </div>
      </div>

      {/* FPS History Chart */}
      <div className="stats-section">
        <h3>FPS History</h3>
        <div className="chart-container">
          <FpsChart fpsHistory={fpsHistory || []} />
        </div>
      </div>

      {/* Frame Counter */}
      <div className="stats-section">
        <div className="stat-card" style={{ textAlign: 'center' }}>
          <div className="stat-value" style={{ fontSize: 16 }}>{frameCount?.toLocaleString() || 0}</div>
          <div className="stat-label">Total Frames Processed</div>
        </div>
      </div>
    </div>
  );
}
