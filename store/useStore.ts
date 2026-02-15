/**
 * Global Zustand Store
 * =====================
 * Unified state management for H-Bot UI.
 * Connects to Hummingbot API for real-time data.
 * NOW WITH MQTT for <100ms updates!
 */

import { create } from 'zustand';
import mqtt from 'mqtt';
import { Bot, BotStatus } from '@/types/bot';
import { BotGroup } from '@/types/group';

interface User {
    id: string;
    email: string;
    name: string;
}

interface Trade {
    id: string;
    botId: string;
    symbol: string;
    side: 'buy' | 'sell';
    type: string;
    price: number;
    quantity: number;
    fee?: number;
    pnl?: number;
    exchange?: string;
    timestamp: string;
    bot?: {
        id: string;
        name: string;
    };
}

interface ActivityItem {
    type: string;
    description: string;
    time: string;
    value: string;
}

interface AppState {
    // Auth State
    user: User | null;
    isAuthenticated: boolean;
    login: (user: User) => void;
    logout: () => void;

    // Connection State
    isConnected: boolean;
    setConnected: (status: boolean) => void;

    // MQTT State
    mqttClient: mqtt.MqttClient | null;
    connectSocket: () => void; // Using generic name for UI compatibility
    disconnectSocket: () => void;

    // Bots State
    bots: Bot[];
    setBots: (bots: Bot[]) => void;
    updateBotStatus: (botId: string, status: BotStatus) => void;
    fetchBots: () => Promise<void>;
    addBot: (bot: Bot) => void;
    removeBot: (botId: string) => void;

    // Groups & Selection
    groups: BotGroup[];
    selectedBotIds: string[];
    fetchGroups: () => Promise<void>;
    createGroup: (name: string, color: string, description?: string) => Promise<void>;
    updateGroup: (id: string, data: Partial<BotGroup>) => Promise<void>;
    deleteGroup: (id: string) => Promise<void>;
    assignBotsToGroup: (botIds: string[], groupId: string, shouldClearSelection?: boolean) => Promise<void>;
    removeBotsFromGroup: (botIds: string[], groupId: string) => Promise<void>;
    toggleBotSelection: (botId: string) => void;
    selectAllBots: (botIds: string[]) => void;
    toggleSelectAll: (botIds: string[]) => void;
    clearSelection: () => void;

    // Portfolio State
    portfolioValue: number;
    change24h: number;
    change24hPercent: number;
    assets: any[];
    connectedExchanges: any[];
    recentActivity: ActivityItem[];
    fetchPortfolio: () => Promise<void>;
    addActivity: (activity: ActivityItem) => void;

    // Trades State
    trades: Trade[];
    fetchTrades: () => Promise<void>;

    // Orders State (for live activity)
    orders: any[];
    orderCount: number;
    fetchOrders: () => Promise<void>;

    // UI State
    appMode: 'live' | 'paper';
    toggleAppMode: () => void;
    sidebarCollapsed: boolean;
    toggleSidebar: () => void;
    mobileSidebarOpen: boolean;
    toggleMobileSidebar: (open?: boolean) => void;

    // Backend Health
    backendHealth: 'healthy' | 'unhealthy' | 'checking';
    checkBackendHealth: () => Promise<void>;

    startPolling: () => void;
    stopPolling: () => void;
}

let pollingInterval: NodeJS.Timeout | null = null;

export const useStore = create<AppState>((set, get) => ({
    // ===========================================
    // AUTH STATE
    // ===========================================
    user: null,
    isAuthenticated: false,
    login: (user) => set({ user, isAuthenticated: true }),
    logout: () => {
        get().disconnectSocket();
        set({ user: null, isAuthenticated: false });
    },

    // ===========================================
    // CONNECTION STATE
    // ===========================================
    isConnected: false,
    setConnected: (status) => set({ isConnected: status }),

    // ===========================================
    // MQTT / SOCKET STATE
    // ===========================================
    mqttClient: null,
    connectSocket: () => {
        if (get().mqttClient) return;

        const mqttUrl = process.env.NEXT_PUBLIC_MQTT_URL || 'ws://localhost:8083/mqtt';
        console.log(`[Store] Connecting to MQTT Broker (${mqttUrl})...`);
        const client = mqtt.connect(mqttUrl, {
            keepalive: 60,
            reconnectPeriod: 0, // Disable auto-reconnect to prevent spam when unavailable
            clean: true,
            clientId: `hbot-ui-${Math.random().toString(16).substring(2, 8)}`
        });

        client.on('connect', () => {
            console.log('[Store] ✅ MQTT Connected - Real-time updates active');
            set({ isConnected: true, backendHealth: 'healthy' });

            // Subscribe to all bot events
            client.subscribe('hummingbot/+/status', (err) => {
                if (err) console.error('[Store] Failed to subscribe to status:', err);
            });
            client.subscribe('hummingbot/+/market_event', (err) => {
                if (err) console.error('[Store] Failed to subscribe to market_event:', err);
            });
            console.log('[Store] 📡 Subscribed to bot status and market events');
        });

        client.on('message', (topic, message) => {
            const payload = message.toString();
            try {
                const data = JSON.parse(payload);
                const topicParts = topic.split('/');
                const instanceId = topicParts[1];
                const type = topicParts[2];

                if (type === 'status') {
                    if (data.status === 'running') {
                        get().updateBotStatus(instanceId, 'running');
                    } else {
                        get().updateBotStatus(instanceId, 'stopped');
                    }
                } else if (type === 'market_event') {
                    if (data.event_type === 'OrderFilledEvent') {
                        console.log('[Store] 💰 Order Filled!', data);
                        get().addActivity({
                            type: 'Trade',
                            description: `Filled ${data.trade_type} ${data.amount} ${data.trading_pair}`,
                            time: new Date().toLocaleTimeString(),
                            value: data.price
                        });
                        get().fetchTrades();
                        get().fetchPortfolio();
                    }
                }
            } catch (e) {
                console.error('[Store] Failed to parse MQTT message:', e);
            }
        });

        client.on('error', (err) => {
            console.error('[Store] MQTT Error:', err);
            set({ isConnected: false, backendHealth: 'unhealthy' });
        });

        client.on('reconnect', () => {
            console.log('[Store] 🔄 Reconnecting to MQTT...');
        });

        client.on('offline', () => {
            console.log('[Store] ⚠️  MQTT Offline');
            set({ isConnected: false });
        });

        set({ mqttClient: client });

        // Start polling as backup (increased to 60s since MQTT is primary)
        get().startPolling();
    },

    disconnectSocket: () => {
        const client = get().mqttClient;
        if (client) {
            client.end();
            set({ mqttClient: null, isConnected: false });
        }
        get().stopPolling();
    },

    // ===========================================
    // BOTS STATE
    // ===========================================
    bots: [],
    setBots: (bots) => set({ bots }),
    updateBotStatus: (botId, status) => set((state) => ({
        bots: state.bots.map(bot => bot.name === botId || bot.id === botId ? { ...bot, status } : bot)
    })),
    addBot: (bot) => set((state) => ({
        bots: [...state.bots, bot]
    })),
    removeBot: (botId) => set((state) => ({
        bots: state.bots.filter(bot => bot.id !== botId)
    })),
    fetchBots: async () => {
        try {
            const { backendApi } = await import('@/lib/backend-api');
            const response = await backendApi.get('/bots');
            if (response.data && Array.isArray(response.data)) {
                set({ bots: response.data });
            }
        } catch (error) {
            console.error('[Store] Failed to fetch bots:', error);
        }
    },

    // ===========================================
    // GROUPS & SELECTION STATE
    // ===========================================
    groups: [],
    selectedBotIds: [],

    fetchGroups: async () => {
        try {
            const { backendApi } = await import('@/lib/backend-api');
            const response = await backendApi.get('/groups');
            set({ groups: response.data || [] });
        } catch (error) {
            console.error('[Store] Failed to fetch groups:', error);
        }
    },

    createGroup: async (name, color, description) => {
        try {
            const { backendApi } = await import('@/lib/backend-api');
            await backendApi.post('/groups', { name, color, description });
            get().fetchGroups();
        } catch (error) {
            console.error('[Store] Failed to create group:', error);
            throw error;
        }
    },

    updateGroup: async (id, data) => {
        try {
            const { backendApi } = await import('@/lib/backend-api');
            // Find current group to ensure we send complete data for PUT
            const currentGroup = get().groups.find(g => g.id === id);

            // Construct payload with existing data to prevent clearing fields
            // The backend likely requires the full object or at least bot_ids to maintain membership/integrity
            // Construct payload with existing data to prevent clearing fields
            // The backend likely requires the full object or at least bot_ids to maintain membership/integrity
            const payload = {
                name: data.name ?? currentGroup?.name,
                color: data.color ?? currentGroup?.color,
                description: data.description ?? currentGroup?.description ?? "",
                // bot_ids: currentGroup?.bots?.map(b => b.id) || [] // Removed to test if this fixes 500 error
            };

            await backendApi.put(`/groups/${id}`, payload);
            get().fetchGroups();
        } catch (error) {
            console.error('[Store] Failed to update group:', error);
            throw error;
        }
    },

    deleteGroup: async (id) => {
        try {
            const { backendApi } = await import('@/lib/backend-api');
            await backendApi.delete(`/groups/${id}`);
            get().fetchGroups();
        } catch (error) {
            console.error('[Store] Failed to delete group:', error);
            throw error;
        }
    },

    assignBotsToGroup: async (botIds, groupId, shouldClearSelection = true) => {
        try {
            const { backendApi } = await import('@/lib/backend-api');
            await backendApi.post(`/groups/${groupId}/assign`, { botIds, action: 'add' });
            get().fetchGroups();
            if (shouldClearSelection) {
                get().clearSelection();
            }
        } catch (error) {
            console.error('[Store] Failed to assign bots:', error);
            throw error;
        }
    },

    removeBotsFromGroup: async (botIds, groupId) => {
        try {
            const { backendApi } = await import('@/lib/backend-api');
            await backendApi.post(`/groups/${groupId}/assign`, { botIds, action: 'remove' });
            get().fetchGroups();
        } catch (error) {
            console.error('[Store] Failed to remove bots:', error);
            throw error;
        }
    },

    toggleBotSelection: (botId) => set((state) => {
        const isSelected = state.selectedBotIds.includes(botId);
        return {
            selectedBotIds: isSelected
                ? state.selectedBotIds.filter(id => id !== botId)
                : [...state.selectedBotIds, botId]
        };
    }),

    selectAllBots: (botIds) => set({ selectedBotIds: botIds }),

    toggleSelectAll: (botIds) => set((state) => {
        const allSelected = botIds.every(id => state.selectedBotIds.includes(id));
        if (allSelected) {
            // Deselect all provided IDs
            return { selectedBotIds: state.selectedBotIds.filter(id => !botIds.includes(id)) };
        } else {
            // Select all provided IDs (merge unique)
            return { selectedBotIds: [...new Set([...state.selectedBotIds, ...botIds])] };
        }
    }),

    clearSelection: () => set({ selectedBotIds: [] }),

    // ===========================================
    // PORTFOLIO STATE
    // ===========================================
    portfolioValue: 0,
    change24h: 0,
    change24hPercent: 0,
    assets: [],
    connectedExchanges: [],
    recentActivity: [],
    fetchPortfolio: async () => {
        try {
            const { backendApi } = await import('@/lib/backend-api');
            const response = await backendApi.get('/portfolio');
            if (response.data) {
                set({
                    portfolioValue: response.data.totalValue || 0,
                    change24h: response.data.change24h || 0,
                    change24hPercent: response.data.change24hPercent || 0,
                    assets: response.data.assets || [],
                    connectedExchanges: response.data.connectedExchanges || [],
                    recentActivity: response.data.recentActivity || []
                });
            }
        } catch (error) {
            console.error('[Store] Failed to fetch portfolio:', error);
        }
    },
    addActivity: (activity) => set((state) => ({
        recentActivity: [activity, ...state.recentActivity].slice(0, 50)
    })),

    // ===========================================
    // TRADES STATE
    // ===========================================
    trades: [],
    fetchTrades: async () => {
        try {
            const { backendApi } = await import('@/lib/backend-api');
            const response = await backendApi.get('/trades');
            set({ trades: Array.isArray(response.data) ? response.data : [] });
        } catch (error) {
            console.error('[Store] Failed to fetch trades:', error);
        }
    },

    // ===========================================
    // ORDERS STATE (Live Activity)
    // ===========================================
    orders: [],
    orderCount: 0,
    fetchOrders: async () => {
        try {
            const { backendApi } = await import('@/lib/backend-api');

            // Explicitly add Authorization header
            const token = typeof window !== 'undefined' ? (localStorage.getItem('access_token')) : null;
            const config = token ? { headers: { 'Authorization': `Bearer ${token}` } } : {};

            const response = await backendApi.get('/orders', config);
            if (response.data) {
                set({
                    orders: response.data.orders || [],
                    orderCount: response.data.botCount || 0
                });
            }
        } catch (error) {
            console.error('[Store] Failed to fetch orders:', error);
        }
    },

    // ===========================================
    // UI STATE
    // ===========================================
    appMode: (typeof window !== 'undefined' && localStorage.getItem('appMode') as 'live' | 'paper') || 'paper',
    toggleAppMode: () => set((state) => {
        const nextMode = state.appMode === 'live' ? 'paper' : 'live';
        if (typeof window !== 'undefined') localStorage.setItem('appMode', nextMode);
        return { appMode: nextMode };
    }),
    sidebarCollapsed: typeof window !== 'undefined' ? localStorage.getItem('sidebarCollapsed') === 'true' : false,
    toggleSidebar: () => set((state) => {
        const nextState = !state.sidebarCollapsed;
        if (typeof window !== 'undefined') localStorage.setItem('sidebarCollapsed', String(nextState));
        return { sidebarCollapsed: nextState };
    }),
    mobileSidebarOpen: false,
    toggleMobileSidebar: (open) => set((state) => ({
        mobileSidebarOpen: typeof open === 'boolean' ? open : !state.mobileSidebarOpen
    })),

    // ===========================================
    // BACKEND HEALTH
    // ===========================================
    backendHealth: 'checking',
    checkBackendHealth: async () => {
        try {
            const response = await fetch('/api/health');
            if (response.ok) {
                const data = await response.json();
                if (data.status === 'healthy') {
                    // set({ backendHealth: 'healthy' }); 
                }
            }
        } catch (error) {
            console.error('[Store] Backend health check failed:', error);
        }
    },

    // ===========================================
    // POLLING
    // ===========================================
    startPolling: () => {
        if (pollingInterval) return;

        // Initial fetch
        const { fetchBots, fetchPortfolio, fetchTrades, fetchOrders, fetchGroups } = get();
        fetchBots();
        fetchGroups();
        fetchPortfolio();
        fetchTrades();
        fetchOrders();

        // Poll every 30 seconds (fallback/active polling)
        pollingInterval = setInterval(() => {
            if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
                return;
            }
            const { fetchBots, fetchPortfolio, fetchTrades, fetchOrders, fetchGroups } = get();
            fetchBots();
            fetchGroups();
            fetchPortfolio();
            fetchTrades();
            fetchOrders();
        }, 30000);
    },

    stopPolling: () => {
        if (pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
        }
    }
}));
