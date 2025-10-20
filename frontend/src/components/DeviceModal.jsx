import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { deviceAPI } from '../services/api';
import { isValidIP } from '../utils/helpers';

const DeviceModal = ({ device, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    ipAddress: '',
    type: 'server',
    location: '',
    description: '',
    isActive: true,
    alertEnabled: true,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (device) {
      setFormData({
        name: device.name || '',
        ipAddress: device.ipAddress || '',
        type: device.type || 'server',
        location: device.location || '',
        description: device.description || '',
        isActive: device.isActive !== undefined ? device.isActive : true,
        alertEnabled: device.alertEnabled !== undefined ? device.alertEnabled : true,
      });
    }
  }, [device]);

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Device name is required';
    }

    if (!formData.ipAddress.trim()) {
      newErrors.ipAddress = 'IP address is required';
    } else if (!isValidIP(formData.ipAddress)) {
      newErrors.ipAddress = 'Invalid IP address or domain';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setLoading(true);

      if (device) {
        await deviceAPI.update(device._id, formData);
        toast.success('Device updated successfully');
      } else {
        await deviceAPI.create(formData);
        toast.success('Device created successfully');
      }

      onClose(true);
    } catch (error) {
      toast.error(`Failed to save device: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {device ? 'Edit Device' : 'Add New Device'}
          </h2>
          <button
            onClick={() => onClose(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="label">Device Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`input ${errors.name ? 'border-red-500' : ''}`}
              placeholder="e.g., Main Server"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* IP Address */}
          <div>
            <label className="label">IP Address / Domain *</label>
            <input
              type="text"
              name="ipAddress"
              value={formData.ipAddress}
              onChange={handleChange}
              className={`input ${errors.ipAddress ? 'border-red-500' : ''}`}
              placeholder="e.g., 192.168.1.1 or google.com"
            />
            {errors.ipAddress && <p className="mt-1 text-sm text-red-600">{errors.ipAddress}</p>}
          </div>

          {/* Type */}
          <div>
            <label className="label">Device Type</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="input"
            >
              <option value="server">Server</option>
              <option value="router">Router</option>
              <option value="switch">Switch</option>
              <option value="firewall">Firewall</option>
              <option value="workstation">Workstation</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="label">Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="input"
              placeholder="e.g., Data Center 1, Floor 2"
            />
          </div>

          {/* Description */}
          <div>
            <label className="label">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="input"
              rows="3"
              placeholder="Additional information about this device..."
            />
          </div>

          {/* Checkboxes */}
          <div className="space-y-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">
                Enable monitoring for this device
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="alertEnabled"
                checked={formData.alertEnabled}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">
                Enable alerts for this device
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => onClose(false)}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : (device ? 'Update Device' : 'Add Device')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeviceModal;
