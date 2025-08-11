import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import SummaryGrid from '../components/SummaryGrid';
import APICard from '../components/APICard';
import LoadingSpinner from '../components/LoadingSpinner';
import Footer from '../components/Footer';
import '../styles/APIMonitorDashboard.css';

const APIMonitorDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem('token');
      const projectKey = localStorage.getItem('projectKey');
      const role = localStorage.getItem('role');

      if (!token || !projectKey || !role || role !== 'admin') {
        navigate('/admin?msg=Please login first');
        return;
      }

      const response = await fetch(`http://127.0.0.1:5000/monitor`, {
        method: 'GET',
        headers: {
          token,
          key: projectKey,
          role,
        },
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching data from API:', error);
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  }, [navigate]);

  const handleTestNow = async (apiKey) => {
    try {
    const token = localStorage.getItem('token');
    const projectKey = localStorage.getItem('projectKey');
    const role = localStorage.getItem('role');

    // Load saved constants
    const apiConstants = JSON.parse(localStorage.getItem('apiConstants') || "{}");

    const response = await fetch(`http://127.0.0.1:5000/monitor/test/${apiKey}`, {
      method: 'GET',
      headers: {
        token,
        key: projectKey,
        role,
        country_code: apiConstants.COUNTRY_CODE,
        tournament_key: apiConstants.TOURNAMENT_KEY,
        match_key: apiConstants.MATCH_KEY,
        player_key: apiConstants.PLAYER_KEY,
        inning_key: apiConstants.INNING_KEY,
        over_key: apiConstants.OVER_KEY,
        page: apiConstants.PAGE,
        team_key: apiConstants.TEAM_KEY,
      },
    });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const updatedApi = await response.json();
      setData((prev) => ({
        ...prev,
        details: prev.details.map((api) => (api.key === apiKey ? updatedApi : api)),
      }));
    } catch (err) {
      console.error('Error testing API:', err);
    }
  };

  // Extract unique categories (including "All") - memoized for performance
  const categories = useMemo(() => {
    if (!data) return ['All'];
    const cats = new Set(data.details.map((api) => api.category || 'Uncategorized'));
    return ['All', ...cats];
  }, [data]);

  // Filter data.details according to filters
  const filteredApis = useMemo(() => {
    if (!data) return [];

    return data.details.filter((api) => {
      // Category filter
      if (categoryFilter !== 'All' && (api.category || 'Uncategorized') !== categoryFilter) {
        return false;
      }
      // Status filter: assuming api.status is a string like 'online'/'offline' or boolean or number code
      // Adjust condition based on your actual 'status' field format
      if (statusFilter === 'Online' && !(api.status === 'online' || api.status === 'healthy' || api.status_code === 200)) {
        return false;
      }
      if (statusFilter === 'Offline' && (api.status === 'online' || api.status === 'healthy' || api.status_code === 200)) {
        return false;
      }
      return true;
    });
  }, [data, categoryFilter, statusFilter]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading || !data) return <LoadingSpinner />;

  return (
    <div className="dashboard-container">
      <Header onRefresh={fetchData} />

      {/* Filters */}
      <div className="filters-container" style={{ marginBottom: '1rem' }}>
        <label>
          Category:{' '}
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </label>

        <label style={{ marginLeft: '2rem' }}>
          Status:{' '}
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All</option>
            <option value="Online">Online</option>
            <option value="Offline">Offline</option>
          </select>
        </label>
      </div>

      <SummaryGrid summary={data.summary} />

      <div className="api-grid">
        {filteredApis.length > 0 ? (
          filteredApis.map((api) => <APICard key={api.key} api={api} onTestNow={handleTestNow} />)
        ) : (
          <p>No APIs found for selected filters.</p>
        )}
      </div>

      <Footer lastUpdated={lastUpdated} />
    </div>
  );
};

export default APIMonitorDashboard;
