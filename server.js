// server.js
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.json({
        status: 'online',
        bot: 'MSI XMD',
        version: '2.1.0',
        pairing: 'Phone Number + Code',
        instruction: 'Pairing code appears in logs'
    });
});

app.get('/health', (req, res) => {
    res.send('OK');
});

app.get('/debug', (req, res) => {
    res.json({
        whatsapp_number_set: !!process.env.WHATSAPP_NUMBER,
        node_version: process.version,
        uptime: process.uptime()
    });
});

// Start with longer delay
app.listen(port, () => {
    console.log(`🚀 Server started on port ${port}`);
    console.log('⏳ Waiting 5 seconds before starting bot...');
    
    setTimeout(() => {
        console.log('🤖 Starting WhatsApp bot...');
        try {
            require('./src/bot.js');
        } catch (error) {
            console.error('Failed to start bot:', error.message);
        }
    }, 5000);
});
