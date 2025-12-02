    pair: {
        description: 'Get pairing information',
        usage: '.pair',
        execute: async (args, message, sock, isGroup, user, prefix) => {
            const sender = message.key.remoteJid;
            
            const pairText = 
`📱 *PAIRING INFORMATION*

To pair your WhatsApp:
1. Open WhatsApp → Settings → Linked Devices
2. Tap "Link a Device"
3. Select "Link with phone number"
4. Enter your phone number with country code
5. Enter the pairing code shown in logs

🔧 *Current Status:*
• Bot is using pairing code system
• Session is ${sock.user ? 'connected ✅' : 'disconnected ❌'}
• Prefix: ${prefix}

💡 *Note:* Pairing code is generated in console/logs
⚠️ *Warning:* Never share your pairing code!`;
            
            await sock.sendMessage(sender, { text: pairText });
        }
    },