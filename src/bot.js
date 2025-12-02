// src/bot.js - Fixed async/await error
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');

class MSIXMDBot {
    constructor() {
        this.sock = null;
        this.authFolder = './auth_info';
        this.prefix = '.';
        this.phoneNumber = process.env.WHATSAPP_NUMBER;
        this.init();
    }

    async init() {
        try {
            if (!this.phoneNumber) {
                console.log('❌ WHATSAPP_NUMBER environment variable not set');
                console.log('👉 Set it in Render environment variables');
                console.log('👉 Format: +1234567890');
                return;
            }

            console.log(`📱 Phone number set: ${this.phoneNumber}`);
            
            const { state, saveCreds } = await useMultiFileAuthState(this.authFolder);
            const { version } = await fetchLatestBaileysVersion();
            
            this.sock = makeWASocket({
                version,
                logger: pino({ level: 'silent' }),
                auth: state,
            });

            this.sock.ev.on('creds.update', saveCreds);

            this.sock.ev.on('connection.update', (update) => {
                const { connection, lastDisconnect } = update;
                
                if (connection === 'open') {
                    console.log('✅ WhatsApp connected successfully!');
                    console.log('⚡ MSI XMD Bot is now online!');
                }

                if (connection === 'close') {
                    const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
                    if (shouldReconnect) {
                        setTimeout(() => this.init(), 5000);
                    }
                }
            });

            // Generate pairing code
            if (this.phoneNumber && !state.creds.me) {
                await this.generatePairingCode();
            }

            // Handle messages
            this.sock.ev.on('messages.upsert', (m) => {
                const msg = m.messages[0];
                if (!msg.message || msg.key.fromMe) return;
                
                const text = msg.message.conversation || '';
                if (text.startsWith('.')) {
                    this.handleCommand(text, msg);
                }
            });

        } catch (error) {
            console.error('❌ Bot initialization error:', error.message);
            setTimeout(() => this.init(), 5000);
        }
    }

    async generatePairingCode() {
        try {
            console.log('\n🔢 Generating pairing code...');
            const code = await this.sock.requestPairingCode(this.phoneNumber);
            
            console.log('\n' + '='.repeat(50));
            console.log('✅ PAIRING CODE GENERATED!');
            console.log('='.repeat(50));
            console.log('\n📱 On your phone:');
            console.log('1. Open WhatsApp → Settings → Linked Devices');
            console.log('2. Tap "Link a Device"');
            console.log('3. Select "Link with phone number"');
            console.log('4. Enter this 6-digit code:');
            console.log('\n' + '🔢 '.repeat(6));
            console.log('      ' + this.formatPairingCode(code));
            console.log('🔢 '.repeat(6));
            console.log('\n5. Wait for confirmation...');
            console.log('='.repeat(50));
            
        } catch (error) {
            console.error('❌ Pairing error:', error.message);
        }
    }

    formatPairingCode(code) {
        if (code.length === 6) {
            return code.substring(0, 3) + ' ' + code.substring(3);
        }
        return code;
    }

    handleCommand(text, msg) {
        const commands = {
            '.ping': '🏓 Pong!',
            '.help': '📋 Commands: .ping .help .info .status .pair',
            '.info': '🤖 MSI XMD Bot v2.1.0 - Pairing Code System',
            '.status': '✅ Bot is online and connected',
            '.pair': `📱 Pairing: ${this.phoneNumber ? 'Phone number set' : 'Not configured'}`
        };

        const response = commands[text] || '❌ Unknown command. Type .help for commands';
        this.sock.sendMessage(msg.key.remoteJid, { text: response });
    }
}

// Start bot
const bot = new MSIXMDBot();           if (shouldReconnect) {
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
