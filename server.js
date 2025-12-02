// server.js - Fixed syntax with pairing code
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        bot: 'MSI XMD',
        version: '2.1.0',
        pairing: 'Phone Number + Code',
        prefix: '.',
        instruction: 'Set WHATSAPP_NUMBER in environment variables'
    });
});

app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString() 
    });
});

app.get('/pair', (req, res) => {
    const phoneSet = !!process.env.WHATSAPP_NUMBER;
    res.json({
        pairing_ready: phoneSet,
        instruction: phoneSet ? 
            'Check logs for pairing code' : 
            'Set WHATSAPP_NUMBER environment variable',
        format: '+[country code][phone number]',
        example: '+263715907468'
    });
});

// Start server
const server = app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Server started on port ${port}`);
    console.log(`📡 Health: http://0.0.0.0:${port}/health`);
    console.log(`🤖 Pair info: http://0.0.0.0:${port}/pair`);
    
    // Start bot
    setTimeout(() => {
        console.log('🤖 Starting WhatsApp bot...');
        console.log('💡 Make sure WHATSAPP_NUMBER is set in environment');
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
