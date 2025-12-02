// server.js - Works with pairing code + your exact bot file name
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Root status endpoint
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        bot: 'MSI XMD',
        version: '2.1.0',
        pairing: 'Phone Number + Pairing Code',
        prefix: '.',
        instruction: 'Set WHATSAPP_NUMBER environment variable correctly'
    });
});

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString() 
    });
});

// Pairing info endpoint
app.get('/pair', (req, res) => {
    const phoneSet = !!process.env.WHATSAPP_NUMBER;

    res.json({
        pairing_ready: phoneSet,
        instruction: phoneSet
            ? 'Check your logs for the latest pairing code'
            : 'Set WHATSAPP_NUMBER in your environment variables',
        expected_format: '+2637XXXXXXX',
        example: '+263715907468'
    });
});

// Start server
const server = app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Server started successfully on port ${port}`);
    console.log(`📡 Health: http://0.0.0.0:${port}/health`);
    console.log(`🔑 Pairing Info: http://0.0.0.0:${port}/pair`);

    // Start WhatsApp bot after short delay
    setTimeout(() => {
        console.log('🤖 Initializing WhatsApp bot...');
        console.log('💡 Make sure WHATSAPP_NUMBER is set (e.g., +263715907468)');

        // IMPORTANT: Using your exact file name as requested
        require('./src/bot.js');

    }, 1200); // slight delay to prevent boot conflicts
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('⚠️ SIGTERM received — shutting down gracefully...');
    server.close(() => {
        console.log('✔️ Server closed');
        process.exit(0);
    });
});

module.exports = app;
