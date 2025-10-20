# Quick Start Guide

## 5-Minute Setup

### Prerequisites
- Node.js installed (v16+)
- MongoDB installed and running

### Setup Steps

1. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure Environment**
   ```bash
   # Copy the example env file
   cp .env.example .env

   # The default .env is already configured for local development
   # Just make sure MongoDB is running on default port 27017
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Start Backend** (Terminal 1)
   ```bash
   cd backend
   npm run dev
   ```
   ✅ Backend running on http://localhost:5000

5. **Start Frontend** (Terminal 2)
   ```bash
   cd frontend
   npm run dev
   ```
   ✅ Frontend running on http://localhost:3000

6. **Open your browser**
   Navigate to: http://localhost:3000

## First Time Usage

### Add Your First Device

1. Click **"Devices"** in the sidebar
2. Click **"Add Device"** button
3. Enter:
   - **Name**: "Google DNS"
   - **IP Address**: "8.8.8.8"
   - **Type**: "Server"
   - Check both boxes (Enable monitoring & Enable alerts)
4. Click **"Add Device"**

You should now see the device being monitored in real-time!

### Try These Test Devices

Add these popular services to see instant results:

| Name | IP/Domain | Type |
|------|-----------|------|
| Google DNS | 8.8.8.8 | Server |
| Cloudflare DNS | 1.1.1.1 | Server |
| Google | google.com | Server |
| GitHub | github.com | Server |
| Local Router | 192.168.1.1 | Router |

### Explore Features

1. **Dashboard** - View overall network health
2. **Devices** - Manage and monitor devices
3. **Alerts** - View triggered alerts
4. **Network Map** - See topology visualization
5. **Settings** - Configure thresholds

## Optional: Enable Notifications

### Email Alerts (Gmail)

1. Get Gmail App Password:
   - Go to Google Account → Security
   - Enable 2FA
   - Create App Password

2. Update `backend/.env`:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   ```

3. Restart backend server

### Telegram Alerts

1. Create bot with [@BotFather](https://t.me/botfather)
2. Get your chat ID from: `https://api.telegram.org/bot<TOKEN>/getUpdates`
3. Update `backend/.env`:
   ```env
   TELEGRAM_BOT_TOKEN=your-bot-token
   TELEGRAM_CHAT_ID=your-chat-id
   ```

4. Restart backend server

## Testing Notifications

Make a POST request to test:
```bash
curl -X POST http://localhost:5000/api/test-notifications
```

## Troubleshooting

**MongoDB Connection Error:**
```bash
# Windows
net start MongoDB

# Mac/Linux
brew services start mongodb-community
# or
sudo systemctl start mongod
```

**Port Already in Use:**
```bash
# Change PORT in backend/.env
PORT=5001
```

**CORS Error:**
- Make sure both backend and frontend are running
- Check that API_URL in frontend matches backend port

## Next Steps

- Add your real network devices
- Configure alert thresholds in Settings
- Set up email/Telegram notifications
- Monitor your network 24/7!

---

Need help? Check [README.md](README.md) for detailed documentation.
