const Device = require('../models/Device');
const NetworkMetric = require('../models/NetworkMetric');
const Alert = require('../models/Alert');
const logger = require('../utils/logger');

// Get all devices
exports.getAllDevices = async (req, res) => {
  try {
    const devices = await Device.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      count: devices.length,
      data: devices
    });
  } catch (error) {
    logger.error(`Error fetching devices: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error fetching devices',
      error: error.message
    });
  }
};

// Get single device
exports.getDevice = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    res.json({
      success: true,
      data: device
    });
  } catch (error) {
    logger.error(`Error fetching device: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error fetching device',
      error: error.message
    });
  }
};

// Create device
exports.createDevice = async (req, res) => {
  try {
    const device = await Device.create(req.body);

    // Start monitoring this device
    if (req.app.locals.networkMonitor && device.isActive) {
      req.app.locals.networkMonitor.startDeviceMonitoring(device);
    }

    res.status(201).json({
      success: true,
      message: 'Device created successfully',
      data: device
    });
  } catch (error) {
    logger.error(`Error creating device: ${error.message}`);
    res.status(400).json({
      success: false,
      message: 'Error creating device',
      error: error.message
    });
  }
};

// Update device
exports.updateDevice = async (req, res) => {
  try {
    const device = await Device.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    // Restart monitoring if active status changed
    if (req.app.locals.networkMonitor) {
      if (device.isActive) {
        req.app.locals.networkMonitor.startDeviceMonitoring(device);
      } else {
        req.app.locals.networkMonitor.stopDeviceMonitoring(device._id);
      }
    }

    res.json({
      success: true,
      message: 'Device updated successfully',
      data: device
    });
  } catch (error) {
    logger.error(`Error updating device: ${error.message}`);
    res.status(400).json({
      success: false,
      message: 'Error updating device',
      error: error.message
    });
  }
};

// Delete device
exports.deleteDevice = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    // Stop monitoring
    if (req.app.locals.networkMonitor) {
      req.app.locals.networkMonitor.stopDeviceMonitoring(device._id);
    }

    // Delete associated metrics
    await NetworkMetric.deleteMany({ device: device._id });

    // Delete associated alerts
    await Alert.deleteMany({ device: device._id });

    await device.deleteOne();

    res.json({
      success: true,
      message: 'Device deleted successfully'
    });
  } catch (error) {
    logger.error(`Error deleting device: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error deleting device',
      error: error.message
    });
  }
};

// Get device metrics
exports.getDeviceMetrics = async (req, res) => {
  try {
    const { id } = req.params;
    const { hours = 24, limit = 100 } = req.query;

    const startTime = new Date(Date.now() - (hours * 60 * 60 * 1000));

    const metrics = await NetworkMetric.find({
      device: id,
      timestamp: { $gte: startTime }
    })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: metrics.length,
      data: metrics.reverse() // Return in chronological order
    });
  } catch (error) {
    logger.error(`Error fetching device metrics: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error fetching device metrics',
      error: error.message
    });
  }
};

// Get device statistics
exports.getDeviceStats = async (req, res) => {
  try {
    const { id } = req.params;
    const { hours = 24 } = req.query;

    const startTime = new Date(Date.now() - (hours * 60 * 60 * 1000));

    const metrics = await NetworkMetric.find({
      device: id,
      timestamp: { $gte: startTime }
    });

    if (metrics.length === 0) {
      return res.json({
        success: true,
        data: {
          avgLatency: 0,
          maxLatency: 0,
          minLatency: 0,
          uptime: 100,
          totalChecks: 0
        }
      });
    }

    const latencies = metrics
      .filter(m => m.latency !== null)
      .map(m => m.latency);

    const avgLatency = latencies.length > 0
      ? latencies.reduce((a, b) => a + b, 0) / latencies.length
      : 0;

    const maxLatency = latencies.length > 0 ? Math.max(...latencies) : 0;
    const minLatency = latencies.length > 0 ? Math.min(...latencies) : 0;

    const successCount = metrics.filter(m => m.status === 'success').length;
    const uptime = (successCount / metrics.length) * 100;

    res.json({
      success: true,
      data: {
        avgLatency: Math.round(avgLatency * 100) / 100,
        maxLatency: Math.round(maxLatency * 100) / 100,
        minLatency: Math.round(minLatency * 100) / 100,
        uptime: Math.round(uptime * 100) / 100,
        totalChecks: metrics.length
      }
    });
  } catch (error) {
    logger.error(`Error fetching device stats: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error fetching device stats',
      error: error.message
    });
  }
};

// Ping device on demand
exports.pingDevice = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    if (!req.app.locals.networkMonitor) {
      return res.status(500).json({
        success: false,
        message: 'Network monitor not initialized'
      });
    }

    const pingResult = await req.app.locals.networkMonitor.pingHost(device.ipAddress);

    res.json({
      success: true,
      data: pingResult
    });
  } catch (error) {
    logger.error(`Error pinging device: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error pinging device',
      error: error.message
    });
  }
};

// Traceroute to device
exports.tracerouteDevice = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    if (!req.app.locals.networkMonitor) {
      return res.status(500).json({
        success: false,
        message: 'Network monitor not initialized'
      });
    }

    const traceResult = await req.app.locals.networkMonitor.traceroute(device.ipAddress);

    res.json({
      success: true,
      data: traceResult
    });
  } catch (error) {
    logger.error(`Error traceroute device: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error performing traceroute',
      error: error.message
    });
  }
};
