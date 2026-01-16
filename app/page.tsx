"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, DollarSign, TrendingUp, Wallet, ArrowUpRight, ArrowDownLeft, RotateCcw, Zap, Link2Off } from "lucide-react";
import { useStore } from "@/store/useStore";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useWebSocket, usePortfolioUpdates, useBotStatusUpdates, useTradeUpdates, useOrderUpdates, useConnectionStatus } from "@/lib/websocket-hooks";
import { useAuth } from "@/hooks/useAuth";
import { MarketRegimeWidget } from "@/components/dashboard/MarketRegimeWidget";

export default function Home() {
  const router = useRouter();
  const { isTrader, isAdmin } = useAuth();

  // Redirect TRADER users to their dashboard
  useEffect(() => {
    if (isTrader && !isAdmin) {
      router.replace('/user/dashboard');
    }
  }, [isTrader, isAdmin, router]);


  const {
    bots,
    fetchBots,
    isAuthenticated,
    portfolioValue,
    fetchPortfolio,
    trades: historicalTrades,
    fetchTrades,
    orders: historicalOrders,
    fetchOrders,
    user,
    connectSocket  // Add connectSocket to enable real-time
  } = useStore();

  // Get access token for WebSocket authentication
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAccessToken(localStorage.getItem('access_token'));
    }
  }, [isAuthenticated]);

  // WebSocket Hooks - Pass token for authentication
  const { isConnected, isCircuitBreakerOpen } = useConnectionStatus(accessToken || undefined);
  const { portfolio: livePortfolio } = usePortfolioUpdates();
  const liveBotStatuses = useBotStatusUpdates();
  const { trades: liveTrades } = useTradeUpdates();
  const liveOrders = useOrderUpdates();

  // Data and socket logic now handled centrally in AuthGuard
  useEffect(() => {
    if (isAuthenticated) {
      // Portfolio and Trades still benefit from direct trigger on dashboard mount
      fetchPortfolio();
      fetchTrades();
      fetchOrders();
    }
  }, [fetchPortfolio, fetchTrades, fetchOrders, isAuthenticated]);

  // Derived State
  const currentPortfolioValue = livePortfolio?.total_value_usd || portfolioValue;

  const activeBotsCount = useMemo(() => {
    // Merge store bots with live statuses
    let runningCount = 0;
    bots.forEach(bot => {
      const liveStatus = liveBotStatuses[bot.id];
      if (liveStatus && liveStatus.status === 'running') {
        runningCount++;
      } else if (!liveStatus && bot.status === 'running') {
        runningCount++; // Fallback to store if no live update yet
      }
    });
    return runningCount;
  }, [bots, liveBotStatuses]);

  const allTrades = useMemo(() => {
    // Deduplicate live trades from historical trades based on ID or timestamp
    const liveIds = new Set(liveTrades.map(t => (t as any).trade_id || t.id || t.timestamp));
    const filteredHistorical = historicalTrades.filter(t => !liveIds.has((t as any).trade_id || t.id || t.timestamp));
    return [...liveTrades, ...filteredHistorical].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [liveTrades, historicalTrades]);

  const allOrders = useMemo(() => {
    const liveIds = new Set(liveOrders.map(o => o.order_id));
    const filteredHistorical = historicalOrders.filter(o => !liveIds.has(o.order_id));
    return [...liveOrders, ...filteredHistorical].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [liveOrders, historicalOrders]);

  // Fetch dashboard stats from backend (pre-calculated metrics)
  const [dashboardStats, setDashboardStats] = useState({ totalTrades: 0, totalPnL: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats?timeRange=1d');
        const data = await res.json();
        if (data.trading) {
          setDashboardStats({
            totalTrades: data.trading.totalTrades || 0,
            totalPnL: data.trading.totalPnL || 0
          });
        }
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
      }
    };
    if (isAuthenticated) {
      fetchStats();
      // Refresh stats every 30 seconds
      const interval = setInterval(fetchStats, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const totalTrades = dashboardStats.totalTrades || allTrades.length;
  const totalPnL = dashboardStats.totalPnL;
  const orderCount = useMemo(() =>
    allOrders.filter(o => o.type === 'order_placed' || o.status === 'created' || o.status === 'active').length,
    [allOrders]);

  // Prepare Chart Data
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const chartData = useMemo(() => {
    if (allTrades.length > 0) {
      const sortedTrades = [...allTrades].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      let cumulativePnL = 0;
      return sortedTrades.map(trade => {
        cumulativePnL += (parseFloat(trade.pnl || 0) || 0);
        return {
          time: new Date(trade.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          pnl: cumulativePnL,
          fullDate: new Date(trade.timestamp).toLocaleString()
        };
      }).slice(-20);
    }

    // Return empty array during SSR and before mounting to prevent hydration mismatch
    // Fallback data is only generated after client-side mount
    if (!isMounted) {
      return [];
    }

    // Simulation fallback if active but no trades yet (client-side only)
    if (activeBotsCount > 0) {
      const now = Date.now();
      return Array.from({ length: 10 }, (_, i) => ({
        time: new Date(now - (9 - i) * 30000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        pnl: 0,
        activity: activeBotsCount
      }));
    }
    return [];
  }, [allTrades, activeBotsCount, isMounted]);

  // Combined Activity Feed
  const recentActivity = useMemo(() => {
    const items: any[] = [];

    allTrades.forEach(trade => {
      items.push({
        type: 'trade',
        side: trade.side,
        symbol: trade.symbol,
        price: trade.price,
        amount: trade.amount || trade.quantity,
        timestamp: trade.timestamp,
        pnl: trade.pnl,
        botName: (trade as any).bot_id || trade.botId // Handle botId variance
      });
    });

    allOrders.forEach(order => {
      // Map WebSocket order events to UI structure
      // WS sends: { type: 'order', data: { ... } } -> hook extracts data
      items.push({
        type: order.type || (order.status === 'filled' ? 'order_filled' : 'order_placed'),
        side: order.side,
        symbol: order.symbol,
        price: order.price,
        amount: order.amount,
        timestamp: order.timestamp,
        botName: order.bot_id || order.botName
      });
    });

    return items
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 50);
  }, [allTrades, allOrders]);

  const stats = [
    { name: 'Total Portfolio Value', value: `$${currentPortfolioValue.toFixed(2)}`, change: activeBotsCount > 0 ? 'Live Updates' : 'No Activity', icon: DollarSign },
    { name: 'Active Bots', value: activeBotsCount.toString(), change: activeBotsCount > 0 ? 'Running' : 'Idle', icon: Activity },
    { name: 'Active Orders', value: orderCount.toString(), change: 'Open', icon: TrendingUp },
    { name: '24h Trades', value: totalTrades.toString(), change: `PnL: $${totalPnL.toFixed(2)}`, icon: Wallet },
  ];

  const getActivityIcon = (type: string, side: string) => {
    if (type === 'order_placed' || type === 'active' || type === 'created') return side === 'buy' ? ArrowDownLeft : ArrowUpRight;
    if (type === 'order_cancelled' || type === 'cancelled') return RotateCcw;
    return side === 'buy' ? ArrowDownLeft : ArrowUpRight;
  };

  const getActivityLabel = (item: any) => {
    const price = Number(item.price).toLocaleString();
    const side = item.side?.toUpperCase();

    if (item.type === 'order_placed' || item.type === 'created' || item.type === 'active') return `${side} Order @ $${price}`;
    if (item.type === 'order_cancelled' || item.type === 'cancelled') return `Cancelled ${side}`;
    if (item.type === 'trade' || item.type === 'filled') return `${side} Filled @ $${price}`;
    return item.type;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-white">Dashboard</h2>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${isConnected
            ? 'bg-green-500/10 text-green-400 border-green-500/20'
            : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}>
            {isConnected ? <Zap size={14} className="fill-green-400" /> : <Link2Off size={14} />}
            {isConnected ? 'Real-Time' : 'Connecting...'}
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${activeBotsCount > 0 ? 'bg-blue-500/20 text-blue-400 animate-pulse' : 'bg-slate-700 text-slate-400'}`}>
            {activeBotsCount > 0 ? `${activeBotsCount} Bot${activeBotsCount > 1 ? 's' : ''} Active` : 'No Active Bots'}
          </span>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 shadow-sm backdrop-blur-sm transition-all hover:border-slate-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">{stat.name}</p>
                <p className="mt-2 text-2xl font-bold text-white transition-all duration-300 ease-in-out">{stat.value}</p>
              </div>
              <div className="rounded-full bg-blue-500/10 p-3 text-blue-500">
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className={`font-medium ${stat.change.includes('Loss') || stat.change.includes('-') ? 'text-red-500' : 'text-green-500'}`}>{stat.change}</span>
              <span className="ml-2 text-slate-500">{stat.name === 'Total Portfolio Value' ? 'real-time' : '24h'}</span>
            </div>
          </div>
        ))}
        {/* Market Regime Widget Span */}
        <div className="col-span-full lg:col-span-2 xl:col-span-1">
          <MarketRegimeWidget />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <h3 className="text-lg font-medium text-white mb-4">Performance Overview</h3>
          <div className="h-[300px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorPnL" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="time"
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={30}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                    itemStyle={{ color: '#e2e8f0' }}
                    labelStyle={{ color: '#94a3b8' }}
                    formatter={(value: any) => [`$${Number(value || 0).toFixed(2)}`, 'PnL']}
                  />
                  <Area
                    type="monotone"
                    dataKey="pnl"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorPnL)"
                    animationDuration={500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center border border-dashed border-slate-800 rounded-lg">
                <div className="text-center">
                  <Activity className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-500">Start a bot to see performance data</p>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="col-span-3 rounded-xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white">Live Activity</h3>
            {recentActivity.length > 0 && (
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="h-full space-y-3 overflow-y-auto pr-2 webkit-scrollbar-hide">
              {recentActivity.length > 0 ? (
                recentActivity.map((item, i) => {
                  const Icon = getActivityIcon(item.type, item.side);
                  const isBuy = item.side === 'buy';
                  const isCancel = item.type === 'order_cancelled' || item.type === 'cancelled';

                  return (
                    <div key={i} className="flex items-center justify-between border-b border-slate-800/50 pb-3 last:border-0 last:pb-0 animate-in slide-in-from-right-2 fade-in duration-300">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${isCancel ? 'bg-yellow-500/10 text-yellow-500' : isBuy ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-white">{item.symbol}</p>
                            <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 uppercase">{item.type.replace('_', ' ')}</span>
                          </div>
                          <p className="text-xs text-slate-500">
                            {getActivityLabel(item)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-mono text-slate-400">
                          {new Date(item.timestamp).toLocaleTimeString([], { hour12: false })}
                        </p>
                        {item.botName && (
                          <p className="text-[10px] text-slate-600 truncate max-w-[80px]">{item.botName}</p>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center py-8 opacity-50">
                  <Activity className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-500">
                    {isConnected ? "Waiting for market events..." : "Connecting to market feed..."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
