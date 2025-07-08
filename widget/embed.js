/**
 * Divine Halo Voice Agent Widget
 * Embeddable chat widget for websites
 */

(function() {
    'use strict';

    // Widget configuration
    const defaultConfig = {
        apiEndpoint: 'https://your-railway-app.up.railway.app',
        position: 'bottom-right',
        theme: 'default',
        primaryColor: '#8B2BE2',
        title: 'AI Assistant',
        subtitle: 'Powered by Divine Halo',
        buttonSize: 60,
        widgetWidth: 400,
        widgetHeight: 600
    };

    // Merge user config with defaults
    const config = Object.assign({}, defaultConfig, window.DivineHaloConfig || {});

    // Create widget styles
    const styles = `
        .divine-halo-widget {
            position: fixed;
            ${config.position === 'bottom-right' ? 'bottom: 20px; right: 20px;' : ''}
            ${config.position === 'bottom-left' ? 'bottom: 20px; left: 20px;' : ''}
            ${config.position === 'top-right' ? 'top: 20px; right: 20px;' : ''}
            ${config.position === 'top-left' ? 'top: 20px; left: 20px;' : ''}
            z-index: 9999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .divine-halo-button {
            width: ${config.buttonSize}px;
            height: ${config.buttonSize}px;
            border-radius: 50%;
            background: ${config.primaryColor};
            color: white;
            border: none;
            cursor: pointer;
            box-shadow: 0 4px 20px rgba(139, 43, 226, 0.4);
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            overflow: hidden;
        }

        .divine-halo-button:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 25px rgba(139, 43, 226, 0.6);
        }

        .divine-halo-button::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
            transform: translate(-50%, -50%);
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0% { transform: translate(-50%, -50%) scale(0.8); opacity: 1; }
            50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.5; }
            100% { transform: translate(-50%, -50%) scale(0.8); opacity: 1; }
        }

        .divine-halo-button-icon {
            width: 24px;
            height: 24px;
            z-index: 1;
        }

        .divine-halo-iframe-container {
            position: absolute;
            ${config.position.includes('right') ? 'right: 0;' : 'left: 0;'}
            ${config.position.includes('bottom') ? 'bottom: 80px;' : 'top: 80px;'}
            width: ${config.widgetWidth}px;
            height: ${config.widgetHeight}px;
            background: white;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
            opacity: 0;
            transform: scale(0.9) translateY(20px);
            transition: all 0.3s ease;
            pointer-events: none;
            overflow: hidden;
        }

        .divine-halo-iframe-container.active {
            opacity: 1;
            transform: scale(1) translateY(0);
            pointer-events: all;
        }

        .divine-halo-header {
            background: linear-gradient(135deg, ${config.primaryColor} 0%, #9B3BF2 100%);
            color: white;
            padding: 16px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .divine-halo-header-title {
            font-size: 18px;
            font-weight: 600;
            margin: 0;
        }

        .divine-halo-header-subtitle {
            font-size: 12px;
            opacity: 0.8;
            margin: 0;
        }

        .divine-halo-close {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            font-size: 24px;
            line-height: 1;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: background 0.2s;
        }

        .divine-halo-close:hover {
            background: rgba(255, 255, 255, 0.2);
        }

        .divine-halo-iframe {
            width: 100%;
            height: calc(100% - 70px);
            border: none;
        }

        .divine-halo-loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
        }

        .divine-halo-spinner {
            width: 50px;
            height: 50px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid ${config.primaryColor};
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 16px;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        @media (max-width: 480px) {
            .divine-halo-iframe-container {
                width: 100vw;
                height: 100vh;
                bottom: 0 !important;
                right: 0 !important;
                left: 0 !important;
                top: 0 !important;
                border-radius: 0;
            }
        }
    `;

    // Create and inject styles
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    // Create widget HTML
    const widgetHTML = `
        <div class="divine-halo-widget">
            <button class="divine-halo-button" id="divineHaloToggle">
                <svg class="divine-halo-button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
            </button>
            <div class="divine-halo-iframe-container" id="divineHaloContainer">
                <div class="divine-halo-header">
                    <div>
                        <h3 class="divine-halo-header-title">${config.title}</h3>
                        <p class="divine-halo-header-subtitle">${config.subtitle}</p>
                    </div>
                    <button class="divine-halo-close" id="divineHaloClose">×</button>
                </div>
                <div class="divine-halo-loading" id="divineHaloLoading">
                    <div class="divine-halo-spinner"></div>
                    <p>Connecting...</p>
                </div>
                <iframe 
                    class="divine-halo-iframe" 
                    id="divineHaloIframe"
                    style="display: none;"
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
                ></iframe>
            </div>
        </div>
    `;

    // Create widget container
    const widgetContainer = document.createElement('div');
    widgetContainer.innerHTML = widgetHTML;
    document.body.appendChild(widgetContainer);

    // Widget state
    let isOpen = false;
    let session = null;
    let isLoading = false;

    // Get elements
    const toggleButton = document.getElementById('divineHaloToggle');
    const container = document.getElementById('divineHaloContainer');
    const closeButton = document.getElementById('divineHaloClose');
    const iframe = document.getElementById('divineHaloIframe');
    const loading = document.getElementById('divineHaloLoading');

    // Create or get session
    async function getSession() {
        try {
            // Check for existing session in localStorage
            const storedSession = localStorage.getItem('divine-halo-session');
            if (storedSession) {
                session = JSON.parse(storedSession);
                // Verify session is still valid
                const response = await fetch(`${config.apiEndpoint}/api/sessions/${session.session_id}`);
                if (response.ok) {
                    return session;
                }
            }

            // Create new session
            const response = await fetch(`${config.apiEndpoint}/api/sessions/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    metadata: {
                        source: 'widget',
                        url: window.location.href,
                        userAgent: navigator.userAgent
                    }
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create session');
            }

            session = await response.json();
            localStorage.setItem('divine-halo-session', JSON.stringify(session));
            return session;

        } catch (error) {
            console.error('Failed to get session:', error);
            throw error;
        }
    }

    // Toggle widget
    async function toggleWidget() {
        if (isLoading) return;

        if (isOpen) {
            closeWidget();
        } else {
            openWidget();
        }
    }

    // Open widget
    async function openWidget() {
        isLoading = true;
        isOpen = true;
        container.classList.add('active');
        loading.style.display = 'block';
        iframe.style.display = 'none';

        try {
            // Get or create session
            const sessionData = await getSession();

            // Build iframe URL with session data
            const iframeUrl = new URL(`${config.apiEndpoint}/chat`);
            iframeUrl.searchParams.append('session_id', sessionData.session_id);
            iframeUrl.searchParams.append('token', sessionData.token);
            iframeUrl.searchParams.append('embedded', 'true');
            iframeUrl.searchParams.append('theme', config.theme);
            iframeUrl.searchParams.append('primaryColor', config.primaryColor);

            // Load iframe
            iframe.src = iframeUrl.toString();
            iframe.onload = () => {
                loading.style.display = 'none';
                iframe.style.display = 'block';
                isLoading = false;

                // Send configuration to iframe
                iframe.contentWindow.postMessage({
                    type: 'widget-config',
                    config: config,
                    session: sessionData
                }, config.apiEndpoint);
            };

        } catch (error) {
            console.error('Failed to open widget:', error);
            loading.innerHTML = '<p>Failed to connect. Please try again.</p>';
            isLoading = false;
        }
    }

    // Close widget
    function closeWidget() {
        isOpen = false;
        container.classList.remove('active');
        
        // Send close event to iframe
        if (iframe.contentWindow) {
            iframe.contentWindow.postMessage({
                type: 'widget-close'
            }, config.apiEndpoint);
        }
    }

    // Event listeners
    toggleButton.addEventListener('click', toggleWidget);
    closeButton.addEventListener('click', closeWidget);

    // Listen for messages from iframe
    window.addEventListener('message', (event) => {
        // Verify origin
        if (!event.origin.startsWith(config.apiEndpoint)) return;

        const { type, data } = event.data;

        switch (type) {
            case 'resize':
                // Handle resize requests from iframe
                if (data.height) {
                    container.style.height = `${data.height}px`;
                }
                break;

            case 'close':
                closeWidget();
                break;

            case 'session-ended':
                // Clear stored session
                localStorage.removeItem('divine-halo-session');
                session = null;
                break;

            case 'unread-messages':
                // Show notification badge
                if (data.count > 0 && !isOpen) {
                    showNotificationBadge(data.count);
                }
                break;
        }
    });

    // Show notification badge
    function showNotificationBadge(count) {
        let badge = toggleButton.querySelector('.divine-halo-badge');
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'divine-halo-badge';
            badge.style.cssText = `
                position: absolute;
                top: -5px;
                right: -5px;
                background: #ff4444;
                color: white;
                border-radius: 10px;
                padding: 2px 6px;
                font-size: 12px;
                font-weight: bold;
            `;
            toggleButton.appendChild(badge);
        }
        badge.textContent = count > 99 ? '99+' : count;
    }

    // Expose API for programmatic control
    window.DivineHalo = {
        open: openWidget,
        close: closeWidget,
        toggle: toggleWidget,
        getSession: () => session,
        config: config
    };

    // Auto-open if configured
    if (config.autoOpen) {
        setTimeout(openWidget, config.autoOpenDelay || 3000);
    }

})();