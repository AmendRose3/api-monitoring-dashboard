import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Lock, HelpCircle, PauseCircle,  List, X } from 'lucide-react';
import MiniChart from './MiniChart';
import ReactJson from 'react-json-view';

const APICard = ({ api, onTestNow}) => {
  const [showJson, setShowJson] = useState(false);

  const getStatusIcon = (statusCode) => {
    if (statusCode === 200) return <CheckCircle2 color="#22c55e" size={18} />;
    if (statusCode === 400) return <AlertTriangle color="#eab308" size={18} />;
    if (statusCode === 402) return <PauseCircle color="#eab308" size={18} />;
    if (statusCode === 403) return <Lock color="#eab308" size={18} />;
    if (statusCode === 404) return <HelpCircle color="#eab308" size={18} />;
    if (statusCode === 500) return <XCircle color="#dc2626" size={18} />;
    if (statusCode >= 400 && statusCode < 500) return <AlertTriangle color="#eab308" size={18} />;
    if (statusCode >= 500) return <XCircle color="#dc2626" size={18} />;
    return <HelpCircle color="#b0b3c0" size={18} />;
  };

  const getStatusColor = (statusCode) => {
  if (statusCode === 200) return 'success';      // green
  if (statusCode >= 400 && statusCode < 500) return 'warning'; // yellow
  if (statusCode >= 500) return 'error';         // red
  return '';
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
          <div className={`status-badge ${getStatusColor(api.status_code)}`}>
            {getStatusIcon(api.status_code)} {api.status_code} {api.status}          
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
          <div className="charts-container">
          <MiniChart values={api.last_5_logs} />
        </div>
        </div>
        
      </div>

  {showJson && (
    <div className="json-popup">
      <div className="json-popup-content">
        <div className="popup-header">
        <h2><strong>{api.description || "Recent Response"}</strong></h2>
          <button className="close-button" onClick={() => setShowJson(false)}>
            <X size={16} />
          </button>
        </div>
        {api.json_response && api.json_response !== "" ? (
          <ReactJson
            src={
              typeof api.json_response === 'string'
                ? JSON.parse(api.json_response)
                : api.json_response
            }
            name={false}
            collapsed={1}
            enableClipboard={true}
            displayDataTypes={false}
            style={{ fontSize: '14px' }}
          />
        ) : (
          <div style={{ color: '#b0b3c0', padding: '1rem' }}>
            No response available.
          </div>
        )}
      </div>
    </div>
  )}

    </div>
  );
};

export default APICard;
