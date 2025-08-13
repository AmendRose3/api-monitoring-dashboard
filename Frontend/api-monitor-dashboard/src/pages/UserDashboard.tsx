import React, { useState, useEffect, useCallback,useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header.js';
import SummaryGrid from '../components/SummaryGrid.js';
import APICard from '../components/APICard.js';
import LoadingSpinner from '../components/LoadingSpinner.js';
import Footer from '../components/Footer.js';
import '../styles/APIMonitorDashboard.css';

interface APILog {
  log_time: string;
  response_time_ms: number;
  status_code: number;
}
interface APIDetail {
  key: string;
  name: string;
  url: string;
  status: string;
  status_code: number;
  response_time_ms: number;
  uptime: string;
  last_check: string | Date;
  description?: string;
  last_5_logs: APILog[];
  category?: string;
  json_response?: Record<string, unknown> | string;
}


interface APIMonitorData {
  summary: {
    total_apis: number;
    healthy_apis: number;
    failed_apis: number;
    avg_response_time_ms: number;
    [key: string]: any;
  };
  details: APIDetail[];
}


const UserDashboard = () => {
  const [data, setData] = useState<APIMonitorData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // Filters state
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem('token') || '';
      const projectKey = localStorage.getItem('projectKey') || '';
      const role = localStorage.getItem('role') || '';

        if (!token || !projectKey || !role || role !== 'user') {
          navigate('/?msg=Please login first');
          return;
        }

      const response = await fetch(`http://127.0.0.1:5000/monitor`, {
        method: 'GET',
        headers: {
          'token': token,
          'key': projectKey,
          'role': role,
        }
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

    const handleTestNow = async (apiKey: string) => {
  try {
    const token = localStorage.getItem('token') || '';
    const projectKey = localStorage.getItem('projectKey') || '';
    const role = localStorage.getItem('role') || '';

    const response = await fetch(`http://127.0.0.1:5000/monitor/test/${apiKey}`, {
      method: 'GET',
      headers: {
        'token': token,
        'key': projectKey,
        'role': role,
      }
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const updatedApi = await response.json();
    setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
                      details: prev.details.map((api) =>
                api.key === apiKey ? { ...api, ...updatedApi } : api
              ),
            };
          });
  } catch (err) {
    console.error('Error testing API:', err);
  }
};

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
        {data.details.map(api => <APICard key={api.key} api={api} onTestNow={handleTestNow} />)}
      </div>
      <Footer lastUpdated={lastUpdated} />
    </div>
  );
};

export default UserDashboard;
