import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiActivity, FiClock } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'react-toastify';
import { deviceAPI } from '../services/api';
import { formatDate, formatLatency, getStatusBadge } from '../utils/helpers';

const DeviceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [device, setDevice] = useState(null);
  const [metrics, setMetrics] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeviceData();
  }, [id]);

  const fetchDeviceData = async () => {
    try {
      setLoading(true);
      const [deviceData, metricsData, statsData] = await Promise.all([
        deviceAPI.getOne(id),
        deviceAPI.getMetrics(id, { hours: 24 }),
        deviceAPI.getStats(id, { hours: 24 })
      ]);

      setDevice(deviceData.data);
      setMetrics(metricsData.data);
      setStats(statsData.data);
    } catch (error) {
      toast.error(`Failed to load device: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!device) {
    return <div>Device not found</div>;
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/devices')}
        className="flex items-center text-gray-600 hover:text-gray-900"
      >
        <FiArrowLeft className="mr-2" />
        Back to Devices
      </button>

      <div className="card">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{device.name}</h1>
            <p className="text-gray-600 mt-1">{device.ipAddress}</p>
          </div>
          <span className={`badge ${getStatusBadge(device.status)}`}>
            {device.status}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div>
            <p className="text-sm text-gray-600">Type</p>
            <p className="text-lg font-semibold">{device.type}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Current Latency</p>
            <p className="text-lg font-semibold">{formatLatency(device.currentLatency)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Uptime</p>
            <p className="text-lg font-semibold">{device.uptimePercentage?.toFixed(2)}%</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Last Seen</p>
            <p className="text-lg font-semibold">
              {device.lastSeen ? formatDate(device.lastSeen, 'HH:mm:ss') : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-bold mb-4">Latency Over Time (24 Hours)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={metrics}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(value) => formatDate(value, 'HH:mm')}
            />
            <YAxis />
            <Tooltip
              labelFormatter={(value) => formatDate(value)}
              formatter={(value) => [`${value} ms`, 'Latency']}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="latency"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <FiActivity className="h-8 w-8 text-blue-600 mb-2" />
            <p className="text-sm text-gray-600">Average Latency</p>
            <p className="text-2xl font-bold">{stats.avgLatency.toFixed(2)} ms</p>
          </div>
          <div className="card">
            <FiClock className="h-8 w-8 text-green-600 mb-2" />
            <p className="text-sm text-gray-600">Uptime</p>
            <p className="text-2xl font-bold">{stats.uptime.toFixed(2)}%</p>
          </div>
          <div className="card">
            <FiActivity className="h-8 w-8 text-purple-600 mb-2" />
            <p className="text-sm text-gray-600">Total Checks</p>
            <p className="text-2xl font-bold">{stats.totalChecks}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceDetails;
