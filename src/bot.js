const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { handleMessage, handleCommands } = require('./handlers');

class MSIXMDBot {
    constructor() {
        this.sock = null;
        this.authFolder = './auth_info';
        this.prefix = '.';
        this.pairingCode = null;
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        this.init();
    }

    async init() {
        try {
            require('dotenv').config();

            if (!fs.existsSync(this.authFolder)) {
                fs.mkdirSync(this.authFolder, { recursive: true });
            }

            await this.connectToWhatsApp();
        } catch (error) {
            console.error('Error initializing bot:', error);
            setTimeout(() => this.init(), 5000);
        }
    }

    async connectToWhatsApp() {
        try {
            console.clear();
            console.log('='.repeat(50));
            console.log('🤖 MSI XMD WhatsApp Bot');
            console.log('='.repeat(50));
            console.log(`⚙️  Prefix: '${this.prefix}'`);
            console.log(`🌐 Hosting: Render`);
            console.log('='.repeat(50) + '\n');

            const { state, saveCreds } = await useMultiFileAuthState(this.authFolder);
            const { version } = await fetchLatestBaileysVersion();
            
            this.sock = makeWASocket({
                version,
                logger: pino({ level: 'silent' }),
                printQRInTerminal: false,
                auth: state,
                browser: Browsers.macOS('Chrome'),
                generateHighQualityLinkPreview: true,
                syncFullHistory: false,
                markOnlineOnConnect: false,
                // Enable phone connection (pairing code)
                phoneResponseTime: 60000,
            });

            this.sock.ev.on('creds.update', saveCreds);

            // Handle connection events
            this.sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr, isNewLogin } = update;
                
                if (qr) {
                    console.log('\n⚠️  QR code detected, but we want pairing code instead.');
                    console.log('Attempting to generate pairing code...\n');
                    
                    // Request phone number for pairing code
                    await this.requestPhoneNumber();
                }

                if (connection === 'open') {
                    console.log('\n✅ Bot connected successfully!');
                    console.log('⚡ MSI XMD is now online!');
                    console.log(`🔧 Prefix: '${this.prefix}'`);
                    this.showHelp();
                    this.setupKeepAlive();
                }

                if (connection === 'close') {
                    const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
                    console.log('\n🔌 Connection closed. Reconnecting...');
                    if (shouldReconnect) {
                        setTimeout(() => this.connectToWhatsApp(), 5000);
                    } else {
                        console.log('❌ Logged out. Please re-pair your WhatsApp.');
                        this.cleanupAuth();
                        setTimeout(() => this.connectToWhatsApp(), 5000);
                    }
                }
            });

            // Listen for pairing code request
            this.sock.ev.on('connection.update', async (update) => {
                if (update.requestPhoneNumber) {
                    await this.requestPhoneNumber();
                }
            });

            // Handle incoming messages
            this.sock.ev.on('messages.upsert', async (m) => {
                const message = m.messages[0];
                
                if (!message.message || message.key.fromMe) return;

                try {
                    await handleMessage(message, this.sock, this.prefix);
                    await handleCommands(message, this.sock, this.prefix);
                } catch (error) {
                    console.error('Error handling message:', error);
                }
            });

            // Check if we need to request pairing on startup
            if (!state.creds.me) {
                console.log('\n📱 No existing session found.');
                console.log('Generating pairing code...\n');
                setTimeout(() => this.requestPhoneNumber(), 1000);
            }

        } catch (error) {
            console.error('Error connecting to WhatsApp:', error);
            setTimeout(() => this.connectToWhatsApp(), 10000);
        }
    }

    async requestPhoneNumber() {
        try {
            console.log('\n' + '='.repeat(50));
            console.log('📱 WHATSAPP PAIRING CODE');
            console.log('='.repeat(50));
            console.log('\nFollow these steps:');
            console.log('1. Open WhatsApp on your phone');
            console.log('2. Go to Settings → Linked Devices');
            console.log('3. Tap on "Link a Device"');
            console.log('4. Select "Link with phone number"');
            console.log('5. Enter your phone number with country code');
            console.log('   Example: +1234567890');
            console.log('\n' + '='.repeat(50));
            
            // Generate pairing code using Baileys method
            const code = await this.generatePairingCode();
            
            if (code) {
                console.log('\n🎉 Pairing successful!');
                console.log('✅ WhatsApp is now connected.');
            }
            
        } catch (error) {
            console.error('Error in pairing process:', error);
            console.log('\n🔄 Retrying pairing in 10 seconds...');
            setTimeout(() => this.requestPhoneNumber(), 10000);
        }
    }

    async generatePairingCode() {
        return new Promise((resolve, reject) => {
            console.log('\n📞 Please enter your WhatsApp phone number:');
            console.log('Format: +[country code][phone number]');
            console.log('Example: +1234567890 or +919876543210');
            console.log('\nEnter phone number:');
            
            this.rl.question('> ', async (phoneNumber) => {
                try {
                    if (!phoneNumber.startsWith('+')) {
                        console.log('❌ Phone number must start with +');
                        return resolve(null);
                    }

                    console.log('\n⏳ Generating pairing code for', phoneNumber, '...');
                    
                    // Request pairing code
                    const code = await this.sock.requestPairingCode(phoneNumber);
                    
                    console.log('\n' + '='.repeat(50));
                    console.log('✅ PAIRING CODE GENERATED!');
                    console.log('='.repeat(50));
                    console.log('\n📱 On your phone:');
                    console.log('1. Open WhatsApp → Settings → Linked Devices');
                    console.log('2. Tap "Link a Device"');
                    console.log('3. Select "Link with phone number"');
                    console.log('4. Enter this code:');
                    console.log('\n' + '🔢 '.repeat(6));
                    console.log('      ' + code.match(/.{1,3}/g).join(' '));
                    console.log('🔢 '.repeat(6));
                    console.log('\n5. Wait for confirmation...');
                    console.log('='.repeat(50));
                    
                    resolve(code);
                } catch (error) {
                    console.error('❌ Error generating pairing code:', error.message);
                    console.log('\n🔄 Please try again...');
                    resolve(null);
                }
            });
        });
    }

    cleanupAuth() {
        try {
            if (fs.existsSync(this.authFolder)) {
                fs.rmSync(this.authFolder, { recursive: true, force: true });
                fs.mkdirSync(this.authFolder, { recursive: true });
                console.log('🧹 Cleared old session data');
            }
        } catch (error) {
            console.error('Error cleaning auth:', error);
        }
    }

    showHelp() {
        console.log('\n📋 Available Commands:');
        console.log('─────────────────────');
        console.log('.help    - Show all commands');
        console.log('.ping    - Check if bot is alive');
        console.log('.info    - Get bot information');
        console.log('.time    - Get current time');
        console.log('.echo    - Repeat your text');
        console.log('.group   - Get group information');
        console.log('.about   - About this bot');
        console.log('.status  - Check bot status');
        console.log('.pair    - Get pairing info');
        console.log('─────────────────────\n');
    }

    setupKeepAlive() {
        // Send periodic presence updates
        setInterval(async () => {
            if (this.sock && this.sock.user) {
                try {
                    await this.sock.sendPresenceUpdate('available');
                    console.log('💚 Heartbeat:', new Date().toISOString());
                } catch (error) {
                    console.error('Heartbeat error:', error.message);
                }
            }
        }, 60000);
    }

    async sendMessage(jid, text, options = {}) {
        try {
            await this.sock.sendMessage(jid, { text, ...options });
        } catch (error) {
            console.error('Error sending message:', error);
        }
    }
}

// Start the bot
const bot = new MSIXMDBot();

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down MSI XMD bot...');
    if (bot.rl) bot.rl.close();
    process.exit(0);
});

// Keep process alive
setInterval(() => {
    if (bot.sock && bot.sock.user) {
        console.log('💚 Bot is alive:', new Date().toLocaleTimeString());
    }
}, 300000); // Log every 5 minutes

module.exports = { MSIXMDBot };