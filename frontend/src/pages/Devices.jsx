import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiEdit, FiTrash2, FiActivity, FiRefreshCw } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { deviceAPI } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import { getStatusBadge, formatLatency, formatUptime, getDeviceTypeIcon } from '../utils/helpers';
import DeviceModal from '../components/DeviceModal';

const Devices = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const { on, off } = useWebSocket();

  useEffect(() => {
    fetchDevices();

    on('device-update', handleDeviceUpdate);

    return () => {
      off('device-update');
    };
  }, []);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const response = await deviceAPI.getAll();
      setDevices(response.data);
    } catch (error) {
      toast.error(`Failed to load devices: ${error.message}`);
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

  const handleAdd = () => {
    setSelectedDevice(null);
    setModalOpen(true);
  };

  const handleEdit = (device) => {
    setSelectedDevice(device);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this device?')) return;

    try {
      await deviceAPI.delete(id);
      setDevices(prev => prev.filter(d => d._id !== id));
      toast.success('Device deleted successfully');
    } catch (error) {
      toast.error(`Failed to delete device: ${error.message}`);
    }
  };

  const handleModalClose = (shouldRefresh) => {
    setModalOpen(false);
    setSelectedDevice(null);
    if (shouldRefresh) {
      fetchDevices();
    }
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
        <h1 className="text-3xl font-bold text-gray-900">Devices</h1>
        <div className="flex space-x-3">
          <button
            onClick={fetchDevices}
            className="btn btn-secondary flex items-center"
          >
            <FiRefreshCw className="mr-2" />
            Refresh
          </button>
          <button
            onClick={handleAdd}
            className="btn btn-primary flex items-center"
          >
            <FiPlus className="mr-2" />
            Add Device
          </button>
        </div>
      </div>

      {/* Devices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices.map((device) => (
          <div key={device._id} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">{getDeviceTypeIcon(device.type)}</span>
                <div>
                  <h3 className="font-semibold text-gray-900">{device.name}</h3>
                  <p className="text-sm text-gray-500">{device.ipAddress}</p>
                </div>
              </div>
              <span className={`badge ${getStatusBadge(device.status)}`}>
                {device.status}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium text-gray-900">{device.type}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Latency:</span>
                <span className="font-medium text-gray-900">{formatLatency(device.currentLatency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Uptime:</span>
                <span className="font-medium text-gray-900">{formatUptime(device.uptimePercentage)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <Link
                to={`/devices/${device._id}`}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
              >
                <FiActivity className="mr-1" />
                View Details
              </Link>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(device)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                >
                  <FiEdit size={18} />
                </button>
                <button
                  onClick={() => handleDelete(device._id)}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md"
                >
                  <FiTrash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {devices.length === 0 && (
        <div className="text-center py-12">
          <FiActivity className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No devices</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding a new device.</p>
          <div className="mt-6">
            <button onClick={handleAdd} className="btn btn-primary">
              <FiPlus className="mr-2 inline" />
              Add Device
            </button>
          </div>
        </div>
      )}

      {/* Device Modal */}
      {modalOpen && (
        <DeviceModal
          device={selectedDevice}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};

export default Devices;
