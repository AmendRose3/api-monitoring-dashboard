import React, { useRef, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
} from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip);

const createExternalTooltip = (tooltipModel, chartRef, values) => {
  let tooltipEl = document.getElementById('chartjs-tooltip');

  const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const d = new Date(timeStr);
  if (isNaN(d)) return timeStr; // fallback if invalid date

  const pad = (n) => (n < 10 ? '0' + n : n);

  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const date = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());

  return `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`;
};


  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.id = 'chartjs-tooltip';
    tooltipEl.style.position = 'absolute';
    tooltipEl.style.background = 'rgba(3, 3, 3, 0.8)';
    tooltipEl.style.color = 'white';
    tooltipEl.style.padding = '6px 8px';
    tooltipEl.style.borderRadius = '4px';
    tooltipEl.style.pointerEvents = 'none';
    tooltipEl.style.whiteSpace = 'nowrap';
    tooltipEl.style.zIndex = '9999'; // <-- ensures it's above everything
    document.body.appendChild(tooltipEl);
  }

  // Hide tooltip if opacity is 0
  if (tooltipModel.opacity === 0) {
    tooltipEl.style.opacity = 0;
    return;
  }

  const idx = tooltipModel.dataPoints?.[0]?.dataIndex;
  const log = values[idx];
  tooltipEl.innerHTML = log
    ? `Time: ${formatTime(log.log_time)}<br>${log.response_time_ms} ms`
    : '';

  const position = chartRef.current.canvas.getBoundingClientRect();
  tooltipEl.style.opacity = 1;
  tooltipEl.style.left = position.left + window.scrollX + tooltipModel.caretX + 'px';
  tooltipEl.style.top = position.top + window.scrollY + tooltipModel.caretY - 30 + 'px';
};

const MiniChart = ({ values }) => {
  const chartRef = useRef();

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
      tooltip: {
        enabled: false, // disable built-in tooltip
        external: (context) => {
          createExternalTooltip(context.tooltip, chartRef, values);
        },
      },
    },
    scales: {
      x: { display: false, grid: { display: false } },
      y: { display: false, grid: { display: false }, beginAtZero: true },
    },
    layout: { padding: 0 },
    elements: { bar: { borderSkipped: true } },
  };

  return (
    <div className="mini-chart-wrapper">
      <Bar ref={chartRef} data={data} options={options} />
      <div className="mini-chart-label">Last Responses</div>
    </div>
  );
};

export default MiniChart;
