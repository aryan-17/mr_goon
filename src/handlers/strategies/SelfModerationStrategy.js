const BaseStrategy = require('./BaseStrategy');
const logger = require('../../utils/logger');
const config = require('../../config');

class SelfModerationStrategy extends BaseStrategy {
    constructor(options = {}) {
        super(options);
        this.deleteDelay = options.deleteDelay || config.messageDeleteDelay;
        this.targetUserId = options.targetUserId || config.targetUserId;
    }

    async handle(message, chat) {
        try {
            this.logMessage(message, chat);

            if (!await this.shouldProcess(message, chat)) {
                return false;
            }

            if (this.isOwnMessage(message)) {
                await this.scheduleDeletion(message);
                return true;
            }

            return false;
        } catch (error) {
            logger.error('Error in self-moderation strategy', { 
                error: error.message,
                messageId: message.id 
            });
            return false;
        }
    }

    async shouldProcess(message, chat) {
        const targetGroup = config.targetGroupName;
        
        if (targetGroup && chat.name !== targetGroup) {
            logger.debug('Skipping - not target group', { 
                currentGroup: chat.name,
                targetGroup 
            });
            return false;
        }

        return true;
    }

    isOwnMessage(message) {
        return message.author === this.targetUserId || message.from === this.targetUserId;
    }

    async scheduleDeletion(message) {
        logger.info(`Scheduling deletion in ${this.deleteDelay}ms`, {
            messageId: message.id
        });

        setTimeout(async () => {
            try {
                await message.delete(true);
                logger.info('Message deleted successfully', {
                    messageId: message.id
                });
            } catch (error) {
                logger.error('Failed to delete message', {
                    error: error.message,
                    messageId: message.id
                });
            }
        }, this.deleteDelay);
    }
}

module.exports = SelfModerationStrategy;