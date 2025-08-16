const logger = require('./logger');

class ErrorHandler {
    constructor() {
        this.errorHandlers = new Map();
        this.defaultHandler = this.logError.bind(this);
    }

    register(errorType, handler) {
        if (typeof handler !== 'function') {
            throw new Error('Error handler must be a function');
        }
        this.errorHandlers.set(errorType, handler);
    }

    handle(error, context = {}) {
        const errorType = this.getErrorType(error);
        const handler = this.errorHandlers.get(errorType) || this.defaultHandler;

        try {
            handler(error, context);
        } catch (handlerError) {
            logger.error('Error in error handler', {
                originalError: error.message,
                handlerError: handlerError.message,
                context
            });
        }
    }

    getErrorType(error) {
        if (error.name) return error.name;
        if (error.constructor && error.constructor.name) return error.constructor.name;
        return 'Error';
    }

    logError(error, context) {
        logger.error(error.message, {
            stack: error.stack,
            ...context
        });
    }

    createError(message, code, statusCode) {
        const error = new Error(message);
        error.code = code;
        error.statusCode = statusCode;
        return error;
    }

    isOperationalError(error) {
        return error.isOperational === true;
    }

    async handleAsync(fn) {
        try {
            return await fn();
        } catch (error) {
            this.handle(error);
            throw error;
        }
    }

    wrap(fn) {
        return async (...args) => {
            try {
                return await fn(...args);
            } catch (error) {
                this.handle(error);
                throw error;
            }
        };
    }
}

class ValidationError extends Error {
    constructor(message, field) {
        super(message);
        this.name = 'ValidationError';
        this.field = field;
        this.isOperational = true;
    }
}

class AuthenticationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AuthenticationError';
        this.isOperational = true;
    }
}

class RateLimitError extends Error {
    constructor(message, retryAfter) {
        super(message);
        this.name = 'RateLimitError';
        this.retryAfter = retryAfter;
        this.isOperational = true;
    }
}

module.exports = {
    ErrorHandler: new ErrorHandler(),
    ValidationError,
    AuthenticationError,
    RateLimitError
};