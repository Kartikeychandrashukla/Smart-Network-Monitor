const mongoose = require('mongoose');

const networkMetricSchema = new mongoose.Schema({
  device: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  latency: {
    type: Number, // in milliseconds
    default: null
  },
  packetLoss: {
    type: Number, // percentage
    default: 0,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['success', 'timeout', 'unreachable', 'error'],
    default: 'success'
  },
  hopCount: {
    type: Number,
    default: null
  },
  responseTime: {
    type: Number,
    default: null
  },
  errorMessage: {
    type: String,
    default: null
  }
}, {
  timestamps: false
});

// Compound index for efficient querying
networkMetricSchema.index({ device: 1, timestamp: -1 });
networkMetricSchema.index({ timestamp: -1 });

// TTL index to automatically delete old records after 30 days
networkMetricSchema.index(
  { timestamp: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60 } // 30 days
);

module.exports = mongoose.model('NetworkMetric', networkMetricSchema);
