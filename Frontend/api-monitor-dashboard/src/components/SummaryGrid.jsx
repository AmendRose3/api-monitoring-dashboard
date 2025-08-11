import React from 'react';
import { Database, AlertTriangle, Clock } from 'lucide-react';
import SummaryCard from './SummaryCard';

const SummaryGrid = ({ summary }) => (
  <div className="summary-grid">
    <SummaryCard icon={<Database size={24} />} title="Total APIs" value={summary.total_apis} colorClass="blue" />
    <SummaryCard icon={<span style={{ fontSize: '20px' }}>✓</span>} title="Healthy" value={summary.healthy_apis} colorClass="green" />
    <SummaryCard icon={<AlertTriangle size={24} />} title="Failed" value={summary.failed_apis} colorClass="red" />
    <SummaryCard icon={<Clock size={24} />} title="Avg Response" value={`${summary.avg_response_time_ms}ms`} colorClass="orange" />
  </div>
);

export default SummaryGrid;
