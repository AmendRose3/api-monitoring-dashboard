import React, { useState } from 'react';
import { RefreshCw, Plus, LogOut, KeySquareIcon, Settings2Icon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SetKeysModal from './SetKeysModal';

const Header = ({ onRefresh }) => {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
    const name = localStorage.getItem('name');

  const [showSetKeys, setShowSetKeys] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    if (role === 'admin') navigate('/admin');
    else navigate('/');
  };

  return (
    <div className="dashboard-header">
      <div className="header-left">
        <img src="/roanuz_logo.png" alt="Roanuz Logo" className="header-icon" />
        <h1 className="header-title">Roanuz Cricket API Monitor</h1>
      </div>

      <div className="header-right">
        <button className="refresh-button add-api-button" onClick={onRefresh}>
          <RefreshCw size={16} />
          <span>Refresh</span>
        </button>

        <button
          className="refresh-button add-api-button"
          onClick={() => setShowSetKeys(true)}
        >
          <KeySquareIcon size={16} />
          <span>Set Keys</span>
        </button>

        {role === 'admin' && (
        <button className="add-api-button" onClick={() => navigate("/admin/manage-apis")}>
            <Settings2Icon  size={16} />
            <span>Manage</span>
          </button>
        )}

        <button className="add-api-button" onClick={handleLogout}>
          <LogOut size={16} />
          <h3 style={{ color: 'white' }}>{name?.toUpperCase()}</h3>
          <span>LOGOUT</span>
        </button>
      </div>

      {showSetKeys && (
        <SetKeysModal
          isOpen={true}
          onClose={() => setShowSetKeys(false)}
          onSave={(data) => console.log("Updated constants:", data)}
        />
      )}
    </div>
  );
};

export default Header;
