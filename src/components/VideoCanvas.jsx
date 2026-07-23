import React, { useEffect, useRef, useCallback } from 'react';
import { getClassColor } from '../utils/detector';
import { drawHeatmap, createHeatmapGrid, updateHeatmapData } from './HeatmapOverlay';

export default function VideoCanvas({
  videoRef,
  canvasRef,
  videoSource,
  fileVideoUrl,
  detections,
  tracks,
  showBoxes,
  showLabels,
  showTrails,
  showZones,
  zones,
  fps,
  isProcessing,
  onCanvasClick,
  boxThickness,
  showHeatmap,
  onLoadedMetadata,
  onTimeUpdate
}) {
  const heatmapRef = useRef(null);
  const containerRef = useRef(null);
  const animFrameRef = useRef(null);

  // Sync canvas dimensions to video aspect ratio & resolution
  const syncCanvasSize = useCallback(() => {
    const video = videoRef?.current;
    const canvas = canvasRef?.current;
    if (!video || !canvas) return;

    const vw = video.videoWidth || video.clientWidth;
    const vh = video.videoHeight || video.clientHeight;
    if (vw && vh && (canvas.width !== vw || canvas.height !== vh)) {
      canvas.width = vw;
      canvas.height = vh;
    }
  }, [videoRef, canvasRef]);

  useEffect(() => {
    const video = videoRef?.current;
    if (!video) return;

    const handleMeta = () => syncCanvasSize();
    const handlePlay = () => syncCanvasSize();

    video.addEventListener('loadedmetadata', handleMeta);
    video.addEventListener('play', handlePlay);

    if (video.videoWidth > 0) syncCanvasSize();

    return () => {
      video.removeEventListener('loadedmetadata', handleMeta);
      video.removeEventListener('play', handlePlay);
    };
  }, [videoRef, syncCanvasSize]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => syncCanvasSize());
    observer.observe(container);
    return () => observer.disconnect();
  }, [syncCanvasSize]);

  // Main render loop: draws video frame FIRST onto canvas, then all overlays on top
  const renderFrame = useCallback(() => {
    const video = videoRef?.current;
    const canvas = canvasRef?.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (canvas.width === 0 || canvas.height === 0) {
      syncCanvasSize();
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw video frame onto canvas so canvas recording & snapshots contain video + bounding boxes
    if (video && video.readyState >= 2 && canvas.width > 0 && canvas.height > 0) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    // 2. Heatmap
    if (showHeatmap && detections && detections.length > 0 && canvas.width > 0) {
      if (!heatmapRef.current || heatmapRef.current._w !== canvas.width) {
        heatmapRef.current = createHeatmapGrid(canvas.width, canvas.height, 20);
        heatmapRef.current._w = canvas.width;
      }
      heatmapRef.current = updateHeatmapData(heatmapRef.current, detections, 0.98, canvas.width, canvas.height, 20);
      drawHeatmap(ctx, heatmapRef.current, 20);
    }

    // 3. Zones
    if (showZones && zones && zones.length > 0) {
      zones.forEach(zone => {
        ctx.fillStyle = 'rgba(0, 212, 255, 0.15)';
        ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);
        ctx.fillStyle = '#00d4ff';
        ctx.font = 'bold 14px Segoe UI, sans-serif';
        ctx.fillText(zone.name || 'Zone', zone.x + 8, zone.y + 20);
      });
    }

    // 4. Tracked objects (bounding boxes, labels, trails)
    if (tracks && tracks.length > 0) {
      tracks.forEach(track => {
        if (!track.bbox || !track.centroid) return;

        const color = getClassColor(track.class);
        const [bx, by, bw, bh] = track.bbox;

        // Ignore out-of-bounds kalman drift
        if (bx < -100 || by < -100 || bx > canvas.width + 100 || by > canvas.height + 100) return;
        if (bw <= 0 || bh <= 0 || bw > canvas.width * 2 || bh > canvas.height * 2) return;

        // Trails
        if (showTrails && track.trail && track.trail.length > 1) {
          ctx.beginPath();
          const trail = track.trail;
          for (let i = 0; i < trail.length; i++) {
            const alpha = (i / trail.length) * 0.75 + 0.15;
            ctx.strokeStyle = color;
            ctx.globalAlpha = alpha;
            ctx.lineWidth = Math.max(1.5, boxThickness);
            if (i === 0) {
              ctx.moveTo(trail[i].x, trail[i].y);
            } else {
              ctx.lineTo(trail[i].x, trail[i].y);
            }
          }
          ctx.stroke();
          ctx.globalAlpha = 1.0;
        }

        // Bounding boxes
        if (showBoxes) {
          ctx.save();
          ctx.strokeStyle = color;
          ctx.lineWidth = boxThickness || 2;
          ctx.shadowColor = color;
          ctx.shadowBlur = 10;
          ctx.strokeRect(bx, by, bw, bh);
          ctx.restore();
        }

        // Labels
        if (showLabels) {
          const confidence = track.score != null ? (track.score * 100).toFixed(0) : '?';
          const text = `${track.class} ${confidence}% #${track.id}`;
          ctx.font = 'bold 13px Segoe UI, sans-serif';
          const textWidth = ctx.measureText(text).width;
          const labelX = bx;
          const labelY = Math.max(16, by - 6);

          ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
          const pad = 6;
          const rx = labelX;
          const ry = labelY - 14;
          const rw = textWidth + pad * 2;
          const rh = 20;
          const r = 4;
          ctx.beginPath();
          ctx.moveTo(rx + r, ry);
          ctx.lineTo(rx + rw - r, ry);
          ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + r);
          ctx.lineTo(rx + rw, ry + rh - r);
          ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - r, ry + rh);
          ctx.lineTo(rx + r, ry + rh);
          ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - r);
          ctx.lineTo(rx, ry + r);
          ctx.quadraticCurveTo(rx, ry, rx + r, ry);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.fillText(text, labelX + pad, labelY);
        }
      });
    }
  }, [videoRef, canvasRef, showHeatmap, detections, showZones, zones, tracks, showTrails, showBoxes, showLabels, boxThickness, syncCanvasSize]);

  // Animation loop to keep video + overlays rendering smoothly at screen FPS
  useEffect(() => {
    let active = true;

    const loop = () => {
      if (!active) return;
      renderFrame();
      animFrameRef.current = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      active = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [renderFrame]);

  return (
    <div className="video-canvas-container" ref={containerRef} onClick={onCanvasClick}>
      <video
        ref={videoRef}
        src={videoSource === 'file' ? fileVideoUrl || undefined : undefined}
        autoPlay
        playsInline
        muted
        loop={videoSource === 'file'}
        onLoadedMetadata={onLoadedMetadata}
        onTimeUpdate={onTimeUpdate}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block'
        }}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none'
        }}
      />
      <div className="fps-overlay">{fps} FPS</div>
      {isProcessing && (!detections || detections.length === 0) && (
        <div className="loading-overlay">
          <div className="spinner" />
          <span className="loading-text">Loading detection model...</span>
        </div>
      )}
    </div>
  );
}
