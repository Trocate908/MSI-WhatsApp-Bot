#!/usr/bin/env node
/**
 * Standalone pairing script for MSI XMD bot
 * Use this to generate pairing code manually
 */

const { default: makeWASocket, useMultiFileAuthState, Browsers, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const readline = require('readline');

async function generatePairingCode() {
    console.clear();
    console.log('='.repeat(60));
    console.log('🤖 MSI XMD - WHATSAPP PAIRING CODE GENERATOR');
    console.log('='.repeat(60));
    
    const authFolder = './auth_info_pairing';
    if (!fs.existsSync(authFolder)) {
        fs.mkdirSync(authFolder, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(authFolder);
    const { version } = await fetchLatestBaileysVersion();
    
    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        auth: state,
        browser: Browsers.macOS('Chrome'),
        printQRInTerminal: false,
    });

    sock.ev.on('creds.update', saveCreds);

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        sock.ev.on('connection.update', async (update) => {
            const { connection, qr } = update;
            
            if (qr) {
                console.log('\n⚠️  QR code detected, requesting pairing code instead...\n');
                await requestPhoneInput();
            }
            
            if (connection === 'open') {
                console.log('\n✅ Successfully paired!');
                console.log('🤖 Bot is now connected to WhatsApp.');
                console.log('\n💡 Copy the auth_info_pairing folder contents to your main bot.');
                rl.close();
                process.exit(0);
            }
        });

        async function requestPhoneInput() {
            console.log('\n📱 WHATSAPP PAIRING');
            console.log('='.repeat(40));
            console.log('\nEnter your WhatsApp phone number:');
            console.log('Format: +[country code][phone number]');
            console.log('Example: +12345678900');
            console.log('\n' + '='.repeat(40));
            
            rl.question('\nPhone number: ', async (phoneNumber) => {
                if (!phoneNumber.startsWith('+')) {
                    console.log('❌ Phone number must start with +');
                    return requestPhoneInput();
                }

                try {
                    console.log('\n⏳ Generating pairing code...');
                    const code = await sock.requestPairingCode(phoneNumber.trim());
                    
                    console.log('\n' + '='.repeat(50));
                    console.log('✅ PAIRING CODE GENERATED!');
                    console.log('='.repeat(50));
                    console.log('\n📱 On your phone:');
                    console.log('1. Open WhatsApp → Settings → Linked Devices');
                    console.log('2. Tap "Link a Device"');
                    console.log('3. Select "Link with phone number"');
                    console.log('4. Enter this 6-digit code:');
                    console.log('\n' + '🔢 '.repeat(6));
                    console.log('       ' + code.match(/.{1,3}/g).join(' '));
                    console.log('🔢 '.repeat(6));
                    console.log('\n5. Wait for confirmation...');
                    console.log('='.repeat(50));
                    console.log('\n⏳ Waiting for you to enter the code on your phone...');
                    
                } catch (error) {
                    console.error('❌ Error:', error.message);
                    console.log('\n🔄 Please try again...');
                    requestPhoneInput();
                }
            });
        }

        // Start the process
        console.log('\n🔄 Initializing pairing system...\n');
        setTimeout(() => {
            if (!state.creds.me) {
                requestPhoneInput();
            }
        }, 2000);
    });
}

// Run the pairing script
generatePairingCode().catch(console.error);