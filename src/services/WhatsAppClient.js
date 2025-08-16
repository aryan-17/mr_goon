const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const logger = require('../utils/logger');
const config = require('../config');
const EventEmitter = require('events');

/**
 * WhatsApp client wrapper that extends EventEmitter for better event handling
 * @extends EventEmitter
 */
class WhatsAppClient extends EventEmitter {
    /**
     * @param {Object} options - Configuration options
     * @param {number} [options.maxReconnectAttempts=5] - Maximum reconnection attempts
     * @param {number} [options.reconnectDelay=5000] - Delay between reconnection attempts in ms
     */
    constructor(options = {}) {
        super();
        this.client = null;
        this.isReady = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = options.maxReconnectAttempts || 5;
        this.reconnectDelay = options.reconnectDelay || 5000;
        this.messageHandlers = [];
    }

    initialize() {
        try {
            logger.info('Initializing WhatsApp client...');
            
            this.client = new Client({
                authStrategy: new LocalAuth(),
                puppeteer: config.puppeteerConfig
            });

            this.setupEventListeners();
            this.client.initialize();
            
            return this;
        } catch (error) {
            logger.error('Failed to initialize client', { error: error.message });
            throw error;
        }
    }

    setupEventListeners() {
        this.client.on('qr', this.handleQR.bind(this));
        this.client.on('ready', this.handleReady.bind(this));
        this.client.on('message', this.handleMessage.bind(this));
        this.client.on('auth_failure', this.handleAuthFailure.bind(this));
        this.client.on('disconnected', this.handleDisconnected.bind(this));
        this.client.on('loading_screen', this.handleLoadingScreen.bind(this));
        this.client.on('authenticated', this.handleAuthenticated.bind(this));
    }

    handleQR(qr) {
        logger.info('QR Code received, scan with WhatsApp');
        qrcode.generate(qr, { small: true });
        this.emit('qr', qr);
    }

    handleReady() {
        this.isReady = true;
        this.reconnectAttempts = 0;
        logger.info('WhatsApp client is ready!');
        this.emit('ready');
    }

    async handleMessage(message) {
        try {
            const chat = await message.getChat();
            
            logger.debug('Message received', {
                type: chat.isGroup ? 'group' : 'direct',
                from: message.author || message.from
            });

            this.emit('message', message, chat);
            
            for (const handler of this.messageHandlers) {
                await handler(message, chat);
            }
        } catch (error) {
            logger.error('Error processing message', { error: error.message });
            this.emit('error', error);
        }
    }

    handleAuthFailure(message) {
        logger.error('Authentication failed', { message });
        this.emit('auth_failure', message);
    }

    handleDisconnected(reason) {
        this.isReady = false;
        logger.warn('Client disconnected', { reason });
        this.emit('disconnected', reason);
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
        } else {
            logger.error('Max reconnection attempts reached');
            this.emit('max_reconnect_failed');
        }
    }

    handleLoadingScreen(percent, message) {
        logger.debug('Loading screen', { percent, message });
        this.emit('loading_screen', percent, message);
    }

    handleAuthenticated() {
        logger.info('Client authenticated successfully');
        this.emit('authenticated');
    }

    scheduleReconnect() {
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * this.reconnectAttempts;
        
        logger.info(`Scheduling reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
        
        setTimeout(() => {
            logger.info('Attempting to reconnect...');
            this.initialize();
        }, delay);
    }

    addMessageHandler(handler) {
        if (typeof handler !== 'function') {
            throw new Error('Message handler must be a function');
        }
        this.messageHandlers.push(handler);
        logger.debug('Message handler added');
    }

    removeMessageHandler(handler) {
        const index = this.messageHandlers.indexOf(handler);
        if (index > -1) {
            this.messageHandlers.splice(index, 1);
            logger.debug('Message handler removed');
        }
    }

    async sendMessage(chatId, content, options = {}) {
        if (!this.isReady) {
            throw new Error('Client is not ready');
        }

        try {
            const message = await this.client.sendMessage(chatId, content, options);
            logger.info('Message sent', { chatId, messageId: message.id });
            return message;
        } catch (error) {
            logger.error('Failed to send message', { error: error.message, chatId });
            throw error;
        }
    }

    async getChats() {
        if (!this.isReady) {
            throw new Error('Client is not ready');
        }

        try {
            const chats = await this.client.getChats();
            return chats;
        } catch (error) {
            logger.error('Failed to get chats', { error: error.message });
            throw error;
        }
    }

    async getChatById(chatId) {
        if (!this.isReady) {
            throw new Error('Client is not ready');
        }

        try {
            const chat = await this.client.getChatById(chatId);
            return chat;
        } catch (error) {
            logger.error('Failed to get chat', { error: error.message, chatId });
            throw error;
        }
    }

    async logout() {
        try {
            if (this.client) {
                await this.client.logout();
                logger.info('Client logged out successfully');
            }
        } catch (error) {
            logger.error('Error during logout', { error: error.message });
            throw error;
        }
    }

    async destroy() {
        try {
            if (this.client) {
                await this.client.destroy();
                logger.info('Client destroyed successfully');
            }
        } catch (error) {
            logger.error('Error destroying client', { error: error.message });
            throw error;
        }
    }

    getState() {
        return {
            isReady: this.isReady,
            reconnectAttempts: this.reconnectAttempts,
            handlersCount: this.messageHandlers.length
        };
    }
}

module.exports = WhatsAppClient;