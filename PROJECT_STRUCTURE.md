# Project Structure

## Complete File Tree

```
smart-network-monitor/
│
├── README.md                          # Main documentation
├── QUICK_START.md                     # Quick setup guide
├── PROJECT_ROADMAP.md                 # Feature roadmap
├── PROJECT_STRUCTURE.md               # This file
├── package.json                       # Root package file
├── setup.sh                           # Unix/Mac setup script
├── setup.bat                          # Windows setup script
│
├── backend/                           # Backend Node.js application
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js           # MongoDB connection config
│   │   │
│   │   ├── controllers/
│   │   │   ├── deviceController.js   # Device CRUD operations
│   │   │   ├── alertController.js    # Alert management
│   │   │   └── dashboardController.js # Dashboard data
│   │   │
│   │   ├── models/
│   │   │   ├── Device.js             # Device schema
│   │   │   ├── NetworkMetric.js      # Metrics schema
│   │   │   └── Alert.js              # Alert schema
│   │   │
│   │   ├── routes/
│   │   │   ├── deviceRoutes.js       # Device API routes
│   │   │   ├── alertRoutes.js        # Alert API routes
│   │   │   └── dashboardRoutes.js    # Dashboard routes
│   │   │
│   │   ├── services/
│   │   │   ├── networkMonitor.js     # Core monitoring logic
│   │   │   └── notificationService.js # Email/Telegram alerts
│   │   │
│   │   ├── utils/
│   │   │   └── logger.js             # Winston logger
│   │   │
│   │   └── server.js                 # Express server entry point
│   │
│   ├── logs/                         # Log files (auto-generated)
│   ├── .env.example                  # Environment variables template
│   ├── .env                          # Environment variables (create this)
│   ├── .gitignore                    # Git ignore rules
│   └── package.json                  # Backend dependencies
│
├── frontend/                         # Frontend React application
│   ├── public/                       # Static assets
│   │   └── vite.svg                 # Favicon
│   │
│   ├── src/
│   │   ├── components/              # React components
│   │   │   ├── Layout.jsx           # Main layout with sidebar
│   │   │   └── DeviceModal.jsx      # Add/Edit device modal
│   │   │
│   │   ├── pages/                   # Page components
│   │   │   ├── Dashboard.jsx        # Main dashboard
│   │   │   ├── Devices.jsx          # Device list
│   │   │   ├── DeviceDetails.jsx    # Single device view
│   │   │   ├── Alerts.jsx           # Alerts page
│   │   │   ├── NetworkTopology.jsx  # D3.js network map
│   │   │   └── Settings.jsx         # Settings page
│   │   │
│   │   ├── services/
│   │   │   └── api.js               # Axios API client
│   │   │
│   │   ├── hooks/
│   │   │   └── useWebSocket.js      # WebSocket hook
│   │   │
│   │   ├── utils/
│   │   │   └── helpers.js           # Helper functions
│   │   │
│   │   ├── App.jsx                  # Main App component
│   │   ├── main.jsx                 # Entry point
│   │   └── index.css                # Global styles
│   │
│   ├── index.html                   # HTML template
│   ├── vite.config.js               # Vite configuration
│   ├── tailwind.config.js           # Tailwind CSS config
│   ├── postcss.config.js            # PostCSS config
│   ├── .env.example                 # Frontend env template
│   ├── .gitignore                   # Git ignore rules
│   └── package.json                 # Frontend dependencies
│
└── node_modules/                    # Dependencies (auto-generated)
```

## Key Files Explained

### Backend Files

#### `backend/src/server.js`
- Express server setup
- WebSocket (Socket.IO) initialization
- API route mounting
- Error handling middleware
- Graceful shutdown handling

#### `backend/src/services/networkMonitor.js`
- Core monitoring engine
- Ping functionality
- Traceroute execution
- Device status tracking
- Alert generation
- Real-time WebSocket updates

#### `backend/src/services/notificationService.js`
- Email notification setup (Nodemailer)
- Telegram bot integration
- Alert message formatting
- Notification delivery

#### `backend/src/models/`
- **Device.js**: Device information and current status
- **NetworkMetric.js**: Time-series ping data with TTL
- **Alert.js**: Alert history with severity levels

#### `backend/src/controllers/`
- **deviceController.js**: Device CRUD, metrics, stats
- **alertController.js**: Alert management
- **dashboardController.js**: Aggregated dashboard data

### Frontend Files

#### `frontend/src/App.jsx`
- React Router setup
- Main application structure
- Toast notification container

#### `frontend/src/components/Layout.jsx`
- Responsive sidebar navigation
- Top navigation bar
- WebSocket connection status
- Mobile menu toggle

#### `frontend/src/pages/Dashboard.jsx`
- Real-time network overview
- Device status cards
- Latency and uptime charts (Recharts)
- Recent alerts display

#### `frontend/src/pages/Devices.jsx`
- Device grid/list view
- Add/Edit/Delete devices
- Real-time status updates
- Device filtering

#### `frontend/src/pages/DeviceDetails.jsx`
- Single device metrics
- Historical latency charts
- 24-hour statistics
- Ping/Traceroute tools

#### `frontend/src/pages/NetworkTopology.jsx`
- D3.js force-directed graph
- Interactive network visualization
- Drag-and-drop nodes
- Zoom and pan support

#### `frontend/src/pages/Alerts.jsx`
- Alert list with filtering
- Resolve/dismiss alerts
- Severity-based styling

#### `frontend/src/hooks/useWebSocket.js`
- WebSocket connection management
- Event listener handling
- Connection state tracking

#### `frontend/src/services/api.js`
- Axios instance configuration
- API endpoint definitions
- Request/response interceptors
- Error handling

## Data Flow

### Monitoring Flow
```
Device → Ping Service → Network Metrics → MongoDB
                ↓
        WebSocket Broadcast
                ↓
        Frontend Update (Real-time)
```

### Alert Flow
```
Threshold Exceeded → Alert Creation → Notification Service
                                            ↓
                                    Email/Telegram Alert
                                            ↓
                                    WebSocket to Frontend
```

### API Request Flow
```
Frontend → Axios → Express Routes → Controller → Service/Model → MongoDB
                                                        ↓
                                                    Response
                                                        ↓
                                                Frontend Update
```

## Technology Stack by Layer

### Backend Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose
- **WebSocket**: Socket.IO
- **Logging**: Winston
- **Email**: Nodemailer
- **HTTP Client**: Axios (for Telegram)
- **Validation**: express-validator
- **Security**: Helmet, CORS, Compression

### Frontend Stack
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Charts**: Recharts
- **Network Graph**: D3.js
- **Icons**: React Icons
- **Notifications**: React Toastify
- **WebSocket**: Socket.IO Client
- **HTTP Client**: Axios
- **Date Handling**: date-fns

## Environment Variables

### Backend (.env)
```
PORT                          # Server port
NODE_ENV                      # Environment
MONGODB_URI                   # Database connection
EMAIL_HOST                    # SMTP host
EMAIL_PORT                    # SMTP port
EMAIL_USER                    # Email username
EMAIL_PASSWORD                # Email password
TELEGRAM_BOT_TOKEN            # Telegram bot token
TELEGRAM_CHAT_ID              # Telegram chat ID
PING_INTERVAL                 # Monitoring interval
ALERT_THRESHOLD_LATENCY       # Latency alert threshold
ALERT_THRESHOLD_PACKET_LOSS   # Packet loss threshold
```

### Frontend (.env)
```
VITE_API_URL                  # Backend API URL
VITE_SOCKET_URL               # WebSocket server URL
```

## Database Collections

### devices
- Device information
- Current status
- Uptime percentage
- Last seen timestamp

### networkmetrics
- Time-series ping data
- Latency measurements
- Packet loss data
- TTL index (30 days auto-deletion)

### alerts
- Alert history
- Severity levels
- Notification status
- Resolution status

## API Endpoints Summary

```
GET    /api/devices              # List all devices
POST   /api/devices              # Create device
GET    /api/devices/:id          # Get device
PUT    /api/devices/:id          # Update device
DELETE /api/devices/:id          # Delete device
GET    /api/devices/:id/metrics  # Device metrics
GET    /api/devices/:id/stats    # Device statistics
POST   /api/devices/:id/ping     # Ping device
POST   /api/devices/:id/traceroute # Traceroute

GET    /api/alerts               # List alerts
GET    /api/alerts/stats         # Alert statistics
PUT    /api/alerts/:id/resolve   # Resolve alert
DELETE /api/alerts/:id           # Delete alert

GET    /api/dashboard/overview   # Dashboard data
GET    /api/dashboard/topology   # Network topology
GET    /api/dashboard/activity   # Network activity
GET    /api/dashboard/metrics    # Aggregated metrics

GET    /api/health               # Health check
POST   /api/test-notifications   # Test alerts
```

## WebSocket Events

### Client → Server
```
subscribe-device      # Subscribe to device updates
unsubscribe-device    # Unsubscribe from device
```

### Server → Client
```
device-update         # Real-time device status
metric-update         # New metric data
new-alert             # New alert created
```

## File Size Overview

- **Backend**: ~50 files, ~5 MB (excluding node_modules)
- **Frontend**: ~20 files, ~3 MB (excluding node_modules)
- **Total node_modules**: ~300 MB
- **Documentation**: 4 files, ~100 KB

## Build Output

### Production Build
```
frontend/dist/
├── index.html
├── assets/
│   ├── index-[hash].js      # ~200 KB (gzipped)
│   └── index-[hash].css     # ~10 KB (gzipped)
└── vite.svg
```

---

**Version**: 1.0.0
**Last Updated**: 2025-01-20
