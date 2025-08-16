const config = require('../config');

class Logger {
    constructor() {
        this.levels = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3
        };
        this.currentLevel = this.levels[config.logLevel] || this.levels.info;
    }

    formatTimestamp() {
        return new Date().toISOString();
    }

    formatMessage(level, message, meta = {}) {
        const timestamp = this.formatTimestamp();
        const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
    }

    log(level, message, meta) {
        if (this.levels[level] <= this.currentLevel) {
            const formattedMessage = this.formatMessage(level, message, meta);
            
            if (level === 'error') {
                console.error(formattedMessage);
            } else if (level === 'warn') {
                console.warn(formattedMessage);
            } else {
                console.log(formattedMessage);
            }
        }
    }

    error(message, meta) {
        this.log('error', message, meta);
    }

    warn(message, meta) {
        this.log('warn', message, meta);
    }

    info(message, meta) {
        this.log('info', message, meta);
    }

    debug(message, meta) {
        this.log('debug', message, meta);
    }

    group(groupName) {
        console.group(groupName);
    }

    groupEnd() {
        console.groupEnd();
    }

    table(data) {
        console.table(data);
    }
}

module.exports = new Logger();