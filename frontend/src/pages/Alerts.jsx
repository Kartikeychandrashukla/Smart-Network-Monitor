import React, { useState, useEffect } from 'react';
import { FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { alertAPI } from '../services/api';
import { formatDate, getAlertSeverityColor } from '../utils/helpers';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchAlerts();
  }, [filter]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { isResolved: filter === 'resolved' } : {};
      const response = await alertAPI.getAll(params);
      setAlerts(response.data);
    } catch (error) {
      toast.error(`Failed to load alerts: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id) => {
    try {
      await alertAPI.resolve(id);
      setAlerts(prev => prev.map(alert =>
        alert._id === id ? { ...alert, isResolved: true } : alert
      ));
      toast.success('Alert resolved');
    } catch (error) {
      toast.error(`Failed to resolve alert: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Alerts</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="input w-auto"
        >
          <option value="all">All Alerts</option>
          <option value="unresolved">Unresolved</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      <div className="space-y-4">
        {alerts.map((alert) => (
          <div key={alert._id} className="card">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <FiAlertCircle
                  className={`h-6 w-6 mt-1 text-${getAlertSeverityColor(alert.severity)}-600`}
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-gray-900">{alert.message}</h3>
                    <span className={`badge badge-${alert.severity}`}>
                      {alert.severity}
                    </span>
                    {alert.isResolved && (
                      <span className="badge badge-online">Resolved</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {alert.device?.name} ({alert.device?.ipAddress})
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(alert.createdAt)}
                  </p>
                </div>
              </div>
              {!alert.isResolved && (
                <button
                  onClick={() => handleResolve(alert._id)}
                  className="btn btn-success btn-sm flex items-center"
                >
                  <FiCheckCircle className="mr-1" />
                  Resolve
                </button>
              )}
            </div>
          </div>
        ))}

        {alerts.length === 0 && !loading && (
          <div className="text-center py-12">
            <FiAlertCircle className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-gray-500">No alerts found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alerts;
