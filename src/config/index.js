const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

class Config {
    constructor() {
        this.validateRequiredEnvVars();
    }

    validateRequiredEnvVars() {
        const required = ['TARGET_USER_ID'];
        const missing = required.filter(key => !process.env[key]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
        }
    }

    get targetUserId() {
        return process.env.TARGET_USER_ID;
    }

    get targetGroupName() {
        return process.env.TARGET_GROUP_NAME || null;
    }

    get messageDeleteDelay() {
        return parseInt(process.env.MESSAGE_DELETE_DELAY || '5000', 10);
    }

    get puppeteerConfig() {
        return {
            headless: process.env.PUPPETEER_HEADLESS !== 'false',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        };
    }

    get logLevel() {
        return process.env.LOG_LEVEL || 'info';
    }

    get isDevelopment() {
        return process.env.NODE_ENV === 'development';
    }

    get isProduction() {
        return process.env.NODE_ENV === 'production';
    }
}

module.exports = new Config();