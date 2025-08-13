import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import SetKeysModal from '../components/SetKeysModal.js';
import '../styles/Authentication.css';

const AdminAuthentication = () => {
  const [projectKey, setProjectKey] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const [showSetKeys, setShowSetKeys] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const msg = params.get('msg');
    if (msg) {
      setMessage(msg);
    }
  }, [location]);

  const handleLogin = async () => {
    try {
      const response = await axios.post('http://127.0.0.1:5000/api/login', {
        project_key: projectKey,
        api_key: apiKey,
        role: 'admin',
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('projectKey', projectKey);
      localStorage.setItem('role', 'admin');
      localStorage.setItem('name', response.data.name); 

      // navigate('/admin/dashboard');
      setShowSetKeys(true);

    } catch (error) {
      setMessage('Invalid credentials');
    }
  };

  return (
  <div className="auth-container">
    <div className="dashboard-header">
      <div className="header-left">
        <div className="header-icon">
          <img src="/roanuz_logo.png" alt="Roanuz Logo" className="header-icon" />
        </div>
        <h1 className="header-title">Roanuz Cricket API Monitor</h1>
      </div>
    </div>
    
    <div className="auth-form-wrapper">
      <div className="auth-form-container">
        {message && <div className="auth-message">{message}</div>} 

        <h2 className="auth-title">Admin Login</h2>
        
        <div className="form-group">
          <input 
            className="auth-input"
            placeholder="Project Key" 
            value={projectKey}
            onChange={(e) => setProjectKey(e.target.value)} 
          />
        </div>
        
        <div className="form-group">
          <input 
            className="auth-input"
            placeholder="API Key" 
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)} 
          />
        </div>
        
        <button className="auth-button" onClick={handleLogin}>
          Login
        </button>
      </div>
    </div>

    {/* Show modal when needed */}
    {showSetKeys && (
      <SetKeysModal
        isOpen={true}
        onClose={() => {
          setShowSetKeys(false);
          navigate('/admin/dashboard');
        }}
        onSave={(data) => {
          console.log("Constants saved:", data);
        }}
      />
    )}
  </div>
);

};

export default AdminAuthentication;