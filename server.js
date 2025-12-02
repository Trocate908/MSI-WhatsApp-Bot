// server.js - Super simple
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => res.json({ status: 'MSI XMD Bot' }));
app.get('/health', (req, res) => res.send('OK'));

app.listen(port, () => {
    console.log(`✅ Server on port ${port}`);
    require('./src/bot.js');
});app.listen(port, '0.0.0.0', () => {
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

// Export for testing
module.exports = app;    console.log(`🤖 Pair info: http://0.0.0.0:${port}/pair`);
    
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
