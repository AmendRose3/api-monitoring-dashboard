import React, { useState } from 'react';
import { RefreshCw, Plus, LogOut, KeySquareIcon, LayoutDashboard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Header = ({ onRefresh }) => {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const name = localStorage.getItem('name');


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
        <button className="refresh-button add-api-button" onClick={() => navigate("/admin/dashboard")}>
          <LayoutDashboard size={16} />
          <span>Dashboard</span>
        </button>


        <button className="add-api-button" onClick={handleLogout}>
          <LogOut size={16} />
          <h3 style={{ color: 'white' }}>{name?.toUpperCase()}</h3>
          <span>LOGOUT</span>
        </button>
      </div>

    </div>
  );
};

export default Header;
