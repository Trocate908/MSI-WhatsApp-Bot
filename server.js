// server.js - For Render deployment with pairing support
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic health check endpoint
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        bot: 'MSI XMD',
        version: '2.0.0',
        platform: 'WhatsApp',
        pairing: 'Phone Number + Code',
        prefix: '.',
        message: 'Bot is running on Render - Use pairing code to connect'
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Pairing info endpoint
app.get('/pair', (req, res) => {
    res.json({
        instructions: 'Check Render logs for pairing code',
        steps: [
            '1. Open WhatsApp → Settings → Linked Devices',
            '2. Tap "Link a Device"',
            '3. Select "Link with phone number"',
            '4. Enter phone number with country code',
            '5. Enter pairing code from logs'
        ]
    });
});

// Start Express server
const server = app.listen(port, () => {
    console.log(`🌐 Web server running on port ${port}`);
    console.log(`📡 Health check: http://localhost:${port}/health`);
    console.log(`📱 Pairing info: http://localhost:${port}/pair`);
    
    // Import and start the bot
    setTimeout(() => {
        require('./src/bot.js');
    }, 1000);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

module.exports = app;