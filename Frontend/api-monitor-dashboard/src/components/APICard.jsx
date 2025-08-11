import React, { useState } from 'react';
import { Activity, BarChart3, List, X } from 'lucide-react';
import MiniChart from './MiniChart';
import ReactJson from 'react-json-view';

const APICard = ({ api, onTestNow}) => {
  const [showJson, setShowJson] = useState(false);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online': return '✓';
      case 'offline': return '✗';
      case 'slow': return '⚠';
      default: return '?';
    }
  };

  const formatLastCheck = (timestamp) => {
    const now = new Date();
    const checkTime = new Date(timestamp);
    const diffMs = now - checkTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);
    return diffMins > 0 ? `${diffMins} min ago` : `${diffSecs} sec ago`;
  };

  return (
    <div className="api-card">
      <div className="api-card-header">
        <div className="api-card-info">
          <div className={`status-badge ${api.status}`}>
            {getStatusIcon(api.status)} {api.status.charAt(0).toUpperCase() + api.status.slice(1)}
          </div>
          <h3 className="api-name">{api.name}</h3>
          <p className="api-url">{api.url}</p>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-item">
          <h4>Response Time</h4>
          <p className={
            api.status === 'offline' ? 'error' :
              api.response_time_ms > 800 ? 'warning' : 'success'
          }>
            {api.status === 'offline' ? 'Timeout' : `${api.response_time_ms}ms`}
          </p>
        </div>
        <div className="metric-item">
          <h4>Uptime</h4>
          <p className="success">{api.uptime}</p>
        </div>
        <div className="metric-item">
          <h4>Last Check</h4>
          <p className="success">{formatLastCheck(api.last_check)}</p>
        </div>
        <div className="metric-item">
          <h4>Status Code</h4>
          <p className={
            api.status_code >= 200 && api.status_code < 300 ? 'success' : 'error'
          }>
            {api.status_code}
          </p>
        </div>
      </div>

      <div className="api-card-footer">
        <div className="action-buttons">
          <button className="action-button" onClick={() => onTestNow(api.key)} >
            <span>▶</span>
            <span>Test Now</span>
          </button>
          <button className="action-button" onClick={() => setShowJson(true)}>
            <List size={12} />
            <span>View recent Response</span>
          </button>
        </div>
        <div className="charts-container">
          <MiniChart values={api.last_5_logs} />
        </div>
      </div>

        {showJson && (
        <div className="json-popup">
          <div className="json-popup-content">
            <div className="popup-header">
              <strong>Recent Response</strong>
              <button className="close-button" onClick={() => setShowJson(false)}>
                <X size={16} />
              </button>
            </div>
            <ReactJson
              src={typeof api.json_response === 'string' ? JSON.parse(api.json_response) : api.json_response}
              name={false}
              collapsed={1}
              enableClipboard={true}
              displayDataTypes={false}
              style={{ fontSize: '14px' }}
            />
          </div>
        </div>
      )}

    </div>
  );
};

export default APICard;
