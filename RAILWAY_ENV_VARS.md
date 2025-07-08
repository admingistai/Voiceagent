# Railway Environment Variables

Set these environment variables in your Railway dashboard before deploying:

## Required Variables

### LiveKit Configuration
- **LIVEKIT_URL**: Your LiveKit server URL (e.g., `wss://your-project.livekit.cloud`)
- **LIVEKIT_API_KEY**: Your LiveKit API key
- **LIVEKIT_API_SECRET**: Your LiveKit API secret

### API Keys
- **OPENAI_API_KEY**: Your OpenAI API key
- **DEEPGRAM_API_KEY**: Your Deepgram API key
- **CARTESIA_API_KEY**: Your Cartesia API key

### Security
- **API_SECRET_KEY**: A secure secret key for JWT tokens (generate a strong random string)

## Optional Variables

### Redis (Recommended for production)
- **REDIS_URL**: Redis connection URL (automatically set if you add Railway Redis addon)

### CORS Configuration
- **ALLOWED_ORIGINS**: Comma-separated list of allowed origins (default: `*`)

### Knowledge Base
- **DEFAULT_KB_FILE**: Path to default knowledge base file (default: `sample_knowledge.json`)

### API Configuration
- **API_BASE_URL**: Base URL for your deployed API (Railway will provide this)

### Debug
- **DEBUG**: Set to `true` to enable debug mode (shows detailed error messages)

## Railway-Specific Variables

These are automatically provided by Railway:
- **PORT**: Port number for the application (automatically set by Railway)
- **RAILWAY_ENVIRONMENT**: Environment name (development, production, etc.)

## Setting Environment Variables

1. Go to your Railway dashboard
2. Select your project
3. Go to the "Variables" tab
4. Add each variable with its value
5. Deploy your application

## Security Notes

- Never commit API keys or secrets to your repository
- Use strong, randomly generated values for API_SECRET_KEY
- Consider using Railway's secret management for sensitive values


LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET,
  OPENAI_API_KEY, DEEPGRAM_API_KEY, DEEPGRAM_API_KEY, API_SECRET_KEY