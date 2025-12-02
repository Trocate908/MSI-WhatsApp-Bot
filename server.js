// server.js
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => res.json({status: 'MSI XMD Bot'}));
app.get('/health', (req, res) => res.send('OK'));

app.listen(port, () => {
    console.log(`Server: ${port}`);
    setTimeout(() => {
        console.log('Starting bot...');
        require('./src/bot.js');
    }, 3000);
});
