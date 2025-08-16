
require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { log } = require('console');

const TARGET_USER_ID = process.env.TARGET_USER_ID;


const TARGET_GROUP_NAME =  process.env.TARGET_GROUP_NAME

// Initialize WhatsApp client with local authentication
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', (qr) => {
    console.log('QR Code received, scan it with WhatsApp:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('WhatsApp bot is ready!');
    console.log(`Monitoring messages from: ${TARGET_USER_ID}`);
});

client.on('message', async (message) => {
    try {
        const chat = await message.getChat();
        
        if (chat.isGroup) {
            console.log(`\n[${new Date().toLocaleTimeString()}] Message in "${chat.name}"`);
            console.log(`From: ${message.author}`);
            console.log(`Content: ${message.body}`);
            
            const shouldMonitorGroup = !TARGET_GROUP_NAME || chat.name === TARGET_GROUP_NAME;
            
            if (shouldMonitorGroup) {
                if (message.author === TARGET_USER_ID) {
                    
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    
                    await message.delete(true);
                    
                    console.log('✅ Message deleted successfully');
                }
            }
        }
    } catch (error) {
        console.error('Error processing message:', error);
    }
});

client.on('auth_failure', (msg) => {
    console.error('Authentication failed:', msg);
});

client.on('disconnected', (reason) => {
    console.log('Client was disconnected:', reason);
});

client.initialize();

console.log('Starting WhatsApp bot...');