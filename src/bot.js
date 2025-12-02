const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');

class MSIXMDBot {
    constructor() {
        this.sock = null;
        this.authFolder = './auth_info';
        this.prefix = '.';
        this.phoneNumber = process.env.WHATSAPP_NUMBER;
        this.isGeneratingCode = false;
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
            
            // Ensure auth folder exists
            if (!fs.existsSync(this.authFolder)) {
                fs.mkdirSync(this.authFolder, { recursive: true });
                console.log('📁 Created auth folder');
            }

            const { state, saveCreds } = await useMultiFileAuthState(this.authFolder);
            const { version } = await fetchLatestBaileysVersion();

            this.sock = makeWASocket({
                version,
                logger: pino({ level: 'silent' }),
                auth: state,
                printQRInTerminal: false,
            });

            this.sock.ev.on('creds.update', saveCreds);

            // Connection handler - FIXED
            this.sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect } = update;
                
                if (connection === 'open') {
                    console.log('✅ WhatsApp connected successfully!');
                    console.log('⚡ MSI XMD Bot is now online!');
                    
                    // Only generate code if we don't have credentials
                    if (!state.creds.me && !this.isGeneratingCode) {
                        this.isGeneratingCode = true;
                        setTimeout(() => {
                            this.generatePairingCode();
                        }, 3000); // Wait 3 seconds after connection
                    }
                }

                if (connection === 'close') {
                    const reason = lastDisconnect?.error?.output?.statusCode;
                    console.log(`🔌 Connection closed. Reason: ${reason}`);
                    
                    // Don't clean session unless explicitly logged out
                    if (reason === DisconnectReason.loggedOut) {
                        console.log('❌ Logged out. Session cleared.');
                        this.cleanupAuth();
                    }
                    
                    // Reconnect after delay
                    setTimeout(() => {
                        console.log('🔄 Reconnecting...');
                        this.init();
                    }, 5000);
                }
            });

            // Handle messages
            this.sock.ev.on('messages.upsert', (m) => {
                const msg = m.messages[0];
                if (!msg.message || msg.key.fromMe) return;
                const text = msg.message.conversation || '';
                if (text.startsWith('.')) {
                    this.handleCommand(text, msg);
                }
            });

            // Keep-alive presence
            this.setupKeepAlive();

        } catch (error) {
            console.error('❌ Bot initialization error:', error.message);
            setTimeout(() => this.init(), 10000); // Longer delay on error
        }
    }

    async generatePairingCode() {
        try {
            console.log('\n🔢 Requesting pairing code...');
            const code = await this.sock.requestPairingCode(this.phoneNumber);
            
            console.log('\n' + '='.repeat(60));
            console.log('✅ PAIRING CODE GENERATED!');
            console.log('='.repeat(60));
            console.log('\n📱 ON YOUR PHONE:');
            console.log('1. Open WhatsApp → Settings → Linked Devices');
            console.log('2. Tap "Link a Device"');
            console.log('3. Select "Link with phone number"');
            console.log('4. Enter this 6-digit code:');
            console.log('\n' + '🔢 '.repeat(6));
            console.log('      ' + this.formatPairingCode(code));
            console.log('🔢 '.repeat(6));
            console.log('\n5. Wait for confirmation...');
            console.log('💡 Code will expire in a few minutes');
            console.log('='.repeat(60));
            
        } catch (error) {
            console.error('❌ Pairing error:', error.message);
            this.isGeneratingCode = false;
            
            // If connection error, try QR as fallback
            if (error.message.includes('Connection Closed') || error.message.includes('timeout')) {
                console.log('\n🔄 Falling back to QR code...');
                this.fallbackToQR();
            }
        }
    }

    async fallbackToQR() {
        try {
            // Force QR code generation
            const qrcode = require('qrcode-terminal');
            
            // Create new socket with QR enabled
            const { state, saveCreds } = await useMultiFileAuthState(this.authFolder);
            const { version } = await fetchLatestBaileysVersion();
            
            const qrSock = makeWASocket({
                version,
                logger: pino({ level: 'silent' }),
                auth: state,
                printQRInTerminal: true,
            });

            qrSock.ev.on('creds.update', saveCreds);
            
            qrSock.ev.on('connection.update', (update) => {
                if (update.qr) {
                    console.log('\n📱 QR CODE FALLBACK:');
                    console.log('Scan this QR code instead:');
                    qrcode.generate(update.qr, { small: true });
                }
                if (update.connection === 'open') {
                    console.log('✅ Connected via QR!');
                    this.sock = qrSock; // Replace socket
                }
            });
            
        } catch (error) {
            console.error('QR fallback error:', error.message);
        }
    }

    formatPairingCode(code) {
        if (code && code.length === 6) {
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
            '.pair': `📱 Pairing: ${this.phoneNumber ? 'Phone number set' : 'Not configured'}`,
        };
        const response = commands[text] || '❌ Unknown command. Type .help for commands';
        this.sock.sendMessage(msg.key.remoteJid, { text: response });
    }

    cleanupAuth() {
        try {
            if (fs.existsSync(this.authFolder)) {
                const files = fs.readdirSync(this.authFolder);
                if (files.length > 0) {
                    fs.rmSync(this.authFolder, { recursive: true, force: true });
                    fs.mkdirSync(this.authFolder, { recursive: true });
                    console.log('🧹 Cleared old session data');
                }
            }
        } catch (error) {
            console.error('Error cleaning auth:', error);
        }
    }

    setupKeepAlive() {
        setInterval(async () => {
            if (this.sock && this.sock.user) {
                try {
                    await this.sock.sendPresenceUpdate('available');
                    console.log('💚 Heartbeat:', new Date().toLocaleTimeString());
                } catch (error) {
                    console.error('Heartbeat error:', error.message);
                }
            }
        }, 300000); // 5 minutes
    }
}

// Start the bot
const bot = new MSIXMDBot();

// Handle termination
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
    process.exit(0);
}); 
