/**
 * Next.js Voice Agent Integration Examples
 * Complete examples for integrating Divine Halo Voice Agent with Next.js
 */

// pages/api/voice-agent/session.ts
import { NextApiRequest, NextApiResponse } from 'next';

const VOICE_AGENT_API = 'https://web-production-a38d.up.railway.app';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        try {
            const response = await fetch(`${VOICE_AGENT_API}/api/sessions/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_name: req.body.userName || 'Next.js User',
                    initial_message: req.body.initialMessage || '',
                    metadata: {
                        source: 'nextjs-api',
                        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                        userAgent: req.headers['user-agent'],
                        timestamp: new Date().toISOString(),
                        ...req.body.metadata
                    }
                })
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ message: 'Unknown error' }));
                return res.status(response.status).json({ 
                    success: false, 
                    error: error.message 
                });
            }

            const sessionData = await response.json();
            res.status(200).json({ 
                success: true, 
                session: sessionData 
            });
        } catch (error) {
            console.error('Session creation error:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Failed to create session' 
            });
        }
    } else if (req.method === 'DELETE') {
        const { sessionId } = req.query;
        
        try {
            const response = await fetch(`${VOICE_AGENT_API}/api/sessions/${sessionId}/end`, {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error('Failed to end session');
            }

            const result = await response.json();
            res.status(200).json({ success: true, result });
        } catch (error) {
            console.error('Session end error:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Failed to end session' 
            });
        }
    } else {
        res.setHeader('Allow', ['POST', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

// pages/api/voice-agent/knowledge.ts
import { NextApiRequest, NextApiResponse } from 'next';

const VOICE_AGENT_API = 'https://web-production-a38d.up.railway.app';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        // Add document to knowledge base
        try {
            const response = await fetch(`${VOICE_AGENT_API}/api/knowledge-base/documents`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: req.body.title,
                    content: req.body.content,
                    metadata: {
                        added_via: 'nextjs-api',
                        timestamp: new Date().toISOString(),
                        ...req.body.metadata
                    }
                })
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ message: 'Unknown error' }));
                return res.status(response.status).json({ 
                    success: false, 
                    error: error.message 
                });
            }

            const result = await response.json();
            res.status(200).json({ success: true, document: result });
        } catch (error) {
            console.error('Knowledge add error:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Failed to add document' 
            });
        }
    } else if (req.method === 'GET') {
        // Search knowledge base
        const { q, limit = 5 } = req.query;
        
        if (!q) {
            return res.status(400).json({ 
                success: false, 
                error: 'Query parameter "q" is required' 
            });
        }

        try {
            const response = await fetch(`${VOICE_AGENT_API}/api/knowledge-base/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: q,
                    limit: parseInt(limit as string)
                })
            });

            if (!response.ok) {
                throw new Error('Search failed');
            }

            const results = await response.json();
            res.status(200).json({ success: true, results });
        } catch (error) {
            console.error('Knowledge search error:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Failed to search knowledge base' 
            });
        }
    } else {
        res.setHeader('Allow', ['POST', 'GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

// components/VoiceAgentProvider.tsx
import React, { createContext, useContext, useReducer, ReactNode } from 'react';

interface VoiceSession {
    session_id: string;
    room_name: string;
    token: string;
    expires_at: string;
}

interface VoiceAgentState {
    session: VoiceSession | null;
    isLoading: boolean;
    error: string | null;
    isConnected: boolean;
}

type VoiceAgentAction = 
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_SESSION'; payload: VoiceSession | null }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'SET_CONNECTED'; payload: boolean };

const initialState: VoiceAgentState = {
    session: null,
    isLoading: false,
    error: null,
    isConnected: false
};

const voiceAgentReducer = (state: VoiceAgentState, action: VoiceAgentAction): VoiceAgentState => {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'SET_SESSION':
            return { 
                ...state, 
                session: action.payload,
                isConnected: action.payload !== null,
                error: null
            };
        case 'SET_ERROR':
            return { ...state, error: action.payload, isLoading: false };
        case 'SET_CONNECTED':
            return { ...state, isConnected: action.payload };
        default:
            return state;
    }
};

interface VoiceAgentContextType extends VoiceAgentState {
    createSession: (userName?: string, initialMessage?: string) => Promise<VoiceSession>;
    endSession: () => Promise<void>;
    clearError: () => void;
}

const VoiceAgentContext = createContext<VoiceAgentContextType | null>(null);

export const VoiceAgentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(voiceAgentReducer, initialState);

    const createSession = async (userName = 'User', initialMessage = '') => {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });

        try {
            const response = await fetch('/api/voice-agent/session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userName,
                    initialMessage,
                    metadata: {
                        page: window.location.pathname,
                        timestamp: new Date().toISOString()
                    }
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create session');
            }

            const { success, session, error } = await response.json();
            
            if (!success) {
                throw new Error(error || 'Unknown error');
            }

            dispatch({ type: 'SET_SESSION', payload: session });
            return session;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to create session';
            dispatch({ type: 'SET_ERROR', payload: message });
            throw error;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const endSession = async () => {
        if (!state.session) return;

        try {
            await fetch(`/api/voice-agent/session?sessionId=${state.session.session_id}`, {
                method: 'DELETE'
            });
            dispatch({ type: 'SET_SESSION', payload: null });
        } catch (error) {
            console.error('Failed to end session:', error);
            // Still clear the session locally
            dispatch({ type: 'SET_SESSION', payload: null });
        }
    };

    const clearError = () => {
        dispatch({ type: 'SET_ERROR', payload: null });
    };

    const value: VoiceAgentContextType = {
        ...state,
        createSession,
        endSession,
        clearError
    };

    return (
        <VoiceAgentContext.Provider value={value}>
            {children}
        </VoiceAgentContext.Provider>
    );
};

export const useVoiceAgent = () => {
    const context = useContext(VoiceAgentContext);
    if (!context) {
        throw new Error('useVoiceAgent must be used within a VoiceAgentProvider');
    }
    return context;
};

// components/VoiceChatWidget.tsx
import React, { useState } from 'react';
import { useVoiceAgent } from './VoiceAgentProvider';

interface VoiceChatWidgetProps {
    userName?: string;
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    theme?: 'light' | 'dark';
}

export const VoiceChatWidget: React.FC<VoiceChatWidgetProps> = ({
    userName = 'User',
    position = 'bottom-right',
    theme = 'light'
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const { session, isLoading, error, createSession, endSession, clearError } = useVoiceAgent();

    const handleToggle = () => {
        setIsOpen(!isOpen);
        if (error) clearError();
    };

    const handleStartChat = async () => {
        try {
            await createSession(userName, 'Started from Next.js widget');
        } catch (error) {
            console.error('Failed to start chat:', error);
        }
    };

    const handleEndChat = async () => {
        await endSession();
    };

    const positionClasses = {
        'bottom-right': 'bottom-4 right-4',
        'bottom-left': 'bottom-4 left-4',
        'top-right': 'top-4 right-4',
        'top-left': 'top-4 left-4'
    };

    const themeClasses = theme === 'dark' 
        ? 'bg-gray-900 text-white border-gray-700' 
        : 'bg-white text-gray-900 border-gray-200';

    return (
        <div className={`fixed z-50 ${positionClasses[position]}`}>
            {/* Chat Button */}
            <button
                onClick={handleToggle}
                className={`w-14 h-14 rounded-full bg-blue-500 text-white shadow-lg hover:bg-blue-600 transition-all duration-200 flex items-center justify-center ${
                    session ? 'animate-pulse' : ''
                }`}
            >
                {session ? '🎤' : '💬'}
            </button>

            {/* Chat Widget */}
            {isOpen && (
                <div className={`absolute bottom-16 right-0 w-80 h-96 rounded-lg shadow-xl border ${themeClasses} transition-all duration-200`}>
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                        <h3 className="font-medium">Voice Assistant</h3>
                        <button 
                            onClick={handleToggle}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            ×
                        </button>
                    </div>

                    <div className="p-4 h-full flex flex-col">
                        {error && (
                            <div className="mb-3 p-2 bg-red-100 border border-red-300 text-red-700 rounded text-sm">
                                {error}
                            </div>
                        )}

                        {!session ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center">
                                <div className="mb-4">
                                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                    </svg>
                                    <p className="text-gray-600">Start a voice conversation</p>
                                </div>
                                <button
                                    onClick={handleStartChat}
                                    disabled={isLoading}
                                    className={`px-4 py-2 rounded font-medium ${
                                        isLoading 
                                            ? 'bg-gray-300 cursor-not-allowed' 
                                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                                    }`}
                                >
                                    {isLoading ? 'Starting...' : 'Start Voice Chat'}
                                </button>
                            </div>
                        ) : (
                            <div className="flex-1">
                                <div className="bg-green-50 border border-green-200 rounded p-3 mb-4">
                                    <div className="flex items-center text-green-800">
                                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                                        <span className="text-sm font-medium">Voice Chat Active</span>
                                    </div>
                                    <p className="text-xs text-green-600 mt-1">Session: {session.session_id.slice(0, 8)}...</p>
                                </div>

                                <div className="flex-1 bg-gray-50 rounded-lg p-4 mb-4 text-center">
                                    <div className="text-4xl mb-2">🎤</div>
                                    <p className="text-sm text-gray-600">Voice chat is ready</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        LiveKit integration goes here
                                    </p>
                                </div>

                                <button
                                    onClick={handleEndChat}
                                    className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                >
                                    End Chat
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// pages/_app.tsx
import type { AppProps } from 'next/app';
import { VoiceAgentProvider } from '../components/VoiceAgentProvider';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
    return (
        <VoiceAgentProvider>
            <Component {...pageProps} />
        </VoiceAgentProvider>
    );
}

// pages/voice-chat.tsx
import React, { useState } from 'react';
import { useVoiceAgent } from '../components/VoiceAgentProvider';
import { VoiceChatWidget } from '../components/VoiceChatWidget';

const VoiceChatPage: React.FC = () => {
    const [userName, setUserName] = useState('Next.js User');
    const { session, isLoading, error, createSession, endSession } = useVoiceAgent();

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">
                    Voice Agent Integration Demo
                </h1>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Control Panel */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-4">Session Control</h2>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    User Name
                                </label>
                                <input
                                    type="text"
                                    value={userName}
                                    onChange={(e) => setUserName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter your name"
                                />
                            </div>

                            {!session ? (
                                <button
                                    onClick={() => createSession(userName, 'Hello from Next.js page!')}
                                    disabled={isLoading || !userName.trim()}
                                    className={`w-full px-4 py-3 rounded-md font-medium ${
                                        isLoading || !userName.trim()
                                            ? 'bg-gray-300 cursor-not-allowed'
                                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                                    }`}
                                >
                                    {isLoading ? 'Creating Session...' : 'Start Voice Chat'}
                                </button>
                            ) : (
                                <button
                                    onClick={endSession}
                                    className="w-full px-4 py-3 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                                >
                                    End Session
                                </button>
                            )}
                        </div>

                        {error && (
                            <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
                                <p className="text-sm">{error}</p>
                            </div>
                        )}
                    </div>

                    {/* Session Info */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-4">Session Information</h2>
                        
                        {session ? (
                            <div className="space-y-3">
                                <div>
                                    <span className="text-sm font-medium text-gray-500">Session ID:</span>
                                    <p className="font-mono text-sm bg-gray-100 p-2 rounded">{session.session_id}</p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-500">Room Name:</span>
                                    <p className="font-mono text-sm bg-gray-100 p-2 rounded">{session.room_name}</p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-500">Expires At:</span>
                                    <p className="text-sm bg-gray-100 p-2 rounded">
                                        {new Date(session.expires_at).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-500">Token:</span>
                                    <p className="font-mono text-xs bg-gray-100 p-2 rounded break-all">
                                        {session.token.substring(0, 50)}...
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-8">
                                No active session
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Floating Widget */}
            <VoiceChatWidget userName={userName} theme="light" />
        </div>
    );
};

export default VoiceChatPage;