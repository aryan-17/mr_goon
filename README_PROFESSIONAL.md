# WhatsApp Bot - Professional Edition

A modular, extensible WhatsApp bot built with Node.js featuring professional design patterns and best practices.

## Features

- **Self-Moderation**: Automatically manage your own messages with configurable delays
- **Anti-Spam Protection**: Advanced spam detection with similarity algorithms
- **Modular Architecture**: Clean separation of concerns with strategy pattern
- **Professional Logging**: Structured logging with multiple levels
- **Error Handling**: Comprehensive error handling and validation
- **Auto-Reconnection**: Automatic reconnection with exponential backoff
- **Event-Driven**: Built on EventEmitter for extensibility

## Project Structure

```
.
├── src/
│   ├── config/          # Configuration management
│   ├── handlers/        # Message handlers and strategies
│   │   └── strategies/  # Handler strategy implementations
│   ├── services/        # Core services (WhatsApp client)
│   └── utils/          # Utilities (logger, validator, error handler)
├── index.js            # Application entry point
└── package.json
```

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file:

```env
# Required
TARGET_USER_ID=1234567890@c.us

# Optional
TARGET_GROUP_NAME=MyGroup
MESSAGE_DELETE_DELAY=5000
LOG_LEVEL=info
NODE_ENV=development
PUPPETEER_HEADLESS=true
```

## Usage

```bash
# Start the bot
npm start

# Development mode with auto-reload
npm run dev
```

## Architecture

### Strategy Pattern
The bot uses the Strategy pattern for message handling, allowing easy addition of new message processing strategies:

- **SelfModerationStrategy**: Manages your own messages
- **AntiSpamStrategy**: Detects and handles spam messages
- **BaseStrategy**: Abstract base class for custom strategies

### Event-Driven Design
The WhatsApp client extends EventEmitter, providing events:
- `ready`: Client is ready
- `authenticated`: Successfully authenticated
- `message`: New message received
- `error`: Error occurred
- `disconnected`: Client disconnected

### Modular Components

1. **WhatsAppClient**: Wrapper around whatsapp-web.js with reconnection logic
2. **MessageHandler**: Orchestrates message processing strategies
3. **Config**: Centralized configuration management
4. **Logger**: Structured logging with levels
5. **ErrorHandler**: Comprehensive error handling
6. **Validator**: Input validation utilities

## Extending the Bot

### Adding a New Strategy

```javascript
const BaseStrategy = require('./BaseStrategy');

class CustomStrategy extends BaseStrategy {
    async handle(message, chat) {
        // Your implementation
    }
}
```

### Registering the Strategy

```javascript
const customStrategy = new CustomStrategy();
messageHandler.register('custom', customStrategy);
```

## Security

- Environment variables for sensitive data
- Input validation on all user inputs
- Error messages don't expose sensitive information
- Proper authentication handling

## Best Practices

- Clean code architecture
- SOLID principles
- Dependency injection
- Error boundaries
- Graceful shutdown
- Resource cleanup

## License

MIT