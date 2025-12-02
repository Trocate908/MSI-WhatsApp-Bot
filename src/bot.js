// src/bot.js - Unified & Fixed
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');

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
                    } else {
                        console.log('❌ Logged out. Please re-pair your WhatsApp.');
                        this.cleanupAuth();
                        setTimeout(() => this.init(), 5000);
                    }
                }
            });

            // Generate pairing code if needed
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

            // Keep-alive presence
            this.setupKeepAlive();

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
                fs.rmSync(this.authFolder, { recursive: true, force: true });
                fs.mkdirSync(this.authFolder, { recursive: true });
                console.log('🧹 Cleared old session data');
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
    process.exit(0);
});

// Keep process alive
setInterval(() => {
    if (bot.sock && bot.sock.user) {
        console.log('💚 Bot is alive:', new Date().toLocaleTimeString());
    }
}, 300000); // Log every 5 minutes

module.exports = { MSIXMDBot };
