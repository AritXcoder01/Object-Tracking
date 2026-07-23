export function createHeatmapGrid(width, height, cellSize = 20) {
  const cols = Math.ceil(width / cellSize);
  const rows = Math.ceil(height / cellSize);
  const grid = new Array(cols).fill(0).map(() => new Array(rows).fill(0));
  return grid;
}

export function updateHeatmapData(grid, detections, decayRate = 0.98, width, height, cellSize = 20) {
  const newGrid = grid.map(col => col.map(val => val * decayRate));
  
  detections.forEach(det => {
    const [x, y, w, h] = det.bbox;
    const cx = x + w / 2;
    const cy = y + h / 2;
    const col = Math.floor(cx / cellSize);
    const row = Math.floor(cy / cellSize);
    
    if (newGrid[col] && newGrid[col][row] !== undefined) {
      newGrid[col][row] = Math.min(1.0, newGrid[col][row] + 0.2);
    }
  });
  
  return newGrid;
}

export function drawHeatmap(ctx, grid, cellSize = 20) {
  for (let col = 0; col < grid.length; col++) {
    for (let row = 0; row < grid[col].length; row++) {
      const val = grid[col][row];
      if (val > 0.05) {
        ctx.fillStyle = `rgba(255, 0, 0, ${val * 0.5})`;
        ctx.beginPath();
        ctx.arc(col * cellSize + cellSize/2, row * cellSize + cellSize/2, cellSize * 1.5, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  }
}
