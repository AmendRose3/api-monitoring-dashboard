import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import UserAuthentication from './pages/UserAuthentication';
import AdminAuthentication from './pages/AdminAuthentication';
import UserDashboard from './pages/UserDashboard';
import APIMonitorDashboard from './pages/APIMonitorDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<UserAuthentication />} />
        <Route path="/admin" element={<AdminAuthentication />} />
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/admin/dashboard" element={<APIMonitorDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
