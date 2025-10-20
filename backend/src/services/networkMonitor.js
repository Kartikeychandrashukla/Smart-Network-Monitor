const ping = require('ping');
const { exec } = require('child_process');
const { promisify } = require('util');
const Device = require('../models/Device');
const NetworkMetric = require('../models/NetworkMetric');
const Alert = require('../models/Alert');
const logger = require('../utils/logger');
const notificationService = require('./notificationService');

const execAsync = promisify(exec);

class NetworkMonitorService {
  constructor(io) {
    this.io = io;
    this.monitoringIntervals = new Map();
    this.pingInterval = parseInt(process.env.PING_INTERVAL) || 5000;
    this.alertThresholds = {
      latency: parseInt(process.env.ALERT_THRESHOLD_LATENCY) || 200,
      packetLoss: parseInt(process.env.ALERT_THRESHOLD_PACKET_LOSS) || 10
    };
  }

  // Start monitoring all active devices
  async startMonitoring() {
    try {
      const devices = await Device.find({ isActive: true });
      logger.info(`Starting monitoring for ${devices.length} active devices`);

      for (const device of devices) {
        this.startDeviceMonitoring(device);
      }
    } catch (error) {
      logger.error(`Error starting monitoring: ${error.message}`);
    }
  }

  // Start monitoring a specific device
  startDeviceMonitoring(device) {
    // Clear existing interval if any
    this.stopDeviceMonitoring(device._id);

    logger.info(`Starting monitoring for device: ${device.name} (${device.ipAddress})`);

    // Set up interval for this device
    const intervalId = setInterval(async () => {
      await this.monitorDevice(device);
    }, this.pingInterval);

    this.monitoringIntervals.set(device._id.toString(), intervalId);

    // Do initial check immediately
    this.monitorDevice(device);
  }

  // Stop monitoring a specific device
  stopDeviceMonitoring(deviceId) {
    const intervalId = this.monitoringIntervals.get(deviceId.toString());
    if (intervalId) {
      clearInterval(intervalId);
      this.monitoringIntervals.delete(deviceId.toString());
      logger.info(`Stopped monitoring for device: ${deviceId}`);
    }
  }

  // Stop all monitoring
  stopAllMonitoring() {
    for (const [deviceId, intervalId] of this.monitoringIntervals) {
      clearInterval(intervalId);
    }
    this.monitoringIntervals.clear();
    logger.info('Stopped all device monitoring');
  }

  // Monitor a single device
  async monitorDevice(device) {
    try {
      const pingResult = await this.pingHost(device.ipAddress);

      // Create metric record
      const metric = new NetworkMetric({
        device: device._id,
        latency: pingResult.alive ? parseFloat(pingResult.time) : null,
        packetLoss: pingResult.packetLoss || 0,
        status: pingResult.alive ? 'success' : 'timeout',
        responseTime: pingResult.alive ? parseFloat(pingResult.time) : null,
        errorMessage: pingResult.alive ? null : 'Host unreachable'
      });

      await metric.save();

      // Update device status
      const previousStatus = device.status;
      const newStatus = this.determineDeviceStatus(pingResult);

      device.status = newStatus;
      device.currentLatency = pingResult.alive ? parseFloat(pingResult.time) : null;
      device.lastSeen = pingResult.alive ? new Date() : device.lastSeen;

      // Calculate uptime percentage (last 24 hours)
      const uptimePercentage = await this.calculateUptime(device._id);
      device.uptimePercentage = uptimePercentage;

      await device.save();

      // Check for alerts
      await this.checkAndCreateAlerts(device, pingResult, previousStatus);

      // Emit real-time update via WebSocket
      if (this.io) {
        this.io.emit('device-update', {
          deviceId: device._id,
          name: device.name,
          ipAddress: device.ipAddress,
          status: newStatus,
          latency: device.currentLatency,
          uptimePercentage: device.uptimePercentage,
          timestamp: new Date()
        });

        this.io.emit('metric-update', {
          deviceId: device._id,
          metric: metric.toObject()
        });
      }

    } catch (error) {
      logger.error(`Error monitoring device ${device.name}: ${error.message}`);
    }
  }

  // Ping a host using native command (more reliable on Windows)
  async pingHostNative(host, count = 4) {
    try {
      const isWindows = process.platform === 'win32';
      const command = isWindows
        ? `ping -n ${count} ${host}`
        : `ping -c ${count} ${host}`;

      const { stdout } = await execAsync(command, { timeout: 15000 });

      if (isWindows) {
        // Parse Windows ping output
        const lines = stdout.split('\n');
        let latencies = [];
        let successCount = 0;

        for (const line of lines) {
          // Match lines like: "Reply from 8.8.8.8: bytes=32 time=15ms TTL=117"
          const match = line.match(/time[=<](\d+)ms/i);
          if (match) {
            latencies.push(parseInt(match[1]));
            successCount++;
          }
        }

        if (latencies.length > 0) {
          const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
          const packetLoss = ((count - successCount) / count) * 100;

          return {
            alive: true,
            time: avgLatency,
            packetLoss: packetLoss,
            host: host
          };
        }
      } else {
        // Parse Unix/Mac ping output
        const match = stdout.match(/min\/avg\/max[\/\w\s=]+([\d.]+)\/([\d.]+)\/([\d.]+)/);
        if (match) {
          return {
            alive: true,
            time: parseFloat(match[2]), // avg
            packetLoss: 0,
            host: host
          };
        }
      }

      // If parsing failed but command succeeded, assume it's alive
      return {
        alive: stdout.includes('TTL=') || stdout.includes('ttl='),
        time: 0,
        packetLoss: 100,
        host: host
      };

    } catch (error) {
      // Command failed - host is unreachable
      return {
        alive: false,
        time: 0,
        packetLoss: 100,
        host: host
      };
    }
  }

  // Ping a host (fallback to native if ping module fails)
  async pingHost(host, count = 4) {
    try {
      const isWindows = process.platform === 'win32';
      const pingOptions = {
        timeout: 10,
      };

      // Windows uses -n, Unix/Mac uses -c
      if (isWindows) {
        pingOptions.extra = ['-n', count.toString()];
      } else {
        pingOptions.extra = ['-c', count.toString()];
      }

      const result = await ping.promise.probe(host, pingOptions);

      // Parse the time value properly
      let latency = 0;
      if (result.alive && result.time) {
        latency = typeof result.time === 'string' ? parseFloat(result.time) : result.time;
      }

      // If ping module returns 0 latency on Windows, use native ping
      if (isWindows && result.alive && latency === 0) {
        logger.debug(`Ping module returned 0ms for ${host}, using native ping`);
        return await this.pingHostNative(host, count);
      }

      return {
        alive: result.alive,
        time: latency,
        packetLoss: result.packetLoss || (result.alive ? 0 : 100),
        host: host
      };
    } catch (error) {
      logger.error(`Ping module error for ${host}: ${error.message}, trying native ping`);
      // Fallback to native ping
      return await this.pingHostNative(host, count);
    }
  }

  // Traceroute to a host
  async traceroute(host) {
    try {
      const isWindows = process.platform === 'win32';
      const command = isWindows ? `tracert -d -h 30 ${host}` : `traceroute -m 30 -n ${host}`;

      const { stdout, stderr } = await execAsync(command, { timeout: 30000 });

      if (stderr && !isWindows) {
        logger.warn(`Traceroute warning for ${host}: ${stderr}`);
      }

      return this.parseTraceroute(stdout, isWindows);
    } catch (error) {
      logger.error(`Traceroute error for ${host}: ${error.message}`);
      return { hops: [], error: error.message };
    }
  }

  // Parse traceroute output
  parseTraceroute(output, isWindows) {
    const hops = [];
    const lines = output.split('\n');

    for (const line of lines) {
      if (isWindows) {
        // Windows tracert format: "  1    <1 ms    <1 ms    <1 ms  192.168.1.1"
        const match = line.match(/^\s*(\d+)\s+(?:<?\d+\s*ms\s+)+(.+)$/);
        if (match) {
          hops.push({
            hop: parseInt(match[1]),
            ip: match[2].trim()
          });
        }
      } else {
        // Linux/Mac traceroute format: " 1  192.168.1.1  1.234 ms  1.567 ms  1.890 ms"
        const match = line.match(/^\s*(\d+)\s+(\S+)\s+([\d.]+\s*ms)/);
        if (match) {
          hops.push({
            hop: parseInt(match[1]),
            ip: match[2],
            time: match[3]
          });
        }
      }
    }

    return { hops, hopCount: hops.length };
  }

  // Determine device status based on ping result
  determineDeviceStatus(pingResult) {
    if (!pingResult.alive) {
      return 'offline';
    }

    if (pingResult.time > this.alertThresholds.latency ||
        pingResult.packetLoss > this.alertThresholds.packetLoss) {
      return 'warning';
    }

    return 'online';
  }

  // Calculate uptime percentage
  async calculateUptime(deviceId, hours = 24) {
    try {
      const startTime = new Date(Date.now() - (hours * 60 * 60 * 1000));

      const metrics = await NetworkMetric.find({
        device: deviceId,
        timestamp: { $gte: startTime }
      });

      if (metrics.length === 0) {
        return 100;
      }

      const successCount = metrics.filter(m => m.status === 'success').length;
      const uptimePercentage = (successCount / metrics.length) * 100;

      return Math.round(uptimePercentage * 100) / 100;
    } catch (error) {
      logger.error(`Error calculating uptime: ${error.message}`);
      return 0;
    }
  }

  // Check and create alerts
  async checkAndCreateAlerts(device, pingResult, previousStatus) {
    try {
      if (!device.alertEnabled) {
        return;
      }

      const alerts = [];

      // Device status change alerts
      if (previousStatus !== device.status) {
        if (device.status === 'offline') {
          alerts.push({
            device: device._id,
            type: 'device_down',
            severity: 'critical',
            message: `Device ${device.name} (${device.ipAddress}) is offline`,
            notificationChannels: ['email', 'telegram']
          });
        } else if (device.status === 'online' && previousStatus === 'offline') {
          alerts.push({
            device: device._id,
            type: 'device_up',
            severity: 'info',
            message: `Device ${device.name} (${device.ipAddress}) is back online`,
            notificationChannels: ['email', 'telegram']
          });
        }
      }

      // High latency alert
      if (pingResult.alive && pingResult.time > this.alertThresholds.latency) {
        alerts.push({
          device: device._id,
          type: 'high_latency',
          severity: 'warning',
          message: `High latency detected on ${device.name}: ${pingResult.time}ms`,
          value: pingResult.time,
          threshold: this.alertThresholds.latency,
          notificationChannels: ['email']
        });
      }

      // Packet loss alert
      if (pingResult.packetLoss > this.alertThresholds.packetLoss) {
        alerts.push({
          device: device._id,
          type: 'packet_loss',
          severity: 'warning',
          message: `Packet loss detected on ${device.name}: ${pingResult.packetLoss}%`,
          value: pingResult.packetLoss,
          threshold: this.alertThresholds.packetLoss,
          notificationChannels: ['email']
        });
      }

      // Save alerts and send notifications
      for (const alertData of alerts) {
        const alert = new Alert(alertData);
        await alert.save();

        // Send notifications
        if (alertData.notificationChannels.includes('email')) {
          await notificationService.sendEmailAlert(device, alertData);
        }
        if (alertData.notificationChannels.includes('telegram')) {
          await notificationService.sendTelegramAlert(device, alertData);
        }

        alert.notificationSent = true;
        await alert.save();

        // Emit alert via WebSocket
        if (this.io) {
          this.io.emit('new-alert', alert.toObject());
        }
      }

    } catch (error) {
      logger.error(`Error creating alerts: ${error.message}`);
    }
  }

  // Get current monitoring status
  getMonitoringStatus() {
    return {
      activeMonitors: this.monitoringIntervals.size,
      pingInterval: this.pingInterval,
      alertThresholds: this.alertThresholds
    };
  }
}

module.exports = NetworkMonitorService;
