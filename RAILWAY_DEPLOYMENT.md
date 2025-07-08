# Railway Deployment Guide for Divine Halo Voice Agent

This guide walks you through deploying the Divine Halo Voice Agent on Railway with API gateway and widget integration.

## 🚀 Quick Start

### Prerequisites
- Railway account (sign up at [railway.app](https://railway.app))
- GitHub account (for automatic deployments)
- API keys for:
  - LiveKit (get from [livekit.io](https://livekit.io))
  - OpenAI
  - Deepgram
  - Cartesia

### 1. Install Railway CLI

```bash
# macOS/Linux
curl -fsSL https://railway.app/install.sh | sh

# Windows (PowerShell)
iwr -useb https://railway.app/install.ps1 | iex
```

### 2. Deploy to Railway

```bash
# Login to Railway
railway login

# Clone the repository
git clone https://github.com/admingistai/Voiceagent.git
cd Voiceagent

# Initialize Railway project
railway init

# Deploy
railway up
```

### 3. Configure Environment Variables

Set these environment variables in Railway dashboard or CLI:

```bash
# LiveKit Configuration
railway variables set LIVEKIT_URL="wss://your-livekit-server.livekit.cloud"
railway variables set LIVEKIT_API_KEY="your-livekit-api-key"
railway variables set LIVEKIT_API_SECRET="your-livekit-api-secret"

# API Keys
railway variables set OPENAI_API_KEY="your-openai-api-key"
railway variables set DEEPGRAM_API_KEY="your-deepgram-api-key"
railway variables set CARTESIA_API_KEY="your-cartesia-api-key"

# API Configuration
railway variables set API_SECRET_KEY="your-secret-api-key"
railway variables set ALLOWED_ORIGINS="https://yourwebsite.com,https://anotherdomain.com"

# Optional: Redis for session storage
railway add redis
```

### 4. Generate Public Domain

```bash
railway domain
```

This will give you a URL like: `https://your-app.up.railway.app`

## 📦 Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Widget/Client  │────▶│   API Gateway    │────▶│  LiveKit Agent  │
│  (JavaScript)   │     │  (FastAPI)       │     │   (Python)      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │  Knowledge Base  │
                        │   (ChromaDB)     │
                        └─────────────────┘
```

## 🔌 API Endpoints

Your Railway deployment exposes these endpoints:

### Health Check
```bash
GET /health
```

### Session Management
```bash
POST /api/sessions/create      # Create new voice session
GET  /api/sessions/{id}        # Get session details
POST /api/sessions/{id}/end    # End session
```

### Knowledge Base
```bash
POST   /api/knowledge-base/documents      # Add document
GET    /api/knowledge-base/documents      # List documents
POST   /api/knowledge-base/search         # Search documents
DELETE /api/knowledge-base/documents/{id} # Delete document
```

### Widget Configuration
```bash
POST /api/widget/config        # Get widget configuration
GET  /widget/embed.js         # Widget JavaScript file
```

## 🪟 Widget Integration

### Basic Integration

Add this to any website to embed the voice agent:

```html
<!-- Add before closing </body> tag -->
<script>
  window.DivineHaloConfig = {
    apiEndpoint: 'https://your-app.up.railway.app',
    position: 'bottom-right',
    primaryColor: '#8B2BE2',
    title: 'AI Assistant'
  };
</script>
<script src="https://your-app.up.railway.app/widget/embed.js"></script>
```

### Advanced Configuration

```javascript
window.DivineHaloConfig = {
  apiEndpoint: 'https://your-app.up.railway.app',
  position: 'bottom-right',     // or 'bottom-left', 'top-right', 'top-left'
  theme: 'default',             // or 'dark', 'light'
  primaryColor: '#8B2BE2',      // Your brand color
  title: 'AI Assistant',
  subtitle: 'How can I help?',
  buttonSize: 60,               // Chat button size in pixels
  widgetWidth: 400,             // Widget width
  widgetHeight: 600,            // Widget height
  autoOpen: true,               // Auto-open widget
  autoOpenDelay: 5000           // Delay before auto-open (ms)
};
```

### Programmatic Control

```javascript
// Open the widget
DivineHalo.open();

// Close the widget
DivineHalo.close();

// Toggle open/close
DivineHalo.toggle();

// Get current session
const session = DivineHalo.getSession();
```

## 📊 Loading Knowledge Base

### Via API

```bash
# Add a document
curl -X POST https://your-app.up.railway.app/api/knowledge-base/documents \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Your document content here",
    "metadata": {"title": "Document Title", "category": "FAQ"}
  }'

# Search documents
curl -X POST https://your-app.up.railway.app/api/knowledge-base/search \
  -H "Content-Type: application/json" \
  -d '{"query": "How does it work?", "n_results": 3}'
```

### Via File Upload

Place your `sample_knowledge.json` in the project root before deployment:

```json
[
  {
    "content": "Company information...",
    "metadata": {"title": "About Us", "category": "company"}
  },
  {
    "content": "Product details...",
    "metadata": {"title": "Products", "category": "products"}
  }
]
```

## 🔧 Advanced Configuration

### Using Redis for Sessions

Railway makes it easy to add Redis:

```bash
# Add Redis service
railway add redis

# The REDIS_URL will be automatically available
```

### Custom Domain

```bash
# Add your custom domain
railway domain set yourdomain.com

# Add CNAME record in your DNS:
# yourdomain.com -> your-app.up.railway.app
```

### Scaling

Update `railway.toml` for auto-scaling:

```toml
[scaling]
minReplicas = 1
maxReplicas = 5

[resources]
memory = "2Gi"
cpu = "1000m"
```

## 🐛 Troubleshooting

### Health Check Failures

Ensure the app listens on `0.0.0.0:$PORT`:
```python
uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
```

### WebSocket Issues

Add WebSocket support in `railway.toml`:
```toml
[[services]]
protocol = "tcp"
```

### CORS Errors

Update `ALLOWED_ORIGINS` environment variable:
```bash
railway variables set ALLOWED_ORIGINS="*"  # For testing only!
```

### View Logs

```bash
railway logs
```

## 🔒 Security Best Practices

1. **API Key Protection**
   - Never commit API keys to Git
   - Use Railway's environment variables

2. **CORS Configuration**
   - Specify exact origins in production
   - Avoid using wildcard `*`

3. **Rate Limiting**
   - Implement rate limiting in production
   - Use Redis for distributed rate limiting

4. **HTTPS Only**
   - Railway provides HTTPS by default
   - Redirect all HTTP to HTTPS

## 📈 Monitoring

### Railway Dashboard
- View deployments, logs, and metrics
- Set up alerts for errors

### Custom Monitoring
- Integrate with services like Sentry
- Add custom logging endpoints

## 🚀 Production Checklist

- [ ] Set all environment variables
- [ ] Configure custom domain
- [ ] Set up Redis for sessions
- [ ] Configure CORS properly
- [ ] Test widget on staging site
- [ ] Load knowledge base documents
- [ ] Set up monitoring/alerts
- [ ] Configure auto-scaling
- [ ] Test health checks
- [ ] Verify WebSocket connectivity

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [LiveKit Documentation](https://docs.livekit.io)
- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [Project GitHub](https://github.com/admingistai/Voiceagent)

---

Need help? Create an issue on [GitHub](https://github.com/admingistai/Voiceagent/issues)