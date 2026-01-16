/**
 * React Hooks for WebSocket Real-Time Updates
 * 
 * Provides easy integration of WebSocket updates into React components
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getWebSocketClient, WSMessage, MessageType } from './websocket-client';

/**
 * Hook to connect and manage WebSocket connection
 */
export function useWebSocket(token?: string) {
    const [isConnected, setIsConnected] = useState(false);
    const [isCircuitBreakerOpen, setIsCircuitBreakerOpen] = useState(false);
    const wsClient = getWebSocketClient();

    useEffect(() => {
        // Connect on mount
        wsClient.connect(token);

        // Subscribe to connection changes
        const unsubscribe = wsClient.onConnectionChange((connected) => {
            setIsConnected(connected);
            setIsCircuitBreakerOpen(wsClient.isCircuitBreakerOpen());
        });

        return () => {
            unsubscribe();
        };
    }, [token]);

    const disconnect = useCallback(() => {
        wsClient.disconnect();
    }, []);

    const reconnect = useCallback(() => {
        wsClient.disconnect();
        wsClient.connect(token);
    }, [token]);

    return {
        isConnected,
        isCircuitBreakerOpen,
        disconnect,
        reconnect,
    };
}

/**
 * Hook to subscribe to specific message types
 */
export function useWebSocketMessage<T = any>(
    messageType: MessageType | 'all',
    onMessage?: (data: T) => void
) {
    const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);
    const wsClient = getWebSocketClient();
    const callbackRef = useRef(onMessage);

    // Keep callback ref updated
    useEffect(() => {
        callbackRef.current = onMessage;
    }, [onMessage]);

    useEffect(() => {
        const unsubscribe = wsClient.on(messageType, (message) => {
            setLastMessage(message);
            callbackRef.current?.(message.data);
        });

        return unsubscribe;
    }, [messageType]);

    return lastMessage;
}

/**
 * Hook for real-time portfolio updates
 */
export function usePortfolioUpdates() {
    const [portfolio, setPortfolio] = useState<any>(null);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

    useWebSocketMessage('portfolio_update', (data) => {
        setPortfolio(data);
        setLastUpdate(new Date());
    });

    return { portfolio, lastUpdate };
}

/**
 * Hook for real-time bot status updates
 */
export function useBotStatusUpdates() {
    const [botStatuses, setBotStatuses] = useState<Record<string, any>>({});

    useWebSocketMessage('bot_status', (data) => {
        if (data?.bot_id) {
            setBotStatuses(prev => ({
                ...prev,
                [data.bot_id]: data
            }));
        }
    });

    return botStatuses;
}

/**
 * Hook for real-time trade updates
 */
export function useTradeUpdates(botId?: string) {
    const [trades, setTrades] = useState<any[]>([]);

    useWebSocketMessage('trade', (data) => {
        if (!botId || data?.bot_id === botId) {
            setTrades(prev => {
                // Prevent duplicate trades based on ID
                if (prev.some(t => t.id === data.id || t.trade_id === data.trade_id)) {
                    return prev;
                }
                return [data, ...prev].slice(0, 100);
            });
        }
    });

    const clearTrades = useCallback(() => {
        setTrades([]);
    }, []);

    return { trades, clearTrades };
}

/**
 * Hook for real-time order updates
 */
export function useOrderUpdates(botId?: string) {
    const [orders, setOrders] = useState<any[]>([]);

    useWebSocketMessage('order', (data) => {
        if (!botId || data?.bot_id === botId) {
            // Update or add order
            setOrders(prev => {
                const existing = prev.findIndex(o => o.order_id === data.order_id);
                if (existing >= 0) {
                    const updated = [...prev];
                    updated[existing] = data;
                    return updated;
                }
                return [data, ...prev].slice(0, 100);
            });
        }
    });

    return orders;
}

/**
 * Hook for real-time price updates
 */
export function usePriceUpdates(symbols?: string[]) {
    const [prices, setPrices] = useState<Record<string, number>>({});

    useWebSocketMessage('price', (data) => {
        if (!symbols || symbols.includes(data?.symbol)) {
            setPrices(prev => ({
                ...prev,
                [data.symbol]: data.price
            }));
        }
    });

    return prices;
}

/**
 * Hook for real-time alerts
 */
export function useAlerts() {
    const [alerts, setAlerts] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useWebSocketMessage('alert', (data) => {
        setAlerts(prev => [{ ...data, read: false }, ...prev].slice(0, 50));
        setUnreadCount(prev => prev + 1);
    });

    const markAsRead = useCallback((alertId: string) => {
        setAlerts(prev => prev.map(a =>
            a.id === alertId ? { ...a, read: true } : a
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
    }, []);

    const markAllAsRead = useCallback(() => {
        setAlerts(prev => prev.map(a => ({ ...a, read: true })));
        setUnreadCount(0);
    }, []);

    const dismissAlert = useCallback((alertId: string) => {
        setAlerts(prev => prev.filter(a => a.id !== alertId));
    }, []);

    return { alerts, unreadCount, markAsRead, markAllAsRead, dismissAlert };
}

/**
 * Hook for connection status indicator
 */
export function useConnectionStatus(token?: string) {
    const { isConnected, isCircuitBreakerOpen, reconnect } = useWebSocket(token);

    const status = isCircuitBreakerOpen
        ? 'error'
        : isConnected
            ? 'connected'
            : 'connecting';

    const statusMessage = isCircuitBreakerOpen
        ? 'Connection failed. Click to retry.'
        : isConnected
            ? 'Connected'
            : 'Connecting...';

    return {
        status,
        statusMessage,
        isConnected,
        isCircuitBreakerOpen,
        reconnect,
    };
}

/**
 * Hook for subscribing to channels
 */
export function useWebSocketChannel(channel: string) {
    const wsClient = getWebSocketClient();

    useEffect(() => {
        wsClient.subscribe(channel);

        return () => {
            wsClient.unsubscribe(channel);
        };
    }, [channel]);
}

/**
 * Hook for real-time order book updates
 */
export function useOrderBook(symbol: string) {
    const [data, setData] = useState<any>(null);
    const { isConnected, status } = useConnectionStatus();

    // Subscribe to channel
    useWebSocketChannel(`orderbook:${symbol}`);

    // Listen for updates
    useWebSocketMessage('order_book', (msg) => {
        // Verify symbol match if message contains it (it should)
        if (msg.symbol === symbol || msg.s === symbol) {
            setData(msg);
        }
    });
    return { data, status: isConnected ? 'connected' : 'connecting' };
}

/**
 * Hook for real-time position updates
 */
export function usePositions(botId?: string) {
    const [positions, setPositions] = useState<any[]>([]);
    const { isConnected, status } = useConnectionStatus();

    // Listen for updates
    useWebSocketMessage('position', (msg) => {
        if (!botId || msg.bot_id === botId) {
            setPositions(prev => {
                const existing = prev.findIndex(p => p.id === msg.id);
                if (existing >= 0) {
                    const updated = [...prev];
                    updated[existing] = msg;
                    return updated;
                }
                return [msg, ...prev];
            });
        }
    });

    return { data: positions, status: isConnected ? 'connected' : 'connecting' };
}

/**
 * Hook for real-time risk updates
 */
export function useRiskUpdates() {
    const [risk, setRisk] = useState<any>(null);
    const { isConnected, status } = useConnectionStatus();

    // Listen for updates
    useWebSocketMessage('risk', (msg) => {
        setRisk(msg);
    });

    return { data: risk, status: isConnected ? 'connected' : 'connecting' };
}
