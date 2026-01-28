import { useEffect, useRef, useCallback, useState } from 'react';
import { WebSocketClient } from '../lib/websocket-client';

// Singleton WebSocket instance
let wsInstance: WebSocketClient | null = null;

export function useWebSocket(url: string) {
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef<WebSocketClient | null>(null);

    useEffect(() => {
        // Use singleton to prevent duplicate connections
        if (!wsInstance) {
            wsInstance = new WebSocketClient({ url });
        }

        wsRef.current = wsInstance;
        wsRef.current.connect();

        // Listen for connection changes
        const unsubscribeConn = wsRef.current.onConnectionChange((connected) => {
            setIsConnected(connected);
        });

        // Handle token refresh events
        const handleTokenRefresh = (event: CustomEvent) => {
            console.log('[WS] Token refreshed, reconnecting...');
            wsRef.current?.disconnect();
            // Small delay to ensure old connection is fully closed
            setTimeout(() => {
                wsRef.current?.connect();
            }, 100);
        };

        window.addEventListener('tokenRefreshed', handleTokenRefresh as EventListener);

        // Cleanup on unmount
        return () => {
            window.removeEventListener('tokenRefreshed', handleTokenRefresh as EventListener);
            unsubscribeConn();
        };
    }, [url]);

    const send = useCallback((data: any) => {
        wsRef.current?.send(data);
    }, []);

    const onMessage = useCallback((handler: (data: any) => void) => {
        return wsRef.current?.onMessage(handler) ?? (() => { });
    }, []);

    return { send, onMessage, isConnected };
}
