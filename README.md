# Smart Network Monitor

A comprehensive web-based network monitoring dashboard that tracks network health, detects outages, monitors latency, and sends automated alerts to administrators.

## Features

### Core Features
- **Real-time Network Monitoring**: Continuous ping monitoring of network devices
- **Live Dashboard**: Real-time visualization of network health metrics
- **Device Management**: Add, edit, and remove network devices (servers, routers, switches, etc.)
- **Alert System**: Automated alerts via Email and Telegram
- **Historical Data**: Track and visualize network performance over time
- **Network Topology**: Interactive D3.js network map visualization
- **WebSocket Integration**: Real-time updates without page refresh

### Key Capabilities
- Ping monitoring with configurable intervals
- Latency tracking and visualization
- Packet loss detection
- Device uptime monitoring
- Traceroute functionality
- Multi-device support
- Responsive design for mobile and desktop

## Tech Stack

### Backend
- **Node.js + Express**: REST API server
- **MongoDB + Mongoose**: Database for devices, metrics, and alerts
- **Socket.IO**: Real-time WebSocket communication
- **Winston**: Logging
- **Nodemailer**: Email notifications
- **Axios**: HTTP client for Telegram API

### Frontend
- **React 18**: UI framework
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Styling
- **Recharts**: Chart visualizations
- **D3.js**: Network topology graph
- **React Router**: Navigation
- **React Toastify**: Notifications

## Project Structure

```
smart-network-monitor/
├── backend/
│   ├── src/
│   │   ├── config/          # Database configuration
│   │   ├── controllers/     # API controllers
│   │   ├── models/          # MongoDB models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic (monitoring, notifications)
│   │   ├── utils/           # Helper functions
│   │   └── server.js        # Express server entry point
│   ├── .env.example         # Environment variables template
│   ├── .env                 # Environment variables (create this)
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── hooks/           # Custom React hooks
│   │   ├── utils/           # Helper functions
│   │   ├── App.jsx          # Main app component
│   │   └── main.jsx         # Entry point
│   ├── public/
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
└── README.md
```

## Installation & Setup

### Prerequisites
- **Node.js** (v16 or higher)
- **MongoDB** (v5 or higher) - Running locally or MongoDB Atlas
- **Git**

### Step 1: Clone the Repository
```bash
cd "smart network monitor"
```

### Step 2: Install Backend Dependencies
```bash
cd backend
npm install
```

### Step 3: Configure Environment Variables
Create a `.env` file in the backend directory:
```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/smart-network-monitor

# Email Configuration (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_CHAT_ID=your-telegram-chat-id

# Monitoring Configuration
PING_INTERVAL=5000              # 5 seconds
MAX_HISTORY_DAYS=30
ALERT_THRESHOLD_LATENCY=200     # milliseconds
ALERT_THRESHOLD_PACKET_LOSS=10  # percentage
```

### Step 4: Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

### Step 5: Start MongoDB
Make sure MongoDB is running:
```bash
# On Windows (if installed as service)
net start MongoDB

# On Mac/Linux
sudo systemctl start mongod
# or
brew services start mongodb-community
```

### Step 6: Start the Backend Server
```bash
cd backend
npm run dev
```
Backend will run on `http://localhost:5000`

### Step 7: Start the Frontend Development Server
Open a new terminal:
```bash
cd frontend
npm run dev
```
Frontend will run on `http://localhost:3000`

## Usage Guide

### 1. Adding Devices
1. Navigate to the **Devices** page
2. Click **"Add Device"** button
3. Fill in device details:
   - Device Name (e.g., "Main Server")
   - IP Address or Domain (e.g., "192.168.1.1" or "google.com")
   - Device Type (Server, Router, Switch, etc.)
   - Location (optional)
   - Description (optional)
4. Enable monitoring and alerts
5. Click **"Add Device"**

### 2. Monitoring Dashboard
- View real-time network statistics
- Monitor device status (Online/Offline/Warning)
- Track average latency and uptime
- View recent alerts
- Observe latency and uptime charts

### 3. Device Details
- Click on any device to view detailed metrics
- See 24-hour latency graph
- View statistics (avg/max/min latency, uptime)
- Access ping and traceroute tools

### 4. Network Topology
- Interactive visualization of your network
- Drag nodes to rearrange
- Zoom in/out
- Color-coded status indicators

### 5. Alerts Management
- View all alerts (resolved/unresolved)
- Filter alerts by status
- Resolve alerts manually
- Automatic notifications via email/Telegram

## Setting Up Notifications

### Email Notifications (Gmail Example)

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App-Specific Password:
   - Go to Google Account Settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
3. Update `.env`:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=generated-app-password
   ```

### Telegram Notifications

1. Create a Telegram Bot:
   - Open Telegram and search for [@BotFather](https://t.me/botfather)
   - Send `/newbot` and follow instructions
   - Copy the Bot Token

2. Get your Chat ID:
   - Start a chat with your bot
   - Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
   - Find your `chat_id` in the response

3. Update `.env`:
   ```env
   TELEGRAM_BOT_TOKEN=your-bot-token
   TELEGRAM_CHAT_ID=your-chat-id
   ```

## API Endpoints

### Devices
- `GET /api/devices` - Get all devices
- `GET /api/devices/:id` - Get single device
- `POST /api/devices` - Create device
- `PUT /api/devices/:id` - Update device
- `DELETE /api/devices/:id` - Delete device
- `GET /api/devices/:id/metrics` - Get device metrics
- `GET /api/devices/:id/stats` - Get device statistics
- `POST /api/devices/:id/ping` - Ping device
- `POST /api/devices/:id/traceroute` - Traceroute to device

### Alerts
- `GET /api/alerts` - Get all alerts
- `GET /api/alerts/stats` - Get alert statistics
- `GET /api/alerts/device/:deviceId` - Get alerts for device
- `PUT /api/alerts/:id/resolve` - Resolve alert
- `DELETE /api/alerts/:id` - Delete alert

### Dashboard
- `GET /api/dashboard/overview` - Get dashboard overview
- `GET /api/dashboard/topology` - Get network topology
- `GET /api/dashboard/activity` - Get network activity
- `GET /api/dashboard/metrics` - Get aggregated metrics

## Configuration Options

### Monitoring Settings
Edit in `backend/.env`:
```env
PING_INTERVAL=5000              # Check interval in milliseconds
ALERT_THRESHOLD_LATENCY=200     # Alert when latency exceeds (ms)
ALERT_THRESHOLD_PACKET_LOSS=10  # Alert when packet loss exceeds (%)
MAX_HISTORY_DAYS=30             # Days to retain metrics
```

## Production Deployment

### Backend
1. Set `NODE_ENV=production` in `.env`
2. Update `MONGODB_URI` with production database
3. Configure reverse proxy (nginx/Apache)
4. Use PM2 for process management:
   ```bash
   npm install -g pm2
   pm2 start src/server.js --name network-monitor
   pm2 save
   pm2 startup
   ```

### Frontend
1. Build the production bundle:
   ```bash
   npm run build
   ```
2. Serve the `dist` folder with nginx or deploy to Vercel/Netlify

## Troubleshooting

### Backend won't start
- Ensure MongoDB is running
- Check `.env` file configuration
- Verify port 5000 is not in use

### Frontend can't connect to backend
- Verify backend is running on port 5000
- Check CORS configuration
- Update API URL in `frontend/src/services/api.js`

### Devices not being monitored
- Check device IP is reachable
- Verify `isActive` is set to true
- Check firewall settings

### Notifications not working
- Verify email/Telegram credentials in `.env`
- Test notifications: `POST /api/test-notifications`
- Check logs in `backend/logs/`

## Features to Add (Future Enhancements)

- [ ] User authentication and authorization
- [ ] Role-based access control
- [ ] SNMP monitoring support
- [ ] Custom alert rules
- [ ] Webhook notifications
- [ ] Mobile app
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Export reports (PDF/CSV)
- [ ] SLA tracking
- [ ] Integration with third-party services (PagerDuty, Slack, etc.)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For issues, questions, or contributions, please open an issue on GitHub.

## Acknowledgments

- Built with modern web technologies
- Designed for network administrators and DevOps teams
- Inspired by enterprise network monitoring solutions

---

**Happy Monitoring!** 🚀
