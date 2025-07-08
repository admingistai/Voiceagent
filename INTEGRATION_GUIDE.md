# Divine Halo Voice Agent - Integration Guide

Your Railway-deployed voice agent is live at: `https://web-production-a38d.up.railway.app`

## 🚀 Quick Start

### 1. Simple Widget Integration (Easiest)

Add this to any HTML page to get an instant voice chat widget:

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Website with Voice Agent</title>
</head>
<body>
    <h1>Welcome to My Website</h1>
    <p>Your content here...</p>

    <!-- Configure the widget -->
    <script>
        window.DivineHaloConfig = {
            apiEndpoint: 'https://web-production-a38d.up.railway.app',
            position: 'bottom-right',
            primaryColor: '#8B2BE2',
            title: 'AI Assistant',
            subtitle: 'How can I help you?'
        };
    </script>
    
    <!-- Load the widget -->
    <script src="https://web-production-a38d.up.railway.app/widget/embed.js"></script>
</body>
</html>
```

### 2. JavaScript API Integration

```javascript
class VoiceAgentClient {
    constructor(baseUrl = 'https://web-production-a38d.up.railway.app') {
        this.baseUrl = baseUrl;
        this.session = null;
    }

    async createSession(userName = 'User', initialMessage = '') {
        const response = await fetch(`${this.baseUrl}/api/sessions/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_name: userName,
                initial_message: initialMessage,
                metadata: {
                    source: 'custom-app',
                    timestamp: new Date().toISOString()
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to create session: ${response.statusText}`);
        }

        this.session = await response.json();
        return this.session;
    }

    async getSessionInfo(sessionId) {
        const response = await fetch(`${this.baseUrl}/api/sessions/${sessionId}`);
        if (!response.ok) {
            throw new Error(`Failed to get session: ${response.statusText}`);
        }
        return await response.json();
    }

    async endSession(sessionId) {
        const response = await fetch(`${this.baseUrl}/api/sessions/${sessionId}/end`, {
            method: 'POST'
        });
        if (!response.ok) {
            throw new Error(`Failed to end session: ${response.statusText}`);
        }
        return await response.json();
    }

    async addDocument(title, content, metadata = {}) {
        const response = await fetch(`${this.baseUrl}/api/knowledge-base/documents`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title,
                content,
                metadata
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to add document: ${response.statusText}`);
        }
        return await response.json();
    }

    async searchKnowledgeBase(query, limit = 5) {
        const response = await fetch(`${this.baseUrl}/api/knowledge-base/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query,
                limit
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to search: ${response.statusText}`);
        }
        return await response.json();
    }
}

// Usage example
const voiceAgent = new VoiceAgentClient();

// Create a voice session
voiceAgent.createSession('John Doe', 'Hello, I need help with my account')
    .then(session => {
        console.log('Session created:', session);
        // Use session.token and session.room_name for LiveKit connection
    })
    .catch(error => {
        console.error('Error:', error);
    });
```

### 3. React Component Integration

```tsx
import React, { useState, useEffect } from 'react';

interface VoiceSession {
    session_id: string;
    room_name: string;
    token: string;
    expires_at: string;
}

const VoiceAgentComponent: React.FC = () => {
    const [session, setSession] = useState<VoiceSession | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createSession = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('https://web-production-a38d.up.railway.app/api/sessions/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_name: 'React User',
                    initial_message: 'Starting voice chat from React app',
                    metadata: {
                        source: 'react-app',
                        component: 'VoiceAgentComponent'
                    }
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create session');
            }

            const sessionData = await response.json();
            setSession(sessionData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsLoading(false);
        }
    };

    const endSession = async () => {
        if (!session) return;

        try {
            await fetch(`https://web-production-a38d.up.railway.app/api/sessions/${session.session_id}/end`, {
                method: 'POST'
            });
            setSession(null);
        } catch (err) {
            console.error('Failed to end session:', err);
        }
    };

    return (
        <div className="voice-agent-component">
            <h3>Voice Agent</h3>
            
            {error && (
                <div className="error" style={{ color: 'red', marginBottom: '1rem' }}>
                    Error: {error}
                </div>
            )}

            {!session ? (
                <button 
                    onClick={createSession} 
                    disabled={isLoading}
                    className="start-session-btn"
                >
                    {isLoading ? 'Starting...' : 'Start Voice Chat'}
                </button>
            ) : (
                <div className="session-active">
                    <p>✅ Voice session active</p>
                    <p><strong>Session ID:</strong> {session.session_id}</p>
                    <p><strong>Room:</strong> {session.room_name}</p>
                    
                    {/* This is where you would integrate LiveKit components */}
                    <div className="livekit-container">
                        {/* Add LiveKit React components here using session.token */}
                        <p>🎤 Voice chat ready - integrate with LiveKit components</p>
                    </div>
                    
                    <button onClick={endSession} className="end-session-btn">
                        End Session
                    </button>
                </div>
            )}
        </div>
    );
};

export default VoiceAgentComponent;
```

### 4. Next.js Integration

```typescript
// pages/api/voice-agent.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        try {
            const response = await fetch('https://web-production-a38d.up.railway.app/api/sessions/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(req.body)
            });

            const data = await response.json();
            res.status(response.status).json(data);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create session' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
```

```typescript
// components/VoiceChat.tsx
import { useState } from 'react';

export function VoiceChat() {
    const [session, setSession] = useState(null);

    const startVoiceChat = async () => {
        const response = await fetch('/api/voice-agent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_name: 'Next.js User',
                initial_message: 'Hello from Next.js!'
            })
        });

        const sessionData = await response.json();
        setSession(sessionData);
    };

    return (
        <div>
            {!session ? (
                <button onClick={startVoiceChat}>
                    Start Voice Chat
                </button>
            ) : (
                <div>
                    <h3>Voice Chat Active</h3>
                    <p>Session: {session.session_id}</p>
                    {/* Integrate LiveKit components here */}
                </div>
            )}
        </div>
    );
}
```

### 5. Node.js Backend Integration

```javascript
const express = require('express');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());

const VOICE_AGENT_URL = 'https://web-production-a38d.up.railway.app';

// Create voice session for user
app.post('/api/create-voice-session', async (req, res) => {
    try {
        const { userId, userName, initialMessage } = req.body;

        const response = await fetch(`${VOICE_AGENT_URL}/api/sessions/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_name: userName || `User_${userId}`,
                initial_message: initialMessage || 'Hello',
                metadata: {
                    user_id: userId,
                    created_via: 'backend-api',
                    timestamp: new Date().toISOString()
                }
            })
        });

        const sessionData = await response.json();
        
        // Store session in your database if needed
        // await saveSessionToDatabase(userId, sessionData);

        res.json({
            success: true,
            session: sessionData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Add document to knowledge base
app.post('/api/add-knowledge', async (req, res) => {
    try {
        const { title, content, metadata } = req.body;

        const response = await fetch(`${VOICE_AGENT_URL}/api/knowledge-base/documents`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title,
                content,
                metadata
            })
        });

        const result = await response.json();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
```

## 🎛️ Widget Configuration Options

```javascript
window.DivineHaloConfig = {
    // Required
    apiEndpoint: 'https://web-production-a38d.up.railway.app',
    
    // Appearance
    position: 'bottom-right', // 'bottom-right', 'bottom-left', 'top-right', 'top-left'
    primaryColor: '#8B2BE2',
    theme: 'default',
    
    // Text
    title: 'AI Assistant',
    subtitle: 'How can I help you?',
    
    // Sizing
    buttonSize: 60,
    widgetWidth: 400,
    widgetHeight: 600,
    
    // Behavior
    autoOpen: false,
    autoOpenDelay: 3000,
    
    // Custom styling
    customCSS: `
        .divine-halo-button {
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4) !important;
        }
    `
};
```

## 🎯 Knowledge Base Management

```javascript
// Add documents to knowledge base
async function addKnowledgeDocument(title, content) {
    const response = await fetch('https://web-production-a38d.up.railway.app/api/knowledge-base/documents', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            title: title,
            content: content,
            metadata: {
                source: 'api',
                added_at: new Date().toISOString()
            }
        })
    });
    return await response.json();
}

// Search knowledge base
async function searchKnowledge(query) {
    const response = await fetch('https://web-production-a38d.up.railway.app/api/knowledge-base/search', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            query: query,
            limit: 10
        })
    });
    return await response.json();
}

// Example usage
addKnowledgeDocument(
    'Product Information', 
    'Our premium service includes 24/7 support, advanced analytics, and custom integrations.'
);

searchKnowledge('support hours').then(results => {
    console.log('Search results:', results);
});
```

## 🔧 Advanced Integration with LiveKit

For real-time voice chat, you'll need to integrate with LiveKit using the session token:

```javascript
import { Room, RoomEvent, RemoteParticipant } from 'livekit-client';

async function connectToVoiceRoom(sessionData) {
    const room = new Room();
    
    await room.connect('wss://your-livekit-server.com', sessionData.token);
    
    room.on(RoomEvent.Connected, () => {
        console.log('Connected to voice room');
    });
    
    room.on(RoomEvent.ParticipantConnected, (participant) => {
        console.log('Participant connected:', participant.identity);
    });
    
    // Enable microphone
    await room.localParticipant.enableMicrophone();
    
    return room;
}
```

## 🚨 Error Handling

```javascript
async function robustVoiceSession() {
    try {
        const session = await createSession();
        return session;
    } catch (error) {
        if (error.message.includes('401')) {
            console.error('Authentication failed - check API keys');
        } else if (error.message.includes('500')) {
            console.error('Server error - try again later');
        } else if (error.message.includes('429')) {
            console.error('Rate limited - slow down requests');
        } else {
            console.error('Unknown error:', error);
        }
        throw error;
    }
}
```

## 📱 Mobile Considerations

The widget automatically adapts to mobile screens, but for custom implementations:

```css
@media (max-width: 768px) {
    .voice-chat-container {
        width: 100vw;
        height: 100vh;
        position: fixed;
        top: 0;
        left: 0;
        z-index: 9999;
    }
}
```

## 🔗 API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Check API status |
| `/api/sessions/create` | POST | Create voice session |
| `/api/sessions/{id}` | GET | Get session info |
| `/api/sessions/{id}/end` | POST | End session |
| `/api/knowledge-base/documents` | POST | Add document |
| `/api/knowledge-base/documents` | GET | List documents |
| `/api/knowledge-base/search` | POST | Search knowledge |
| `/api/widget/config` | POST | Get widget config |
| `/widget/embed.js` | GET | Widget script |

## 🎉 You're Ready!

Your voice agent is fully deployed and ready to integrate into any project. Choose the method that best fits your needs:

- **Quick & Easy**: Use the widget script
- **Custom Integration**: Use the JavaScript client
- **React/Next.js**: Use the provided components
- **Backend Integration**: Use the Node.js examples

Happy coding! 🚀