const nodemailer = require('nodemailer');
const axios = require('axios');
const logger = require('../utils/logger');

class NotificationService {
  constructor() {
    this.emailTransporter = null;
    this.initializeEmailTransporter();
  }

  // Initialize email transporter
  initializeEmailTransporter() {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      this.emailTransporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });

      logger.info('Email transporter initialized');
    } else {
      logger.warn('Email credentials not configured. Email alerts will be disabled.');
    }
  }

  // Send email alert
  async sendEmailAlert(device, alertData) {
    if (!this.emailTransporter) {
      logger.warn('Email transporter not configured. Skipping email alert.');
      return false;
    }

    try {
      const subject = `[${alertData.severity.toUpperCase()}] Network Alert: ${device.name}`;
      const html = this.generateEmailHTML(device, alertData);

      const mailOptions = {
        from: `"Network Monitor" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER, // In production, this should be configurable
        subject: subject,
        html: html
      };

      await this.emailTransporter.sendMail(mailOptions);
      logger.info(`Email alert sent for device: ${device.name}`);
      return true;
    } catch (error) {
      logger.error(`Error sending email alert: ${error.message}`);
      return false;
    }
  }

  // Generate email HTML
  generateEmailHTML(device, alertData) {
    const severityColors = {
      info: '#3b82f6',
      warning: '#f59e0b',
      critical: '#ef4444'
    };

    const color = severityColors[alertData.severity] || '#6b7280';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: ${color}; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
          .footer { background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 5px 5px; }
          .info-row { margin: 10px 0; }
          .label { font-weight: bold; color: #4b5563; }
          .value { color: #1f2937; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin: 0;">Network Alert - ${alertData.severity.toUpperCase()}</h2>
          </div>
          <div class="content">
            <div class="info-row">
              <span class="label">Device:</span>
              <span class="value">${device.name}</span>
            </div>
            <div class="info-row">
              <span class="label">IP Address:</span>
              <span class="value">${device.ipAddress}</span>
            </div>
            <div class="info-row">
              <span class="label">Type:</span>
              <span class="value">${device.type}</span>
            </div>
            <div class="info-row">
              <span class="label">Alert Type:</span>
              <span class="value">${alertData.type.replace(/_/g, ' ').toUpperCase()}</span>
            </div>
            <div class="info-row">
              <span class="label">Message:</span>
              <span class="value">${alertData.message}</span>
            </div>
            ${alertData.value ? `
            <div class="info-row">
              <span class="label">Current Value:</span>
              <span class="value">${alertData.value}</span>
            </div>
            ` : ''}
            ${alertData.threshold ? `
            <div class="info-row">
              <span class="label">Threshold:</span>
              <span class="value">${alertData.threshold}</span>
            </div>
            ` : ''}
            <div class="info-row">
              <span class="label">Time:</span>
              <span class="value">${new Date().toLocaleString()}</span>
            </div>
          </div>
          <div class="footer">
            <p>This is an automated alert from Smart Network Monitor</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Send Telegram alert
  async sendTelegramAlert(device, alertData) {
    if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
      logger.warn('Telegram credentials not configured. Skipping Telegram alert.');
      return false;
    }

    try {
      const message = this.generateTelegramMessage(device, alertData);
      const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;

      await axios.post(url, {
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      });

      logger.info(`Telegram alert sent for device: ${device.name}`);
      return true;
    } catch (error) {
      logger.error(`Error sending Telegram alert: ${error.message}`);
      return false;
    }
  }

  // Generate Telegram message
  generateTelegramMessage(device, alertData) {
    const severityEmojis = {
      info: 'ℹ️',
      warning: '⚠️',
      critical: '🚨'
    };

    const emoji = severityEmojis[alertData.severity] || '📢';

    let message = `${emoji} <b>Network Alert - ${alertData.severity.toUpperCase()}</b>\n\n`;
    message += `<b>Device:</b> ${device.name}\n`;
    message += `<b>IP:</b> ${device.ipAddress}\n`;
    message += `<b>Type:</b> ${device.type}\n`;
    message += `<b>Alert:</b> ${alertData.type.replace(/_/g, ' ')}\n\n`;
    message += `<b>Message:</b> ${alertData.message}\n`;

    if (alertData.value) {
      message += `<b>Value:</b> ${alertData.value}\n`;
    }
    if (alertData.threshold) {
      message += `<b>Threshold:</b> ${alertData.threshold}\n`;
    }

    message += `\n<i>${new Date().toLocaleString()}</i>`;

    return message;
  }

  // Test notifications
  async testNotifications() {
    const testDevice = {
      name: 'Test Device',
      ipAddress: '8.8.8.8',
      type: 'server'
    };

    const testAlert = {
      type: 'test_alert',
      severity: 'info',
      message: 'This is a test alert from Smart Network Monitor'
    };

    const results = {
      email: false,
      telegram: false
    };

    results.email = await this.sendEmailAlert(testDevice, testAlert);
    results.telegram = await this.sendTelegramAlert(testDevice, testAlert);

    return results;
  }
}

module.exports = new NotificationService();
