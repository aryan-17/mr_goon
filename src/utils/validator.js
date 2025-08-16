const { ValidationError } = require('./errorHandler');

class Validator {
    static validateRequired(value, fieldName) {
        if (value === undefined || value === null || value === '') {
            throw new ValidationError(`${fieldName} is required`, fieldName);
        }
        return true;
    }

    static validateString(value, fieldName, options = {}) {
        if (typeof value !== 'string') {
            throw new ValidationError(`${fieldName} must be a string`, fieldName);
        }

        if (options.minLength && value.length < options.minLength) {
            throw new ValidationError(
                `${fieldName} must be at least ${options.minLength} characters long`,
                fieldName
            );
        }

        if (options.maxLength && value.length > options.maxLength) {
            throw new ValidationError(
                `${fieldName} must not exceed ${options.maxLength} characters`,
                fieldName
            );
        }

        if (options.pattern && !options.pattern.test(value)) {
            throw new ValidationError(
                `${fieldName} has invalid format`,
                fieldName
            );
        }

        return true;
    }

    static validateNumber(value, fieldName, options = {}) {
        const num = Number(value);
        
        if (isNaN(num)) {
            throw new ValidationError(`${fieldName} must be a number`, fieldName);
        }

        if (options.min !== undefined && num < options.min) {
            throw new ValidationError(
                `${fieldName} must be at least ${options.min}`,
                fieldName
            );
        }

        if (options.max !== undefined && num > options.max) {
            throw new ValidationError(
                `${fieldName} must not exceed ${options.max}`,
                fieldName
            );
        }

        if (options.integer && !Number.isInteger(num)) {
            throw new ValidationError(
                `${fieldName} must be an integer`,
                fieldName
            );
        }

        return true;
    }

    static validateArray(value, fieldName, options = {}) {
        if (!Array.isArray(value)) {
            throw new ValidationError(`${fieldName} must be an array`, fieldName);
        }

        if (options.minLength && value.length < options.minLength) {
            throw new ValidationError(
                `${fieldName} must contain at least ${options.minLength} items`,
                fieldName
            );
        }

        if (options.maxLength && value.length > options.maxLength) {
            throw new ValidationError(
                `${fieldName} must not contain more than ${options.maxLength} items`,
                fieldName
            );
        }

        if (options.itemValidator) {
            value.forEach((item, index) => {
                try {
                    options.itemValidator(item, `${fieldName}[${index}]`);
                } catch (error) {
                    throw new ValidationError(
                        `Invalid item at ${fieldName}[${index}]: ${error.message}`,
                        fieldName
                    );
                }
            });
        }

        return true;
    }

    static validateObject(value, fieldName, schema = {}) {
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
            throw new ValidationError(`${fieldName} must be an object`, fieldName);
        }

        for (const [key, validator] of Object.entries(schema)) {
            if (typeof validator === 'function') {
                validator(value[key], `${fieldName}.${key}`);
            }
        }

        return true;
    }

    static validatePhoneNumber(value, fieldName) {
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        
        if (!phoneRegex.test(value)) {
            throw new ValidationError(
                `${fieldName} must be a valid phone number`,
                fieldName
            );
        }

        return true;
    }

    static validateChatId(value, fieldName) {
        const chatIdRegex = /^[\w@.-]+$/;
        
        if (!chatIdRegex.test(value)) {
            throw new ValidationError(
                `${fieldName} must be a valid chat ID`,
                fieldName
            );
        }

        return true;
    }

    static sanitizeString(value, options = {}) {
        if (typeof value !== 'string') return value;

        let sanitized = value;

        if (options.trim) {
            sanitized = sanitized.trim();
        }

        if (options.lowercase) {
            sanitized = sanitized.toLowerCase();
        }

        if (options.uppercase) {
            sanitized = sanitized.toUpperCase();
        }

        if (options.removeSpaces) {
            sanitized = sanitized.replace(/\s+/g, '');
        }

        if (options.alphanumericOnly) {
            sanitized = sanitized.replace(/[^a-zA-Z0-9]/g, '');
        }

        return sanitized;
    }
}

module.exports = Validator;