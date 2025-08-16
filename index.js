// Required npm packages to install:
// npm install whatsapp-web.js qrcode-terminal

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// IMPORTANT: Replace this with the actual target user's WhatsApp ID
// Format: countrycode+phonenumber@c.us (e.g., '919876543210@c.us' for India +91 9876543210)
// To find a user's ID: 
// 1. Have the bot running and connected
// 2. Ask the target user to send a message in any group where the bot is present
// 3. Log message.author in the message handler to see their ID
const TARGET_USER_ID = process.env.TARGET_USER_ID;

// OPTIONAL: Specify a target group name (leave empty '' to monitor all groups)
// To find the exact group name, check the console logs when messages are sent
const TARGET_GROUP_NAME =  process.env.TARGET_GROUP_NAME // e.g., 'Family Group' or 'Work Team'

// Initialize WhatsApp client with local authentication
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// Generate QR code for authentication
client.on('qr', (qr) => {
    console.log('QR Code received, scan it with WhatsApp:');
    qrcode.generate(qr, { small: true });
});

// Client ready event
client.on('ready', () => {
    console.log('WhatsApp bot is ready!');
    console.log(`Monitoring messages from: ${TARGET_USER_ID}`);
});

// Main message handler
client.on('message', async (message) => {
    try {
        // Get the chat where the message was sent
        const chat = await message.getChat();
        
        // Check if it's a group chat
        if (chat.isGroup) {
            // LOG ALL GROUP NAMES AND MESSAGE AUTHORS TO HELP WITH CONFIGURATION
            console.log(`\n[${new Date().toLocaleTimeString()}] Message in "${chat.name}"`);
            console.log(`From: ${message.author}`);
            console.log(`Content: ${message.body}`);
            
            // Check if we should monitor this specific group (or all groups if TARGET_GROUP_NAME is empty)
            const shouldMonitorGroup = !TARGET_GROUP_NAME || chat.name === TARGET_GROUP_NAME;
            
            if (shouldMonitorGroup) {
                // Check if the message author matches our target user
                if (message.author === TARGET_USER_ID) {
                    // CRITICAL REQUIREMENT: The bot must be an admin in the group to delete messages from other users!
                    // Without admin privileges, the deletion will fail.
                    
                    console.log(`🗑️  DELETING message from ${message.author} in group ${chat.name}`);
                    console.log(`Deleted content: "${message.body}"`);
                    
                    // Wait before deleting (optional)
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    
                    // Delete the message for everyone (true = delete for all users)
                    await message.delete(true);
                    
                    console.log('✅ Message deleted successfully');
                }
            }
        }
    } catch (error) {
        console.error('Error processing message:', error);
        // Continue running even if an error occurs
    }
});

// Handle authentication failure
client.on('auth_failure', (msg) => {
    console.error('Authentication failed:', msg);
});

// Handle disconnection
client.on('disconnected', (reason) => {
    console.log('Client was disconnected:', reason);
});

// Initialize the client
client.initialize();

console.log('Starting WhatsApp bot...');