    pair: {
        description: 'Get pairing information and status',
        usage: '.pair',
        execute: async (args, message, sock, isGroup, user, prefix) => {
            const sender = message.key.remoteJid;
            
            const pairText = 
`📱 *PAIRING INFORMATION*

*Current Status:* ${sock.user ? 'Connected ✅' : 'Not Connected ❌'}

*Pairing Method:* Phone Number + Code
*Prefix:* ${prefix}

*To Re-pair:*
1. Delete auth_info folder on server
2. Set WHATSAPP_NUMBER in environment
3. Restart bot
4. Check logs for new pairing code

*Note:* Pairing code is shown in server logs only
Never share your pairing code!`;

            await sock.sendMessage(sender, { text: pairText });
        }
    },
