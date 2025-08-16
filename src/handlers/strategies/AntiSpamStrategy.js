const BaseStrategy = require('./BaseStrategy');
const logger = require('../../utils/logger');

class AntiSpamStrategy extends BaseStrategy {
    constructor(options = {}) {
        super(options);
        this.messageHistory = new Map();
        this.spamThreshold = options.spamThreshold || 5;
        this.timeWindow = options.timeWindow || 60000; // 1 minute
        this.similarityThreshold = options.similarityThreshold || 0.8;
    }

    async handle(message, chat) {
        try {
            this.logMessage(message, chat);

            if (await this.isSpam(message, chat)) {
                logger.warn('Spam detected', {
                    from: message.author || message.from,
                    chat: chat.name
                });
                
                await this.handleSpam(message, chat);
                return true;
            }

            this.recordMessage(message);
            return false;
        } catch (error) {
            logger.error('Error in anti-spam strategy', {
                error: error.message
            });
            return false;
        }
    }

    async isSpam(message, chat) {
        const userId = message.author || message.from;
        const now = Date.now();
        
        const userHistory = this.messageHistory.get(userId) || [];
        const recentMessages = userHistory.filter(m => now - m.timestamp < this.timeWindow);

        if (recentMessages.length >= this.spamThreshold) {
            return true;
        }

        const similarMessages = recentMessages.filter(m => 
            this.calculateSimilarity(m.content, message.body) > this.similarityThreshold
        );

        return similarMessages.length >= Math.floor(this.spamThreshold / 2);
    }

    recordMessage(message) {
        const userId = message.author || message.from;
        const userHistory = this.messageHistory.get(userId) || [];
        
        userHistory.push({
            content: message.body,
            timestamp: Date.now()
        });

        if (userHistory.length > this.spamThreshold * 2) {
            userHistory.shift();
        }

        this.messageHistory.set(userId, userHistory);
    }

    calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        const editDistance = this.levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }

    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    async handleSpam(message, chat) {
        logger.info('Handling spam message', {
            action: 'warning',
            messageId: message.id
        });
    }

    cleanup() {
        const now = Date.now();
        for (const [userId, history] of this.messageHistory.entries()) {
            const validMessages = history.filter(m => now - m.timestamp < this.timeWindow * 2);
            if (validMessages.length === 0) {
                this.messageHistory.delete(userId);
            } else {
                this.messageHistory.set(userId, validMessages);
            }
        }
    }
}

module.exports =    AntiSpamStrategy;