type MessageHandler = (data: any) => void;
type ConnectionChangeHandler = (isConnected: boolean) => void;

export type MessageType = string;
export interface WSMessage {
    type: MessageType;
    data: any;
    [key: string]: any;
}

interface WebSocketConfig {
    url: string;
    maxReconnectAttempts?: number;
    reconnectDelay?: number;
}

// Singleton instance storage
let globalInstance: WebSocketClient | null = null;

export class WebSocketClient {
    private ws: WebSocket | null = null;
    private config: Required<WebSocketConfig>;
    private reconnectAttempts = 0;
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private isIntentionallyClosed = false;
    private messageHandlers: Set<MessageHandler> = new Set();
    private connectionChangeHandlers: Set<ConnectionChangeHandler> = new Set();
    private typeHandlers: Map<string, Set<(data: any) => void>> = new Map();

    constructor(config: WebSocketConfig) {
        this.config = {
            url: config.url,
            maxReconnectAttempts: config.maxReconnectAttempts ?? 5,
            reconnectDelay: config.reconnectDelay ?? 1000
        };
    }

    /**
     * Connect to WebSocket server with authentication token
     */
    connect(tokenOverride?: string): void {
        // Prevent duplicate connections
        if (this.ws?.readyState === WebSocket.OPEN) {
            console.log('[WS] Already connected');
            // Notify current state
            this.notifyConnectionChange(true);
            return;
        }

        // Clean up existing connection
        if (this.ws) {
            this.ws.close();
        }

        // Get fresh token from storage or override
        const token = tokenOverride || typeof window !== 'undefined' ? (localStorage.getItem('accessToken') || localStorage.getItem('access_token')) : null;

        if (!token) {
            console.error('[WS] Cannot connect - no access token available');
            return;
        }

        try {
            // Include token as query parameter (as expected by backend)
            const wsUrl = `${this.config.url}?token=${token}`;
            console.log('[WS] Connecting with authentication...');

            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                console.log('[WS] ✅ Connected successfully');
                this.reconnectAttempts = 0;
                this.isIntentionallyClosed = false;
                this.notifyConnectionChange(true);
            };

            this.ws.onclose = (event) => {
                console.log(`[WS] Disconnected: ${event.code} - ${event.reason}`);
                this.notifyConnectionChange(false);

                // Don't reconnect if intentionally closed
                if (this.isIntentionallyClosed) {
                    return;
                }

                // Handle auth failures
                if (event.code === 1008) {
                    console.error('[WS] Authentication failed - token may be invalid or expired');
                    // Token is bad, will reconnect when refreshed
                    return;
                }

                // Attempt reconnection with exponential backoff
                if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
                    this.reconnectAttempts++;
                    const delay = Math.min(
                        this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
                        30000
                    );

                    console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`);

                    this.reconnectTimeout = setTimeout(() => {
                        this.connect(tokenOverride);
                    }, delay);
                } else {
                    console.error('[WS] Max reconnection attempts reached');
                }
            };

            this.ws.onerror = (error) => {
                console.error('[WS] Connection error:', error);
                // Error will usually trigger onclose, so we don't need double handling often, 
                // but for some errors we might not get close immediately?
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('[WS] Received:', data);

                    // Notify general handlers
                    this.messageHandlers.forEach(handler => {
                        try {
                            handler(data);
                        } catch (err) {
                            console.error('[WS] Handler error:', err);
                        }
                    });

                    // Notify type-specific handlers
                    // Expecting data to have a 'type' property or similar structure
                    const msgType = data.type;
                    if (msgType && this.typeHandlers.has(msgType)) {
                        this.typeHandlers.get(msgType)?.forEach(handler => {
                            try {
                                // Pass full message object or data? websocket-hooks expects full message usually or data property
                                // Based on websocket-hooks: callback(message.data)? No, hook says:
                                // setLastMessage(message); callbackRef.current?.(message.data);
                                // So the handler receives the WHOLE message object 'message'. 
                                // Wait, useWebSocketMessage hook signature: onMessage?: (data: T) => void
                                // callbackRef.current?.(message.data) implies message has data property.
                                handler(data);
                            } catch (err) {
                                console.error(`[WS] Type handler error for ${msgType}:`, err);
                            }
                        });
                    }

                } catch (e) {
                    console.error('[WS] Failed to parse message:', e);
                }
            };

        } catch (error) {
            console.error('[WS] Connection error:', error);
            this.notifyConnectionChange(false);
        }
    }

    /**
     * Disconnect from WebSocket server
     */
    disconnect(): void {
        this.isIntentionallyClosed = true;

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        this.notifyConnectionChange(false);
        console.log('[WS] Disconnected intentionally');
    }

    /**
     * Send message to server
     */
    send(data: any): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        } else {
            console.error('[WS] Cannot send - not connected');
        }
    }

    /**
     * Register message handler
     */
    onMessage(handler: MessageHandler): () => void {
        this.messageHandlers.add(handler);

        // Return unsubscribe function
        return () => {
            this.messageHandlers.delete(handler);
        };
    }

    /**
     * Get connection state
     */
    isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }

    // --- Extended API for compatibility with websocket-hooks.ts ---

    onConnectionChange(handler: ConnectionChangeHandler): () => void {
        this.connectionChangeHandlers.add(handler);
        // Immediately notify current state
        handler(this.isConnected());
        return () => {
            this.connectionChangeHandlers.delete(handler);
        };
    }

    private notifyConnectionChange(connected: boolean) {
        this.connectionChangeHandlers.forEach(h => {
            try { h(connected); } catch (e) { console.error(e); }
        });
    }

    isCircuitBreakerOpen(): boolean {
        // Simplistic implementation: if reconnect attempts maxed out
        return this.reconnectAttempts >= this.config.maxReconnectAttempts;
    }

    subscribe(channel: string) {
        this.send({ type: 'subscribe', channel });
    }

    unsubscribe(channel: string) {
        this.send({ type: 'unsubscribe', channel });
    }

    on(type: string, handler: (data: any) => void): () => void {
        if (!this.typeHandlers.has(type)) {
            this.typeHandlers.set(type, new Set());
        }
        this.typeHandlers.get(type)?.add(handler);

        return () => {
            this.typeHandlers.get(type)?.delete(handler);
        };
    }
}

export function getWebSocketClient(): WebSocketClient {
    if (!globalInstance) {
        // Use default URL or from env
        const url = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';
        globalInstance = new WebSocketClient({ url });
    }
    return globalInstance;
}
