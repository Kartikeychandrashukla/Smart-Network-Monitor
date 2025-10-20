const Device = require('../models/Device');
const NetworkMetric = require('../models/NetworkMetric');
const Alert = require('../models/Alert');
const logger = require('../utils/logger');

// Get dashboard overview
exports.getDashboardOverview = async (req, res) => {
  try {
    // Get device statistics
    const totalDevices = await Device.countDocuments();
    const onlineDevices = await Device.countDocuments({ status: 'online' });
    const offlineDevices = await Device.countDocuments({ status: 'offline' });
    const warningDevices = await Device.countDocuments({ status: 'warning' });

    // Get alert statistics (last 24 hours)
    const oneDayAgo = new Date(Date.now() - (24 * 60 * 60 * 1000));
    const recentAlerts = await Alert.countDocuments({
      createdAt: { $gte: oneDayAgo }
    });
    const unresolvedAlerts = await Alert.countDocuments({ isResolved: false });

    // Get critical alerts
    const criticalAlerts = await Alert.countDocuments({
      severity: 'critical',
      isResolved: false
    });

    // Calculate average uptime
    const devices = await Device.find({ isActive: true });
    const avgUptime = devices.length > 0
      ? devices.reduce((sum, device) => sum + device.uptimePercentage, 0) / devices.length
      : 100;

    // Get recent metrics for network health
    const recentMetrics = await NetworkMetric.find({
      timestamp: { $gte: oneDayAgo }
    });

    const avgLatency = recentMetrics.length > 0
      ? recentMetrics
          .filter(m => m.latency !== null)
          .reduce((sum, m) => sum + m.latency, 0) / recentMetrics.filter(m => m.latency !== null).length
      : 0;

    res.json({
      success: true,
      data: {
        devices: {
          total: totalDevices,
          online: onlineDevices,
          offline: offlineDevices,
          warning: warningDevices
        },
        alerts: {
          recent: recentAlerts,
          unresolved: unresolvedAlerts,
          critical: criticalAlerts
        },
        network: {
          avgUptime: Math.round(avgUptime * 100) / 100,
          avgLatency: Math.round(avgLatency * 100) / 100
        }
      }
    });
  } catch (error) {
    logger.error(`Error fetching dashboard overview: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard overview',
      error: error.message
    });
  }
};

// Get network topology data
exports.getNetworkTopology = async (req, res) => {
  try {
    const devices = await Device.find({ isActive: true });

    const nodes = devices.map(device => ({
      id: device._id,
      name: device.name,
      ip: device.ipAddress,
      type: device.type,
      status: device.status,
      latency: device.currentLatency,
      uptime: device.uptimePercentage
    }));

    // In a real scenario, you'd determine actual network connections
    // For now, we'll create a simple topology where all devices connect to a central hub
    const links = devices.map(device => ({
      source: 'hub',
      target: device._id.toString(),
      status: device.status
    }));

    // Add a central hub node
    nodes.unshift({
      id: 'hub',
      name: 'Network Hub',
      type: 'router',
      status: 'online'
    });

    res.json({
      success: true,
      data: {
        nodes,
        links
      }
    });
  } catch (error) {
    logger.error(`Error fetching network topology: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error fetching network topology',
      error: error.message
    });
  }
};

// Get network activity timeline
exports.getNetworkActivity = async (req, res) => {
  try {
    const { hours = 24 } = req.query;
    const startTime = new Date(Date.now() - (hours * 60 * 60 * 1000));

    // Get recent alerts
    const alerts = await Alert.find({
      createdAt: { $gte: startTime }
    })
      .populate('device', 'name ipAddress')
      .sort({ createdAt: -1 })
      .limit(50);

    // Get device status changes
    const devices = await Device.find({ isActive: true });

    const activity = alerts.map(alert => ({
      timestamp: alert.createdAt,
      type: 'alert',
      severity: alert.severity,
      message: alert.message,
      device: alert.device
    }));

    res.json({
      success: true,
      data: activity
    });
  } catch (error) {
    logger.error(`Error fetching network activity: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error fetching network activity',
      error: error.message
    });
  }
};

// Get metrics aggregated by time intervals
exports.getAggregatedMetrics = async (req, res) => {
  try {
    const { deviceId, hours = 24, interval = 60 } = req.query; // interval in minutes

    const startTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
    const intervalMs = interval * 60 * 1000;

    const matchStage = {
      timestamp: { $gte: startTime }
    };

    if (deviceId) {
      matchStage.device = require('mongoose').Types.ObjectId(deviceId);
    }

    const metrics = await NetworkMetric.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            $toDate: {
              $subtract: [
                { $toLong: '$timestamp' },
                { $mod: [{ $toLong: '$timestamp' }, intervalMs] }
              ]
            }
          },
          avgLatency: { $avg: '$latency' },
          maxLatency: { $max: '$latency' },
          minLatency: { $min: '$latency' },
          avgPacketLoss: { $avg: '$packetLoss' },
          successCount: {
            $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
          },
          totalCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const formattedMetrics = metrics.map(m => ({
      timestamp: m._id,
      avgLatency: Math.round((m.avgLatency || 0) * 100) / 100,
      maxLatency: Math.round((m.maxLatency || 0) * 100) / 100,
      minLatency: Math.round((m.minLatency || 0) * 100) / 100,
      avgPacketLoss: Math.round((m.avgPacketLoss || 0) * 100) / 100,
      uptime: Math.round((m.successCount / m.totalCount) * 10000) / 100
    }));

    res.json({
      success: true,
      count: formattedMetrics.length,
      data: formattedMetrics
    });
  } catch (error) {
    logger.error(`Error fetching aggregated metrics: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error fetching aggregated metrics',
      error: error.message
    });
  }
};
