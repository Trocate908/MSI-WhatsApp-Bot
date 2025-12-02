// src/bot.js - SIMPLE FIXED VERSION
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const fs = require('fs');

async function startBot() {
    console.log('🤖 MSI XMD Bot starting...');
    
    const phone = process.env.WHATSAPP_NUMBER;
    if (!phone) {
        console.log('❌ Set WHATSAPP_NUMBER environment variable');
        console.log('👉 Format: +263715907468');
        return;
    }
    
    console.log(`📱 Phone: ${phone}`);
    
    // Create auth folder
    const authFolder = './auth_info';
    if (!fs.existsSync(authFolder)) {
        fs.mkdirSync(authFolder, { recursive: true });
    }
    
    try {
        const { state, saveCreds } = await useMultiFileAuthState(authFolder);
        const sock = makeWASocket({
            auth: state,
            printQRInTerminal: false,
        });
        
        sock.ev.on('creds.update', saveCreds);
        
        // Connection handler - SIMPLE
        sock.ev.on('connection.update', async (update) => {
            console.log(`Connection: ${update.connection}`);
            
            if (update.connection === 'open') {
                console.log('✅ WhatsApp CONNECTED!');
                console.log('⏳ Waiting 5 seconds for stable connection...');
                
                // WAIT for connection to stabilize
                setTimeout(async () => {
                    try {
                        console.log('🔢 Now requesting pairing code...');
                        const code = await sock.requestPairingCode(phone);
                        showPairingCode(code);
                    } catch (error) {
                        console.error('❌ Pairing failed:', error.message);
                        console.log('🔄 Will retry in 15 seconds...');
                        setTimeout(() => getPairingCodeWithRetry(sock, phone), 15000);
                    }
                }, 5000); // Wait 5 seconds after connection
            }
            
            if (update.connection === 'close') {
                console.log('🔌 Connection closed. Reconnecting in 10s...');
                setTimeout(startBot, 10000);
            }
        });
        
    } catch (error) {
        console.error('❌ Startup error:', error.message);
        setTimeout(startBot, 10000);
    }
}

// Helper to show pairing code
function showPairingCode(code) {
    console.log('\n' + '='.repeat(60));
    console.log('🎉 PAIRING CODE SUCCESS!');
    console.log('='.repeat(60));
    console.log('\n🔢 CODE:', code);
    console.log('\n📱 ON YOUR PHONE:');
    console.log('1. Open WhatsApp');
    console.log('2. Settings → Linked Devices → Link a Device');
    console.log('3. Select "Link with phone number"');
    console.log('4. Enter this code:', code);
    console.log('\n⏰ Code expires in a few minutes');
    console.log('='.repeat(60));
}

// Retry logic for pairing code
async function getPairingCodeWithRetry(sock, phone, attempt = 1) {
    if (attempt > 3) {
        console.log('❌ Max retries reached. Try QR code instead.');
        return;
    }
    
    try {
        console.log(`🔢 Retry ${attempt}/3: Requesting pairing code...`);
        const code = await sock.requestPairingCode(phone);
        showPairingCode(code);
    } catch (error) {
        console.error(`❌ Retry ${attempt} failed:`, error.message);
        setTimeout(() => getPairingCodeWithRetry(sock, phone, attempt + 1), 10000);
    }
}

// Start bot
startBot(); 
