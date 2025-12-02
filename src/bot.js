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
                return;
            }

            console.log(`📱 Phone number loaded: ${this.phoneNumber}`);

            const { state, saveCreds } = await useMultiFileAuthState(this.authFolder);
            const { version } = await fetchLatestBaileysVersion();

            this.sock = makeWASocket({
                version,
                logger: pino({ level: 'silent' }),
                auth: state,

                // REQUIRED for pairing on NEW Baileys
                browser: ["Desktop", "Chrome", "10.0"],

                // Prevent huge history sync that crashes pairing
                syncFullHistory: false,
            });

            this.sock.ev.on('creds.update', saveCreds);

            // Connection handler
            this.sock.ev.on('connection.update', (update) => {
                const { connection, lastDisconnect } = update;

                if (connection === 'open') {
                    console.log('✅ WhatsApp connected successfully!');
                }

                if (connection === 'close') {
                    const reason = lastDisconnect?.error?.output?.statusCode;

                    if (reason === DisconnectReason.loggedOut) {
                        console.log('❌ Logged out. Clearing session and retrying in 10 seconds...');
                        this.cleanupAuth();
                        return setTimeout(() => this.init(), 10000);
                    }

                    console.log('🔄 Connection closed. Retrying in 6 seconds...');
                    return setTimeout(() => this.init(), 6000);
                }
            });

            // Generate pairing code only if needed
            if (this.phoneNumber && !state.creds.me) {
                await this.generatePairingCode();
            }

            // Message handler
            this.sock.ev.on('messages.upsert', (m) => {
                const msg = m.messages[0];
                if (!msg.message || msg.key.fromMe) return;

                const text = msg.message.conversation || '';
                if (text.startsWith(this.prefix)) {
                    this.handleCommand(text, msg);
                }
            });

            this.setupKeepAlive();

        } catch (err) {
            console.log("❌ Initialization error:", err.message);
            setTimeout(() => this.init(), 8000);
        }
    }

    async generatePairingCode() {
        try {
            console.log('🔢 Generating pairing code...');

            const code = await this.sock.requestPairingCode(this.phoneNumber);

            // Delay improves pairing reliability
            await new Promise(r => setTimeout(r, 2000));

            console.log('\n==============================================');
            console.log('✅  PAIRING CODE GENERATED');
            console.log('==============================================');
            console.log('Enter this code on your WhatsApp:');
            console.log(`🔑  ${this.formatPairingCode(code)}`);
            console.log('==============================================\n');

        } catch (err) {
            console.log("❌ Pairing error:", err.message);
        }
    }

    formatPairingCode(code) {
        return code?.length === 6 ? code.slice(0, 3) + ' ' + code.slice(3) : code;
    }

    handleCommand(text, msg) {
        const commands = {
            '.ping': '🏓 Pong!',
            '.help': '📋 Commands: .ping .help .info .status .pair',
            '.info': '🤖 MSI XMD Bot v2.2.0 (Desktop Pairing Supported)',
            '.status': '✅ Bot is online',
            '.pair': `📱 Phone Number: ${this.phoneNumber}`,
        };

        const reply = commands[text] || '❌ Unknown command';
        this.sock.sendMessage(msg.key.remoteJid, { text: reply });
    }

    cleanupAuth() {
        if (fs.existsSync(this.authFolder)) {
            fs.rmSync(this.authFolder, { recursive: true, force: true });
            fs.mkdirSync(this.authFolder, { recursive: true });
            console.log('🧹 Old session removed.');
        }
    }

    setupKeepAlive() {
        setInterval(async () => {
            if (this.sock && this.sock.user) {
                try {
                    await this.sock.sendPresenceUpdate('available');
                    console.log('💚 Heartbeat:', new Date().toISOString());
                } catch (err) {
                    console.log('Heartbeat error:', err.message);
                }
            }
        }, 60000);
    }
}

const bot = new MSIXMDBot();

process.on('SIGINT', () => {
    console.log("\n🛑 Bot shutting down...");
    process.exit(0);
});

setInterval(() => {
    if (bot.sock && bot.sock.user)
        console.log("💚 Bot alive:", new Date().toLocaleTimeString());
}, 300000);

module.exports = { MSIXMDBot };
