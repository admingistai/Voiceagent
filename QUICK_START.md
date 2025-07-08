# 🚀 Quick Start - Divine Halo Voice Agent

Get your voice agent running in your project in under 5 minutes!

## Your API is Live at:
```
https://web-production-a38d.up.railway.app
```

## 1. ⚡ Fastest Integration (Widget)

Add this to any HTML page for instant voice chat:

```html
<!-- Configure the widget -->
<script>
window.DivineHaloConfig = {
    apiEndpoint: 'https://web-production-a38d.up.railway.app',
    position: 'bottom-right',
    primaryColor: '#8B2BE2',
    title: 'AI Assistant'
};
</script>

<!-- Load the widget -->
<script src="https://web-production-a38d.up.railway.app/widget/embed.js"></script>
```

**That's it!** A floating chat button will appear on your page.

## 2. 🔧 JavaScript Integration

```javascript
// Create a voice session
const response = await fetch('https://web-production-a38d.up.railway.app/api/sessions/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        user_name: 'Your Name',
        initial_message: 'Hello!'
    })
});

const session = await response.json();
console.log('Session created:', session.session_id);
// Use session.token and session.room_name for LiveKit integration
```

## 3. ⚛️ React Integration

```jsx
import React, { useState } from 'react';

function VoiceChat() {
    const [session, setSession] = useState(null);

    const startChat = async () => {
        const response = await fetch('https://web-production-a38d.up.railway.app/api/sessions/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_name: 'React User',
                initial_message: 'Hello from React!'
            })
        });
        const sessionData = await response.json();
        setSession(sessionData);
    };

    return (
        <div>
            {!session ? (
                <button onClick={startChat}>Start Voice Chat</button>
            ) : (
                <div>
                    <p>✅ Voice chat active!</p>
                    <p>Session: {session.session_id}</p>
                    {/* Add LiveKit components here */}
                </div>
            )}
        </div>
    );
}
```

## 4. 📚 Add Knowledge

```javascript
// Add documents to the AI's knowledge base
await fetch('https://web-production-a38d.up.railway.app/api/knowledge-base/documents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        title: 'My Product Info',
        content: 'Our product offers amazing features like...',
        metadata: { category: 'product' }
    })
});
```

## 5. 🔍 Search Knowledge

```javascript
// Search the knowledge base
const response = await fetch('https://web-production-a38d.up.railway.app/api/knowledge-base/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        query: 'product features',
        limit: 5
    })
});
const results = await response.json();
```

## 🎯 Key Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Check API status |
| `/api/sessions/create` | POST | Start voice session |
| `/api/knowledge-base/documents` | POST | Add knowledge |
| `/api/knowledge-base/search` | POST | Search knowledge |
| `/widget/embed.js` | GET | Widget script |

## 📱 Widget Configuration Options

```javascript
window.DivineHaloConfig = {
    apiEndpoint: 'https://web-production-a38d.up.railway.app',
    position: 'bottom-right', // 'bottom-left', 'top-right', 'top-left'
    primaryColor: '#8B2BE2',
    title: 'AI Assistant',
    subtitle: 'How can I help?',
    buttonSize: 60,
    widgetWidth: 400,
    widgetHeight: 600,
    autoOpen: false,
    theme: 'default'
};
```

## 🎤 LiveKit Integration

For real-time voice chat, use the session token with LiveKit:

```javascript
import { Room } from 'livekit-client';

const room = new Room();
await room.connect('wss://your-livekit-server.com', session.token);
await room.localParticipant.enableMicrophone();
```

## 📖 Need More?

- **Complete Integration Guide**: `INTEGRATION_GUIDE.md`
- **JavaScript Client**: `examples/voice-agent-client.js`
- **React Components**: `examples/react-voice-chat.tsx`
- **Next.js Examples**: `examples/nextjs-integration.tsx`
- **HTML Demo**: `examples/simple-html-example.html`

## 🆘 Quick Troubleshooting

**Widget not appearing?**
- Check console for errors
- Verify the script URL is accessible
- Make sure `DivineHaloConfig` is defined before loading the script

**API calls failing?**
- Check the API health: `https://web-production-a38d.up.railway.app/health`
- Verify your request format matches the examples
- Check browser console for error details

**Voice features not working?**
- You need to integrate with LiveKit using the session token
- Refer to LiveKit documentation for audio/video setup

## 🎉 You're Ready!

Your voice agent is deployed and ready to integrate. Start with the widget for the fastest setup, then explore the advanced integration options as needed.

Happy building! 🚀