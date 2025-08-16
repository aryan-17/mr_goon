const logger = require('../../utils/logger');

class BaseStrategy {
    constructor(config = {}) {
        this.config = config;
    }

    async handle(message, chat) {
        throw new Error('Handle method must be implemented by subclass');
    }

    async shouldProcess(message, chat) {
        return true;
    }

    logMessage(message, chat) {
        logger.info('Message received', {
            chatName: chat.name || 'Direct Message',
            from: message.author || message.from,
            content: message.body.substring(0, 50),
            timestamp: new Date().toISOString()
        });
    }
}

module.exports = BaseStrategy;