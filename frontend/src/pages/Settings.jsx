import React from 'react';
import { FiBell, FiMail, FiMessageSquare } from 'react-icons/fi';

const Settings = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Settings</h1>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Notification Settings</h2>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <FiBell className="h-6 w-6 text-blue-600 mt-1" />
            <div className="flex-1">
              <h3 className="font-medium">Alert Thresholds</h3>
              <p className="text-sm text-gray-600 mt-1">
                Configure when alerts are triggered based on latency and packet loss.
              </p>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="label">Latency Threshold (ms)</label>
                  <input type="number" className="input" defaultValue="200" />
                </div>
                <div>
                  <label className="label">Packet Loss Threshold (%)</label>
                  <input type="number" className="input" defaultValue="10" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-start space-x-3 pt-4 border-t">
            <FiMail className="h-6 w-6 text-blue-600 mt-1" />
            <div className="flex-1">
              <h3 className="font-medium">Email Notifications</h3>
              <p className="text-sm text-gray-600 mt-1">
                Configure email settings in backend/.env file
              </p>
              <div className="mt-3">
                <label className="label">Email Address</label>
                <input
                  type="email"
                  className="input"
                  placeholder="your-email@example.com"
                />
              </div>
            </div>
          </div>

          <div className="flex items-start space-x-3 pt-4 border-t">
            <FiMessageSquare className="h-6 w-6 text-blue-600 mt-1" />
            <div className="flex-1">
              <h3 className="font-medium">Telegram Notifications</h3>
              <p className="text-sm text-gray-600 mt-1">
                Configure Telegram Bot Token and Chat ID in backend/.env file
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Monitoring Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="label">Ping Interval (seconds)</label>
            <input type="number" className="input" defaultValue="5" />
            <p className="text-sm text-gray-500 mt-1">
              How often to ping each device
            </p>
          </div>
          <div>
            <label className="label">Data Retention (days)</label>
            <input type="number" className="input" defaultValue="30" />
            <p className="text-sm text-gray-500 mt-1">
              How long to keep historical metrics data
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="btn btn-primary">Save Settings</button>
      </div>
    </div>
  );
};

export default Settings;
