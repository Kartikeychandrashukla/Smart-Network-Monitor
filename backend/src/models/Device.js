const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Device name is required'],
    trim: true,
    maxlength: [100, 'Device name cannot exceed 100 characters']
  },
  ipAddress: {
    type: String,
    required: [true, 'IP address is required'],
    trim: true,
    validate: {
      validator: function(v) {
        // Basic IP validation (IPv4 and domain names)
        return /^(\d{1,3}\.){3}\d{1,3}$/.test(v) || /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v);
      },
      message: props => `${props.value} is not a valid IP address or domain!`
    }
  },
  type: {
    type: String,
    enum: ['server', 'router', 'switch', 'firewall', 'workstation', 'other'],
    default: 'server'
  },
  location: {
    type: String,
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'warning', 'unknown'],
    default: 'unknown'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  alertEnabled: {
    type: Boolean,
    default: true
  },
  currentLatency: {
    type: Number,
    default: null
  },
  lastSeen: {
    type: Date,
    default: null
  },
  uptimePercentage: {
    type: Number,
    default: 100
  },
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true
});

// Indexes for better query performance
deviceSchema.index({ ipAddress: 1 });
deviceSchema.index({ status: 1 });
deviceSchema.index({ isActive: 1 });

// Virtual for uptime status
deviceSchema.virtual('isHealthy').get(function() {
  return this.status === 'online' && this.uptimePercentage >= 95;
});

module.exports = mongoose.model('Device', deviceSchema);
