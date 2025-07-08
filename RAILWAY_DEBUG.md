# Railway Deployment Debugging Guide

## Environment Variable Issues

If you're experiencing issues with environment variables not being loaded in Railway, follow these steps:

### 1. Check Environment Variables in Railway Dashboard

Make sure you've set all required environment variables in the Railway dashboard:

- `OPENAI_API_KEY` - Required for knowledge base
- `LIVEKIT_API_KEY` - Required for voice sessions
- `LIVEKIT_API_SECRET` - Required for voice sessions
- `LIVEKIT_URL` - Your LiveKit server URL
- `CARTESIA_API_KEY` - Required for TTS
- `DEEPGRAM_API_KEY` - Required for STT
- `API_SECRET_KEY` - Your API secret
- `REDIS_URL` - Optional, for session persistence

### 2. Use Debug Endpoints

Once deployed, you can check the environment status:

```bash
# Check health and component status
curl https://your-app.railway.app/health

# Check environment variables (protected endpoint)
curl "https://your-app.railway.app/api/debug/env?api_key=your-secret-key"
```

### 3. Check Deployment Logs

The start script now logs environment variable status. Look for:

```
=== Environment Variables Debug ===
PORT: 8000
OPENAI_API_KEY: set
...
```

And in the API logs:

```
=== Environment Variables Status ===
OPENAI_API_KEY: set
...
```

### 4. Run Debug Script

You can SSH into your Railway deployment and run:

```bash
python debug_env.py
```

This will show all available environment variables and test component imports.

### 5. Common Issues and Solutions

#### Issue: OPENAI_API_KEY not found
- **Cause**: Environment variable not set in Railway
- **Solution**: 
  1. Go to Railway dashboard → Variables
  2. Add `OPENAI_API_KEY` with your OpenAI API key
  3. Redeploy the service

#### Issue: Knowledge base returns 503
- **Cause**: OpenAI API key missing or invalid
- **Solution**: The API now uses lazy initialization - the knowledge base will initialize on first use if the key becomes available

#### Issue: Import errors
- **Cause**: Missing dependencies or path issues
- **Solution**: Check that all requirements are installed correctly

### 6. Testing the API

Test basic functionality:

```bash
# Check if API is running
curl https://your-app.railway.app/

# Check health
curl https://your-app.railway.app/health

# Try to create a session (requires all keys)
curl -X POST https://your-app.railway.app/api/sessions/create \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test-user"}'
```

### 7. Environment Variable Best Practices for Railway

1. **Never commit .env files** - Use Railway's environment variables
2. **Use Railway's variable groups** - For managing multiple environments
3. **Reference variables in Railway** - You can reference other variables using `${{VARIABLE_NAME}}`
4. **Check variable visibility** - Some variables might be scoped to specific services

### 8. Fallback Options

If environment variables still don't work:

1. **Use Railway's config as code**:
   ```json
   {
     "build": {
       "dockerfile": "Dockerfile.simple"
     },
     "deploy": {
       "healthcheckPath": "/health",
       "restartPolicyType": "ON_FAILURE",
       "restartPolicyMaxRetries": 3,
       "variables": {
         "OPENAI_API_KEY": "${{OPENAI_API_KEY}}"
       }
     }
   }
   ```

2. **Use build arguments** in Dockerfile:
   ```dockerfile
   ARG OPENAI_API_KEY
   ENV OPENAI_API_KEY=$OPENAI_API_KEY
   ```

3. **Manual initialization** - The API now supports lazy initialization of the knowledge base