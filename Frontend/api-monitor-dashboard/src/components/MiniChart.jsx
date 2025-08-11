import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
} from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip);

const MiniChart = ({ values }) => {
  const data = {
    labels: values.map((_, i) => i + 1),
    datasets: [
      {
        data: values.map(log => log.response_time_ms),
        backgroundColor: values.map(log => log.status_code === 200 ? '#10b981' : '#ef4444'),
        borderRadius: 2,
        categoryPercentage: 0.8,
        barPercentage: 0.8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip:{ 
        enabled: true,
        position: 'nearest',
        external: null,
        callbacks: {
          title: () => '',
          label: (context) => `${context.parsed.y}ms`,
        },
        backgroundColor: 'rgba(3, 3, 3, 0.8)',
      },
    },
    scales: {
      x: {
        display: false,
        grid: { display: false },
      },
      y: {
        display: false,
        grid: { display: false },
        beginAtZero: true,
      },
    },
    layout: {
      padding: 0,
    },
    elements: {
      bar: {
        borderSkipped: true,
      },
    },
  };

  return (
    <div className="mini-chart-wrapper">
      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', textAlign: 'center' }}>
        Last 5 Responses
      </div>
      <Bar data={data} options={options} />
    </div>
  );
};

export default MiniChart;
