const Alert = require('../models/Alert');
const logger = require('../utils/logger');

// Get all alerts
exports.getAllAlerts = async (req, res) => {
  try {
    const { isResolved, severity, limit = 50 } = req.query;

    const filter = {};
    if (isResolved !== undefined) {
      filter.isResolved = isResolved === 'true';
    }
    if (severity) {
      filter.severity = severity;
    }

    const alerts = await Alert.find(filter)
      .populate('device', 'name ipAddress type')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: alerts.length,
      data: alerts
    });
  } catch (error) {
    logger.error(`Error fetching alerts: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error fetching alerts',
      error: error.message
    });
  }
};

// Get alerts for specific device
exports.getDeviceAlerts = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { limit = 50 } = req.query;

    const alerts = await Alert.find({ device: deviceId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: alerts.length,
      data: alerts
    });
  } catch (error) {
    logger.error(`Error fetching device alerts: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error fetching device alerts',
      error: error.message
    });
  }
};

// Resolve alert
exports.resolveAlert = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      {
        isResolved: true,
        resolvedAt: new Date()
      },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    res.json({
      success: true,
      message: 'Alert resolved successfully',
      data: alert
    });
  } catch (error) {
    logger.error(`Error resolving alert: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error resolving alert',
      error: error.message
    });
  }
};

// Delete alert
exports.deleteAlert = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndDelete(req.params.id);

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    res.json({
      success: true,
      message: 'Alert deleted successfully'
    });
  } catch (error) {
    logger.error(`Error deleting alert: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error deleting alert',
      error: error.message
    });
  }
};

// Get alert statistics
exports.getAlertStats = async (req, res) => {
  try {
    const { hours = 24 } = req.query;
    const startTime = new Date(Date.now() - (hours * 60 * 60 * 1000));

    const stats = await Alert.aggregate([
      { $match: { createdAt: { $gte: startTime } } },
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalAlerts = await Alert.countDocuments({
      createdAt: { $gte: startTime }
    });

    const unresolvedAlerts = await Alert.countDocuments({
      isResolved: false,
      createdAt: { $gte: startTime }
    });

    const statsBySeverity = {
      info: 0,
      warning: 0,
      critical: 0
    };

    stats.forEach(stat => {
      statsBySeverity[stat._id] = stat.count;
    });

    res.json({
      success: true,
      data: {
        total: totalAlerts,
        unresolved: unresolvedAlerts,
        ...statsBySeverity
      }
    });
  } catch (error) {
    logger.error(`Error fetching alert stats: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error fetching alert stats',
      error: error.message
    });
  }
};
