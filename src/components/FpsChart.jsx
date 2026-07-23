import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

export default function FpsChart({ fpsHistory = [] }) {
  const dataSliced = fpsHistory.slice(-30);
  const data = {
    labels: dataSliced.map((_, i) => i),
    datasets: [
      {
        data: dataSliced,
        borderColor: '#00ff88',
        backgroundColor: 'rgba(0,255,136,0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 0 },
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: 'rgba(255,255,255,0.5)' } },
      y: { min: 0, max: 60, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: 'rgba(255,255,255,0.5)' } }
    }
  };

  return (
    <div style={{ height: '150px' }}>
      <Line data={data} options={options} />
    </div>
  );
}
