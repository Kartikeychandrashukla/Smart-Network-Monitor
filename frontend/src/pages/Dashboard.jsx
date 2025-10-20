import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiServer, FiCheckCircle, FiXCircle, FiAlertTriangle, FiActivity } from 'react-icons/fi';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'react-toastify';
import { dashboardAPI, deviceAPI, alertAPI } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import { formatDate, formatLatency, formatUptime, getStatusBadge } from '../utils/helpers';

const Dashboard = () => {
  const [overview, setOverview] = useState(null);
  const [devices, setDevices] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [metricsData, setMetricsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isConnected, on, off } = useWebSocket();

  useEffect(() => {
    fetchDashboardData();

    // Set up real-time updates
    on('device-update', handleDeviceUpdate);
    on('new-alert', handleNewAlert);

    return () => {
      off('device-update');
      off('new-alert');
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [overviewData, devicesData, alertsData, metricsData] = await Promise.all([
        dashboardAPI.getOverview(),
        deviceAPI.getAll(),
        alertAPI.getAll({ limit: 10, isResolved: false }),
        dashboardAPI.getMetrics({ hours: 6, interval: 30 })
      ]);

      setOverview(overviewData.data);
      setDevices(devicesData.data);
      setRecentAlerts(alertsData.data);
      setMetricsData(metricsData.data);
    } catch (error) {
      toast.error(`Failed to load dashboard: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeviceUpdate = (data) => {
    setDevices(prev =>
      prev.map(device =>
        device._id === data.deviceId
          ? { ...device, ...data }
          : device
      )
    );
  };

  const handleNewAlert = (alert) => {
    setRecentAlerts(prev => [alert, ...prev].slice(0, 10));
    toast.warning(`New Alert: ${alert.message}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Network Dashboard</h1>
        <div className="flex items-center space-x-2">
          <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-600">
            {isConnected ? 'Live Updates' : 'Reconnecting...'}
          </span>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
              <FiServer className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600">Total Devices</p>
              <p className="text-2xl font-semibold text-gray-900">{overview?.devices?.total || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
              <FiCheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600">Online</p>
              <p className="text-2xl font-semibold text-green-600">{overview?.devices?.online || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
              <FiXCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600">Offline</p>
              <p className="text-2xl font-semibold text-red-600">{overview?.devices?.offline || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
              <FiAlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600">Active Alerts</p>
              <p className="text-2xl font-semibold text-yellow-600">{overview?.alerts?.unresolved || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Network Health Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Average Latency (Last 6 Hours)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={metricsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(value) => formatDate(value, 'HH:mm')}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(value) => formatDate(value)}
                formatter={(value) => [`${value.toFixed(2)} ms`, 'Latency']}
              />
              <Area
                type="monotone"
                dataKey="avgLatency"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Network Uptime (Last 6 Hours)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={metricsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(value) => formatDate(value, 'HH:mm')}
              />
              <YAxis domain={[0, 100]} />
              <Tooltip
                labelFormatter={(value) => formatDate(value)}
                formatter={(value) => [`${value.toFixed(2)}%`, 'Uptime']}
              />
              <Line
                type="monotone"
                dataKey="uptime"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Devices and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Devices */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Devices Overview</h3>
            <Link to="/devices" className="text-sm text-blue-600 hover:text-blue-700">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {devices.slice(0, 5).map((device) => (
              <div
                key={device._id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className={`h-3 w-3 rounded-full bg-${device.status === 'online' ? 'green' : device.status === 'offline' ? 'red' : 'yellow'}-500`} />
                  <div>
                    <p className="font-medium text-gray-900">{device.name}</p>
                    <p className="text-sm text-gray-500">{device.ipAddress}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`badge ${getStatusBadge(device.status)}`}>
                    {device.status}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatLatency(device.currentLatency)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Alerts</h3>
            <Link to="/alerts" className="text-sm text-blue-600 hover:text-blue-700">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {recentAlerts.length > 0 ? (
              recentAlerts.map((alert) => (
                <div
                  key={alert._id}
                  className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                >
                  <FiAlertTriangle
                    className={`h-5 w-5 mt-0.5 ${
                      alert.severity === 'critical'
                        ? 'text-red-600'
                        : alert.severity === 'warning'
                        ? 'text-yellow-600'
                        : 'text-blue-600'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {alert.device?.name} • {formatDate(alert.createdAt, 'MMM dd, HH:mm')}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">No active alerts</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
