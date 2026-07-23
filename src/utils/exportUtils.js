export function exportDetectionsJSON(detections, filename = 'detections') {
  const jsonStr = JSON.stringify(detections, null, 2);
  downloadFile(jsonStr, `${filename}.json`, 'application/json');
}

export function exportTrackingCSV(tracks, filename = 'tracking-data') {
  const headers = ['TrackID', 'Class', 'StartTime', 'Duration', 'LastX', 'LastY', 'Speed', 'Status'];
  const rows = [headers.join(',')];

  for (const track of tracks) {
    const status = track.duration ? 'Completed' : 'Active';
    const durationStr = formatDuration(track.duration || (Date.now() - track.startTime));
    const lastPos = track.lastPosition || track.centroid || {x: 0, y: 0};
    
    const row = [
      track.id,
      track.class,
      formatTimestamp(new Date(track.startTime)),
      durationStr,
      lastPos.x.toFixed(2),
      lastPos.y.toFixed(2),
      (track.speed || 0).toFixed(2),
      status
    ];
    rows.push(row.join(','));
  }

  downloadFile(rows.join('\n'), `${filename}.csv`, 'text/csv');
}

export function exportDetectionSummary(stats) {
  const summary = {
    totalDetected: stats.totalDetected || 0,
    classCounts: stats.classCounts || {},
    trackingMetrics: stats.trackingMetrics || {},
    timestamp: new Date().toISOString()
  };
  
  const jsonStr = JSON.stringify(summary, null, 2);
  downloadFile(jsonStr, 'detection-summary.json', 'application/json');
}

export function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  document.body.appendChild(a);
  a.style = 'display: none';
  a.href = url;
  a.download = filename;
  
  a.click();
  
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function formatTimestamp(date) {
  return date.toISOString();
}
