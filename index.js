
const logger = require('./src/utils/logger');
const config = require('./src/config');
const WhatsAppClient = require('./src/services/WhatsAppClient');
const MessageHandler = require('./src/handlers/MessageHandler');
const SelfModerationStrategy = require('./src/handlers/strategies/SelfModerationStrategy');
const AntiSpamStrategy = require('./src/handlers/strategies/AntiSpamStrategy');

class Application {
    constructor() {
        this.client = null;
        this.messageHandler = null;
        this.isShuttingDown = false;
    }

    async start() {
        try {
            logger.info('Starting WhatsApp Bot Application...');
            
            this.setupProcessHandlers();
            this.initializeComponents();
            this.setupMessageHandlers();
            
            this.client.initialize();
            
        } catch (error) {
            logger.error('Failed to start application', { error: error.message });
            process.exit(1);
        }
    }

    initializeComponents() {
        this.client = new WhatsAppClient({
            maxReconnectAttempts: 5,
            reconnectDelay: 5000
        });

        this.messageHandler = new MessageHandler();

        this.setupClientEventHandlers();
    }

    setupClientEventHandlers() {
        this.client.on('ready', () => {
            logger.info('Bot is ready and operational', {
                targetUserId: config.targetUserId,
                targetGroup: config.targetGroupName || 'All groups'
            });
        });

        this.client.on('authenticated', () => {
            logger.info('Authentication successful');
        });

        this.client.on('auth_failure', (msg) => {
            logger.error('Authentication failed', { message: msg });
            this.shutdown(1);
        });

        this.client.on('disconnected', (reason) => {
            logger.warn('Client disconnected', { reason });
        });

        this.client.on('max_reconnect_failed', () => {
            logger.error('Maximum reconnection attempts exceeded');
            this.shutdown(1);
        });

        this.client.on('error', (error) => {
            logger.error('Client error', { error: error.message });
        });
    }

    setupMessageHandlers() {
        const selfModerationStrategy = new SelfModerationStrategy({
            deleteDelay: config.messageDeleteDelay,
            targetUserId: config.targetUserId
        });

        const antiSpamStrategy = new AntiSpamStrategy({
            spamThreshold: 5,
            timeWindow: 60000,
            similarityThreshold: 0.8
        });

        this.messageHandler.register('group', selfModerationStrategy);
        this.messageHandler.register('spam', antiSpamStrategy);

        this.client.addMessageHandler(async (message, chat) => {
            await this.messageHandler.handle(message, chat);
        });

        setInterval(() => {
            if (antiSpamStrategy.cleanup) {
                antiSpamStrategy.cleanup();
            }
        }, 300000); // Cleanup every 5 minutes
    }

    setupProcessHandlers() {
        process.on('SIGINT', () => this.shutdown(0));
        process.on('SIGTERM', () => this.shutdown(0));
        process.on('uncaughtException', (error) => {
            logger.error('Uncaught exception', { error: error.message, stack: error.stack });
            this.shutdown(1);
        });
        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled rejection', { reason, promise });
        });
    }

    async shutdown(exitCode = 0) {
        if (this.isShuttingDown) {
            return;
        }

        this.isShuttingDown = true;
        logger.info('Shutting down application...');

        try {
            if (this.client) {
                await this.client.logout();
                await this.client.destroy();
            }
            
            logger.info('Application shutdown complete');
            process.exit(exitCode);
        } catch (error) {
            logger.error('Error during shutdown', { error: error.message });
            process.exit(1);
        }
    }
}

const app = new Application();
app.start();