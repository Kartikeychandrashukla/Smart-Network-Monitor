import { format, formatDistance } from 'date-fns';

// Format date/time
export const formatDate = (date, formatStr = 'MMM dd, yyyy HH:mm:ss') => {
  if (!date) return 'N/A';
  return format(new Date(date), formatStr);
};

// Format relative time
export const formatRelativeTime = (date) => {
  if (!date) return 'N/A';
  return formatDistance(new Date(date), new Date(), { addSuffix: true });
};

// Get status color
export const getStatusColor = (status) => {
  const colors = {
    online: 'green',
    offline: 'red',
    warning: 'yellow',
    unknown: 'gray',
  };
  return colors[status] || 'gray';
};

// Get status badge class
export const getStatusBadge = (status) => {
  const badges = {
    online: 'badge-online',
    offline: 'badge-offline',
    warning: 'badge-warning',
    unknown: 'badge-unknown',
  };
  return badges[status] || 'badge-unknown';
};

// Get alert severity color
export const getAlertSeverityColor = (severity) => {
  const colors = {
    info: 'blue',
    warning: 'yellow',
    critical: 'red',
  };
  return colors[severity] || 'gray';
};

// Format latency with unit
export const formatLatency = (latency) => {
  if (latency === null || latency === undefined) return 'N/A';
  return `${Math.round(latency)}ms`;
};

// Format uptime percentage
export const formatUptime = (uptime) => {
  if (uptime === null || uptime === undefined) return 'N/A';
  return `${uptime.toFixed(2)}%`;
};

// Get device type icon
export const getDeviceTypeIcon = (type) => {
  const icons = {
    server: '🖥️',
    router: '🔀',
    switch: '🔌',
    firewall: '🛡️',
    workstation: '💻',
    other: '📱',
  };
  return icons[type] || '📱';
};

// Validate IP address
export const isValidIP = (ip) => {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const domainRegex = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return ipv4Regex.test(ip) || domainRegex.test(ip);
};

// Get health status based on uptime
export const getHealthStatus = (uptime) => {
  if (uptime >= 99) return 'Excellent';
  if (uptime >= 95) return 'Good';
  if (uptime >= 90) return 'Fair';
  return 'Poor';
};

// Calculate average from array of numbers
export const calculateAverage = (numbers) => {
  if (!numbers || numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, val) => acc + val, 0);
  return sum / numbers.length;
};

// Group data by time interval
export const groupByTimeInterval = (data, intervalMinutes = 60) => {
  const grouped = {};

  data.forEach(item => {
    const date = new Date(item.timestamp);
    const intervalKey = new Date(
      Math.floor(date.getTime() / (intervalMinutes * 60 * 1000)) * (intervalMinutes * 60 * 1000)
    ).toISOString();

    if (!grouped[intervalKey]) {
      grouped[intervalKey] = [];
    }
    grouped[intervalKey].push(item);
  });

  return grouped;
};

// Format bytes
export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Generate random color for charts
export const generateColor = (index) => {
  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
  ];
  return colors[index % colors.length];
};
