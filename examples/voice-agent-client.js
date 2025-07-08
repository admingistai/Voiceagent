/**
 * Divine Halo Voice Agent Client Library
 * A complete JavaScript client for integrating with your Railway voice agent
 */

class VoiceAgentClient {
    constructor(options = {}) {
        this.baseUrl = options.baseUrl || 'https://web-production-a38d.up.railway.app';
        this.apiKey = options.apiKey || null;
        this.session = null;
        this.debug = options.debug || false;
        
        this.log('VoiceAgentClient initialized', { baseUrl: this.baseUrl });
    }

    log(message, data = null) {
        if (this.debug) {
            console.log(`[VoiceAgent] ${message}`, data || '');
        }
    }

    /**
     * Check if the API is healthy
     */
    async healthCheck() {
        try {
            const response = await this.request('GET', '/health');
            this.log('Health check successful', response);
            return response;
        } catch (error) {
            this.log('Health check failed', error);
            throw error;
        }
    }

    /**
     * Create a new voice session
     */
    async createSession(options = {}) {
        const payload = {
            user_name: options.userName || 'User',
            initial_message: options.initialMessage || '',
            metadata: {
                source: 'js-client',
                timestamp: new Date().toISOString(),
                ...options.metadata
            }
        };

        try {
            const response = await this.request('POST', '/api/sessions/create', payload);
            this.session = response;
            this.log('Session created', response);
            return response;
        } catch (error) {
            this.log('Failed to create session', error);
            throw error;
        }
    }

    /**
     * Get session information
     */
    async getSession(sessionId = null) {
        const id = sessionId || this.session?.session_id;
        if (!id) {
            throw new Error('No session ID provided');
        }

        try {
            const response = await this.request('GET', `/api/sessions/${id}`);
            this.log('Retrieved session info', response);
            return response;
        } catch (error) {
            this.log('Failed to get session', error);
            throw error;
        }
    }

    /**
     * End a voice session
     */
    async endSession(sessionId = null) {
        const id = sessionId || this.session?.session_id;
        if (!id) {
            throw new Error('No session ID provided');
        }

        try {
            const response = await this.request('POST', `/api/sessions/${id}/end`);
            if (this.session?.session_id === id) {
                this.session = null;
            }
            this.log('Session ended', response);
            return response;
        } catch (error) {
            this.log('Failed to end session', error);
            throw error;
        }
    }

    /**
     * Add a document to the knowledge base
     */
    async addDocument(title, content, metadata = {}) {
        const payload = {
            title,
            content,
            metadata: {
                added_via: 'js-client',
                timestamp: new Date().toISOString(),
                ...metadata
            }
        };

        try {
            const response = await this.request('POST', '/api/knowledge-base/documents', payload);
            this.log('Document added', response);
            return response;
        } catch (error) {
            this.log('Failed to add document', error);
            throw error;
        }
    }

    /**
     * List all documents in the knowledge base
     */
    async listDocuments() {
        try {
            const response = await this.request('GET', '/api/knowledge-base/documents');
            this.log('Documents retrieved', response);
            return response;
        } catch (error) {
            this.log('Failed to list documents', error);
            throw error;
        }
    }

    /**
     * Search the knowledge base
     */
    async searchKnowledgeBase(query, limit = 5) {
        const payload = { query, limit };

        try {
            const response = await this.request('POST', '/api/knowledge-base/search', payload);
            this.log('Knowledge search completed', response);
            return response;
        } catch (error) {
            this.log('Knowledge search failed', error);
            throw error;
        }
    }

    /**
     * Delete a document from the knowledge base
     */
    async deleteDocument(docId) {
        try {
            const response = await this.request('DELETE', `/api/knowledge-base/documents/${docId}`);
            this.log('Document deleted', response);
            return response;
        } catch (error) {
            this.log('Failed to delete document', error);
            throw error;
        }
    }

    /**
     * Get widget configuration
     */
    async getWidgetConfig(options = {}) {
        try {
            const response = await this.request('POST', '/api/widget/config', options);
            this.log('Widget config retrieved', response);
            return response;
        } catch (error) {
            this.log('Failed to get widget config', error);
            throw error;
        }
    }

    /**
     * Make HTTP request to the API
     */
    async request(method, endpoint, body = null) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
        };

        if (this.apiKey) {
            headers['Authorization'] = `Bearer ${this.apiKey}`;
        }

        const config = {
            method,
            headers,
        };

        if (body && (method === 'POST' || method === 'PUT')) {
            config.body = JSON.stringify(body);
        }

        this.log(`Making ${method} request to ${endpoint}`, body);

        const response = await fetch(url, config);
        
        if (!response.ok) {
            const errorText = await response.text();
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch {
                errorData = { message: errorText };
            }
            
            const error = new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
            error.status = response.status;
            error.data = errorData;
            throw error;
        }

        return await response.json();
    }

    /**
     * Utility: Generate a unique session name
     */
    static generateSessionName(prefix = 'session') {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `${prefix}-${timestamp}-${random}`;
    }

    /**
     * Utility: Validate session data
     */
    static isValidSession(session) {
        return session && 
               session.session_id && 
               session.token && 
               session.room_name;
    }

    /**
     * Get current session info
     */
    getCurrentSession() {
        return this.session;
    }

    /**
     * Check if currently in a session
     */
    hasActiveSession() {
        return this.session !== null;
    }
}

// Event system for the client
class VoiceAgentEventEmitter {
    constructor() {
        this.events = {};
    }

    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    emit(event, data) {
        if (this.events[event]) {
            this.events[event].forEach(callback => callback(data));
        }
    }

    off(event, callback) {
        if (this.events[event]) {
            this.events[event] = this.events[event].filter(cb => cb !== callback);
        }
    }
}

// Enhanced client with events
class VoiceAgentClientWithEvents extends VoiceAgentClient {
    constructor(options = {}) {
        super(options);
        this.events = new VoiceAgentEventEmitter();
    }

    async createSession(options = {}) {
        this.events.emit('session:creating', options);
        try {
            const session = await super.createSession(options);
            this.events.emit('session:created', session);
            return session;
        } catch (error) {
            this.events.emit('session:error', error);
            throw error;
        }
    }

    async endSession(sessionId = null) {
        this.events.emit('session:ending', { sessionId });
        try {
            const result = await super.endSession(sessionId);
            this.events.emit('session:ended', result);
            return result;
        } catch (error) {
            this.events.emit('session:error', error);
            throw error;
        }
    }

    async addDocument(title, content, metadata = {}) {
        this.events.emit('knowledge:adding', { title, content, metadata });
        try {
            const result = await super.addDocument(title, content, metadata);
            this.events.emit('knowledge:added', result);
            return result;
        } catch (error) {
            this.events.emit('knowledge:error', error);
            throw error;
        }
    }

    on(event, callback) {
        this.events.on(event, callback);
    }

    emit(event, data) {
        this.events.emit(event, data);
    }

    off(event, callback) {
        this.events.off(event, callback);
    }
}

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { VoiceAgentClient, VoiceAgentClientWithEvents };
} else {
    window.VoiceAgentClient = VoiceAgentClient;
    window.VoiceAgentClientWithEvents = VoiceAgentClientWithEvents;
}

/*
USAGE EXAMPLES:

// Basic usage
const client = new VoiceAgentClient({
    baseUrl: 'https://web-production-a38d.up.railway.app',
    debug: true
});

// Create a session
client.createSession({
    userName: 'John Doe',
    initialMessage: 'Hello, I need help!'
}).then(session => {
    console.log('Session created:', session);
}).catch(error => {
    console.error('Error:', error);
});

// Add knowledge
client.addDocument(
    'FAQ: How to reset password',
    'To reset your password, go to the login page and click "Forgot Password"...',
    { category: 'FAQ', priority: 'high' }
);

// Search knowledge
client.searchKnowledgeBase('reset password').then(results => {
    console.log('Search results:', results);
});

// With events
const eventClient = new VoiceAgentClientWithEvents({ debug: true });

eventClient.on('session:created', (session) => {
    console.log('New session:', session.session_id);
});

eventClient.on('session:error', (error) => {
    console.error('Session error:', error.message);
});
*/