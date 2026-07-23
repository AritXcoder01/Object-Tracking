import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { getClassColor } from '../utils/detector';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function ClassPieChart({ classCounts }) {
  const labels = Object.keys(classCounts);
  const dataValues = Object.values(classCounts);
  const backgroundColors = labels.map(cls => getClassColor(cls));

  const data = {
    labels,
    datasets: [{
      data: dataValues,
      backgroundColor: backgroundColors,
      borderWidth: 0
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: {
        labels: { color: 'white' }
      }
    }
  };

  return (
    <div style={{ height: '180px' }}>
      <Doughnut data={data} options={options} />
    </div>
  );
}
