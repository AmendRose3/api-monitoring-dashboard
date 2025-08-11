import React from 'react';

const SummaryCard = ({ icon, title, value, colorClass }) => (
  <div className="summary-card">
    <div className="summary-card-content">
      <div className={`summary-icon ${colorClass}`}>
        {icon}
      </div>
      <div className="summary-text">
        <h3>{title}</h3>
        <p>{value}</p>
      </div>
    </div>
  </div>
);

export default SummaryCard;
