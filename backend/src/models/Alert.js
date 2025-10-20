const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  device: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['high_latency', 'packet_loss', 'device_down', 'device_up', 'timeout'],
    required: true
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'critical'],
    default: 'warning'
  },
  message: {
    type: String,
    required: true
  },
  value: {
    type: Number,
    default: null
  },
  threshold: {
    type: Number,
    default: null
  },
  isResolved: {
    type: Boolean,
    default: false
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  notificationSent: {
    type: Boolean,
    default: false
  },
  notificationChannels: [{
    type: String,
    enum: ['email', 'telegram', 'webhook']
  }]
}, {
  timestamps: true
});

// Indexes
alertSchema.index({ device: 1, createdAt: -1 });
alertSchema.index({ isResolved: 1 });
alertSchema.index({ severity: 1 });

module.exports = mongoose.model('Alert', alertSchema);
