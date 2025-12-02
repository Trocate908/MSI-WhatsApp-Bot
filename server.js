const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        bot: 'MSI XMD',
        version: '2.0.0',
        pairing: 'Phone Number + Code',
        prefix: '.',
        instruction: 'Set WHATSAPP_NUMBER in environment variables'
    });
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/pair', (req, res) => {
    const phoneSet = !!process.env.WHATSAPP_NUMBER;
    res.json({
        pairing_ready: phoneSet,
        instruction: phoneSet ? 
            'Check logs for pairing code' : 
            'Set WHATSAPP_NUMBER environment variable',
        format: '+[country code][phone number]',
        example: '+1234567890'
    });
});

// Start server
app.listen(port, '0.0.0.0', () => {
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

module.exports = app;            '5. Enter pairing code from logs'
        
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
