/**
 * React Voice Chat Component
 * Complete React integration for Divine Halo Voice Agent
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';

// Types
interface VoiceSession {
    session_id: string;
    room_name: string;
    token: string;
    expires_at: string;
}

interface VoiceAgentError {
    message: string;
    status?: number;
    data?: any;
}

interface VoiceAgentProps {
    apiUrl?: string;
    userName?: string;
    onSessionCreated?: (session: VoiceSession) => void;
    onSessionEnded?: () => void;
    onError?: (error: VoiceAgentError) => void;
    className?: string;
    theme?: 'light' | 'dark';
    autoStart?: boolean;
}

// Custom hook for voice agent functionality
export const useVoiceAgent = (apiUrl = 'https://web-production-a38d.up.railway.app') => {
    const [session, setSession] = useState<VoiceSession | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<VoiceAgentError | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    const createSession = useCallback(async (userName = 'User', initialMessage = '') => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${apiUrl}/api/sessions/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_name: userName,
                    initial_message: initialMessage,
                    metadata: {
                        source: 'react-component',
                        timestamp: new Date().toISOString(),
                        user_agent: navigator.userAgent
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                throw new Error(errorData.message || `HTTP ${response.status}`);
            }

            const sessionData = await response.json();
            setSession(sessionData);
            setIsConnected(true);
            return sessionData;
        } catch (err) {
            const error: VoiceAgentError = {
                message: err instanceof Error ? err.message : 'Failed to create session',
                status: err instanceof Error && 'status' in err ? (err as any).status : undefined
            };
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [apiUrl]);

    const endSession = useCallback(async () => {
        if (!session) return;

        try {
            await fetch(`${apiUrl}/api/sessions/${session.session_id}/end`, {
                method: 'POST'
            });
            setSession(null);
            setIsConnected(false);
        } catch (err) {
            console.warn('Failed to end session properly:', err);
            // Still clear the session locally
            setSession(null);
            setIsConnected(false);
        }
    }, [session, apiUrl]);

    const getSessionInfo = useCallback(async (sessionId?: string) => {
        const id = sessionId || session?.session_id;
        if (!id) throw new Error('No session ID available');

        const response = await fetch(`${apiUrl}/api/sessions/${id}`);
        if (!response.ok) {
            throw new Error(`Failed to get session info: ${response.statusText}`);
        }
        return await response.json();
    }, [session, apiUrl]);

    return {
        session,
        isLoading,
        error,
        isConnected,
        createSession,
        endSession,
        getSessionInfo,
        clearError: () => setError(null)
    };
};

// Main Voice Chat Component
export const VoiceChatComponent: React.FC<VoiceAgentProps> = ({
    apiUrl = 'https://web-production-a38d.up.railway.app',
    userName = 'User',
    onSessionCreated,
    onSessionEnded,
    onError,
    className = '',
    theme = 'light',
    autoStart = false
}) => {
    const {
        session,
        isLoading,
        error,
        isConnected,
        createSession,
        endSession,
        clearError
    } = useVoiceAgent(apiUrl);

    // Effect to handle callbacks
    useEffect(() => {
        if (session && onSessionCreated) {
            onSessionCreated(session);
        }
    }, [session, onSessionCreated]);

    useEffect(() => {
        if (!session && isConnected === false && onSessionEnded) {
            onSessionEnded();
        }
    }, [session, isConnected, onSessionEnded]);

    useEffect(() => {
        if (error && onError) {
            onError(error);
        }
    }, [error, onError]);

    // Auto-start if enabled
    useEffect(() => {
        if (autoStart && !session && !isLoading) {
            createSession(userName, 'Auto-started voice chat').catch(console.error);
        }
    }, [autoStart, session, isLoading, createSession, userName]);

    const handleStartChat = async () => {
        try {
            await createSession(userName, 'Started voice chat from React component');
        } catch (err) {
            // Error is already handled by the hook
            console.error('Failed to start chat:', err);
        }
    };

    const handleEndChat = async () => {
        await endSession();
    };

    const themeClasses = theme === 'dark' 
        ? 'bg-gray-900 text-white border-gray-700' 
        : 'bg-white text-gray-900 border-gray-300';

    return (
        <div className={`voice-chat-component ${className}`}>
            <div className={`p-6 rounded-lg border ${themeClasses}`}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Voice Chat</h3>
                    <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <span className="text-sm">{isConnected ? 'Connected' : 'Disconnected'}</span>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        <div className="flex justify-between items-center">
                            <span className="text-sm">{error.message}</span>
                            <button 
                                onClick={clearError}
                                className="text-red-700 hover:text-red-900"
                            >
                                ×
                            </button>
                        </div>
                    </div>
                )}

                {!session ? (
                    <div className="text-center">
                        <p className="mb-4 text-gray-600">Start a voice conversation with our AI assistant</p>
                        <button
                            onClick={handleStartChat}
                            disabled={isLoading}
                            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                                isLoading 
                                    ? 'bg-gray-400 cursor-not-allowed' 
                                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                            }`}
                        >
                            {isLoading ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Starting...
                                </span>
                            ) : (
                                'Start Voice Chat'
                            )}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center mb-2">
                                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="font-medium text-green-800">Voice Chat Active</span>
                            </div>
                            <div className="text-sm text-green-700 space-y-1">
                                <p><strong>Session ID:</strong> {session.session_id}</p>
                                <p><strong>Room:</strong> {session.room_name}</p>
                                <p><strong>User:</strong> {userName}</p>
                            </div>
                        </div>

                        {/* This is where you would integrate LiveKit components */}
                        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                            <div className="space-y-3">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                                <p className="text-lg font-medium text-gray-900">🎤 Voice Chat Ready</p>
                                <p className="text-gray-500">Integrate LiveKit components here using:</p>
                                <code className="block bg-gray-100 p-2 rounded text-sm">
                                    session.token, session.room_name
                                </code>
                            </div>
                        </div>

                        <div className="flex space-x-3">
                            <button
                                onClick={handleEndChat}
                                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                            >
                                End Chat
                            </button>
                            <button
                                onClick={() => navigator.clipboard.writeText(session.session_id)}
                                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                            >
                                Copy Session ID
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Simplified hook for just session management
export const useVoiceSession = (apiUrl?: string) => {
    const { session, createSession, endSession, isLoading, error } = useVoiceAgent(apiUrl);
    return { session, createSession, endSession, isLoading, error };
};

// Component for displaying session info
export const VoiceSessionInfo: React.FC<{ session: VoiceSession | null }> = ({ session }) => {
    if (!session) return null;

    return (
        <div className="voice-session-info bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Session Information</h4>
            <dl className="space-y-1 text-sm">
                <div className="flex">
                    <dt className="font-medium text-blue-800 w-20">ID:</dt>
                    <dd className="text-blue-700 font-mono">{session.session_id}</dd>
                </div>
                <div className="flex">
                    <dt className="font-medium text-blue-800 w-20">Room:</dt>
                    <dd className="text-blue-700 font-mono">{session.room_name}</dd>
                </div>
                <div className="flex">
                    <dt className="font-medium text-blue-800 w-20">Expires:</dt>
                    <dd className="text-blue-700">{new Date(session.expires_at).toLocaleString()}</dd>
                </div>
            </dl>
        </div>
    );
};

// Example usage component
export const VoiceChatExample: React.FC = () => {
    const [sessionHistory, setSessionHistory] = useState<VoiceSession[]>([]);

    const handleSessionCreated = (session: VoiceSession) => {
        console.log('New session created:', session);
        setSessionHistory(prev => [...prev, session]);
    };

    const handleSessionEnded = () => {
        console.log('Session ended');
    };

    const handleError = (error: VoiceAgentError) => {
        console.error('Voice agent error:', error);
        alert(`Error: ${error.message}`);
    };

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Voice Agent Integration Example</h1>
            
            <VoiceChatComponent
                userName="React User"
                onSessionCreated={handleSessionCreated}
                onSessionEnded={handleSessionEnded}
                onError={handleError}
                theme="light"
                className="mb-6"
            />

            {sessionHistory.length > 0 && (
                <div>
                    <h3 className="text-lg font-medium mb-3">Session History</h3>
                    <div className="space-y-2">
                        {sessionHistory.map((session, index) => (
                            <div key={session.session_id} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                #{index + 1}: {session.session_id} - {new Date(session.expires_at).toLocaleTimeString()}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default VoiceChatComponent;