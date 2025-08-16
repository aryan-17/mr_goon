const logger = require('../utils/logger');

/**
 * Message handler that implements the Strategy pattern for processing different message types
 */
class MessageHandler {
    constructor() {
        this.strategies = new Map();
    }

    register(type, strategy) {
        if (!strategy || typeof strategy.handle !== 'function') {
            throw new Error('Strategy must have a handle method');
        }
        this.strategies.set(type, strategy);
        logger.debug(`Registered handler strategy: ${type}`);
    }

    unregister(type) {
        this.strategies.delete(type);
        logger.debug(`Unregistered handler strategy: ${type}`);
    }

    async handle(message, chat) {
        try {
            const messageType = this.determineMessageType(message, chat);
            const strategy = this.strategies.get(messageType);

            if (strategy) {
                logger.debug(`Handling message with strategy: ${messageType}`);
                return await strategy.handle(message, chat);
            }

            logger.debug('No matching strategy found for message');
            return false;
        } catch (error) {
            logger.error('Error in message handler', { error: error.message });
            throw error;
        }
    }

    determineMessageType(message, chat) {
        if (chat.isGroup) {
            return 'group';
        }
        if (message.hasMedia) {
            return 'media';
        }
        return 'direct';
    }

    getRegisteredStrategies() {
        return Array.from(this.strategies.keys());
    }
}

module.exports = MessageHandler;