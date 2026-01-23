'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    BarChart3,
    Target,
    Zap,
    Terminal,
    Settings,
    ArrowLeft,
    RefreshCw,
    Play,
    Square,
    Clock,
    DollarSign,
    Activity,
    Shield,
    Network,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    Server,
    Wifi,
    CheckCircle2,
    Trash2,
    X,
    FileText,
    Database as DbIcon,
    Box
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { backendApi } from '@/lib/backend-api';
import StreamingTerminal from '@/components/dashboard/StreamingTerminal';
import DynamicConfigEditor from '@/components/dashboard/DynamicConfigEditor';
import { PnLChart } from '@/components/dashboard/PnLChart';

interface BotDetailViewProps {
    botId: string;
    onBack: () => void;
}

type SubTabId = 'overview' | 'orders' | 'trades' | 'logs' | 'config';

export default function BotDetailView({ botId, onBack }: BotDetailViewProps) {
    const [botStatus, setBotStatus] = useState<any>(null);
    const [tradesData, setTradesData] = useState<any>(null);
    const [ordersData, setOrdersData] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<SubTabId>('overview');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteSuccess, setDeleteSuccess] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [statusRes, tradesRes, ordersRes] = await Promise.all([
                backendApi.get(`/bots/${botId}`),
                backendApi.get(`/bots/${botId}/trades?limit=50`),
                backendApi.get(`/bots/${botId}/orders?limit=20`)
            ]);

            if (statusRes.data?.data) {
                setBotStatus(statusRes.data.data);
            }
            if (tradesRes.data) setTradesData(tradesRes.data);
            if (ordersRes.data) setOrdersData(ordersRes.data);

        } catch (error) {
            console.error('Failed to fetch bot detail data:', error);
        } finally {
            setLoading(false);
        }
    }, [botId]);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const handleToggle = async () => {
        if (actionLoading) return;
        setActionLoading(true);
        const action = botStatus?.status === 'running' ? 'stop' : 'start';
        try {
            await backendApi.post(`/bots/${botId}/${action}`);
            await new Promise(r => setTimeout(r, 2000));
            await fetchData();
        } catch (error) {
            console.error(`Failed to ${action} bot:`, error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (isRunning || actionLoading) return;
        setActionLoading(true);
        try {
            const response = await backendApi.delete(`/bots/${botId}`);
            if (response.status === 200) {
                setDeleteSuccess(true);
                toast.success(`Node ${botName} Purged`);
                await new Promise(r => setTimeout(r, 1200));
                onBack();
            }
        } catch (error: any) {
            console.error('Purge failed:', error);
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-32 space-y-4">
                <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
                <div className="text-xs font-mono text-cyan-500 animate-pulse">ESTABLISHING DATALINK...</div>
            </div>
        );
    }

    const isRunning = botStatus?.status === 'running';
    const hasData = botStatus && botStatus.status !== 'NOT_FOUND';
    const botName = hasData ? botStatus.name : botId;
    const strategy = hasData ? botStatus.strategy : 'UNKNOWN';
    const pair = hasData ? botStatus.tradingPair : 'N/A';
    const exchange = hasData ? botStatus.exchange : 'N/A';

    const totalPnL = tradesData?.stats?.totalPnL || 0;
    const isProfitable = totalPnL >= 0;
    const winRate = tradesData?.stats?.winRate || 0;
    const tradeCount = tradesData?.stats?.totalTrades || 0;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20">
            {/* HUD HEADER */}
            <div className="bg-[#0B1221] border-b border-white/5 pb-6 -mx-8 px-8 pt-2">
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                    <div className="flex items-center gap-6">
                        <button onClick={onBack} className="w-14 h-14 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/50 flex flex-col items-center justify-center transition-all">
                            <ArrowLeft className="w-5 h-5 text-slate-400" />
                        </button>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h2 className="text-2xl font-black text-white uppercase font-mono">{botName}</h2>
                                <div className={cn(
                                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 border",
                                    botStatus?.status === 'running' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                                        botStatus?.status === 'starting' ? "bg-blue-500/10 border-blue-500/20 text-blue-400" :
                                            botStatus?.status === 'error' ? "bg-rose-500/10 border-rose-500/20 text-rose-500" : "bg-slate-800/50 text-slate-500 border-white/5"
                                )}>
                                    <div className={cn("w-1.5 h-1.5 rounded-full", isRunning ? "bg-emerald-500 animate-pulse" : "bg-slate-500")} />
                                    {botStatus?.status?.toUpperCase() || 'OFFLINE'}
                                </div>
                            </div>
                            <div className="flex items-center gap-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                                <span className="text-slate-300 flex items-center gap-1.5"><Network className="w-3.5 h-3.5 text-blue-500" /> {exchange}</span>
                                <span className="text-slate-300 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-purple-500" /> {pair}</span>
                                <span className="text-slate-300 flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-orange-500" /> {strategy}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="px-4 py-2 bg-slate-900/50 rounded-lg border border-slate-800">
                            <div className="flex justify-between text-[9px] text-slate-500 font-bold uppercase gap-4">
                                <span>Latency</span>
                                <span className="text-cyan-400 font-mono">{isRunning ? 'Active' : 'N/A'}</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setShowDeleteModal(true)} disabled={isRunning} className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 hover:text-rose-500 transition-all flex items-center justify-center disabled:opacity-50">
                                <Trash2 className="w-5 h-5" />
                            </button>
                            <button onClick={fetchData} className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 hover:text-white transition-all flex items-center justify-center">
                                <RefreshCw className={cn("w-5 h-5", actionLoading && "animate-spin")} />
                            </button>
                            <button onClick={handleToggle} disabled={actionLoading} className={cn(
                                "px-6 h-12 rounded-lg font-black uppercase text-xs flex items-center justify-center gap-3 border transition-all",
                                isRunning ? "bg-rose-500/10 border-rose-500/50 text-rose-500" : "bg-emerald-500/10 border-emerald-500/50 text-emerald-400"
                            )}>
                                {isRunning ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                                {isRunning ? 'TERMINATE' : 'INITIALIZE'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* METRICS GRID */}
            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                <MetricCard
                    label="NET P&L"
                    value={`$${totalPnL.toFixed(2)}`}
                    subValue={isProfitable ? "PROFITABLE SESSION" : "REVENUE DEFICIT"}
                    icon={DollarSign}
                    trend={isProfitable ? 'up' : 'down'}
                    color={isProfitable ? 'emerald' : 'rose'}
                />
                <MetricCard
                    label="Win Rate"
                    value={winRate > 0 ? `${winRate.toFixed(1)}%` : "N/A"}
                    subValue={`${tradesData?.stats?.winningTrades || 0}W / ${tradesData?.stats?.losingTrades || 0}L`}
                    icon={Target}
                    color="blue"
                />
                <MetricCard label="24h Volume" value={`$${(tradesData?.stats?.totalVolume || 0).toLocaleString()}`} subValue={`${tradeCount} Trades`} icon={Zap} color="purple" />
                <MetricCard
                    label="Runtime"
                    value={isRunning && botStatus?.runtime ? `${botStatus.runtime.hours}h ${botStatus.runtime.minutes}m` : (isRunning ? "Initializing..." : "0h 0m")}
                    subValue={isRunning ? "Active Session" : "Node Offline"}
                    icon={Clock}
                    color="amber"
                />
                <div className="hidden xl:flex bg-slate-900/40 border border-white/5 rounded-xl p-4 flex-col justify-between">
                    <div className="flex items-center gap-2 text-slate-500 mb-1"><Wifi className="w-3 h-3" /> <span className="text-[10px] font-black uppercase">Signal</span></div>
                    <div className="text-xl font-mono font-bold text-emerald-400">{isRunning ? 'STABLE' : 'LOST'}</div>
                    <div className="w-full h-1 bg-slate-800 rounded-full mt-2 overflow-hidden"><div className={cn("h-full bg-emerald-500 transition-all", isRunning ? "w-full" : "w-0")} /></div>
                </div>
            </div>

            {/* TABS */}
            <div className="flex border-b border-white/5">
                {[
                    { id: 'overview', label: 'Dashboard', icon: BarChart3 },
                    { id: 'orders', label: 'Active Orders', icon: Target },
                    { id: 'trades', label: 'Trade History', icon: Zap },
                    { id: 'logs', label: 'System Logs', icon: Terminal },
                    { id: 'config', label: 'Configuration', icon: Settings },
                ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id as SubTabId)} className={cn(
                        "px-6 py-4 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all relative",
                        activeTab === tab.id ? "text-cyan-400 bg-cyan-950/20" : "text-slate-500 hover:text-slate-300"
                    )}>
                        <tab.icon className="w-4 h-4" /> {tab.label}
                        {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-400" />}
                    </button>
                ))}
            </div>

            {/* CONTENT */}
            <div className="min-h-[600px]">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        <div className="xl:col-span-2 space-y-6">
                            <div className="bg-[#0B1221] border border-slate-800 rounded-xl p-6 h-[400px] flex items-center justify-center">
                                {tradesData?.chartData?.length > 0 ? (
                                    <PnLChart data={tradesData.chartData} height={350} />
                                ) : (
                                    <div className="text-center text-slate-600">
                                        <TrendingUp className="w-16 h-16 mx-auto opacity-20 mb-4" />
                                        <p className="text-sm font-bold uppercase tracking-widest">Awaiting execution data</p>
                                    </div>
                                )}
                            </div>
                            <div className="bg-[#0B1221] border border-slate-800 rounded-xl overflow-hidden">
                                <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Live Telemetry</span>
                                    <button onClick={() => setActiveTab('logs')} className="text-[9px] text-cyan-500 font-bold uppercase">View All Logs</button>
                                </div>
                                <div className="h-[200px]">
                                    <StreamingTerminal botId={botId} recentlyActive={isRunning} initialLogs={botStatus?.general_logs?.map((l: any) => ({ timestamp: l.timestamp * 1000, level: l.level_name, message: l.msg }))} />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="bg-[#0B1221] border border-slate-800 rounded-xl p-5">
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Server className="w-3 h-3" /> Execution Metrics</h3>
                                <div className="space-y-3">
                                    <StatRow label="Buy Orders" value={tradesData?.stats?.buyTrades || 0} />
                                    <StatRow label="Sell Orders" value={tradesData?.stats?.sellTrades || 0} />
                                    <StatRow label="Avg Size" value={`$${(tradesData?.stats?.avgTradeSize || 0).toFixed(2)}`} />
                                    <StatRow label="Total Fees" value={`$${(tradesData?.stats?.totalFees || 0).toFixed(2)}`} color="text-rose-400" />
                                </div>
                            </div>
                            <div className="bg-[#0B1221] border border-slate-800 rounded-xl p-5">
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Target className="w-3 h-3" /> Status Overlay</h3>
                                <div className="text-center py-6 border border-dashed border-white/5 rounded-lg space-y-4">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="p-2 bg-slate-900/50 rounded-lg flex flex-col items-center">
                                            <span className="text-[8px] text-slate-500 font-black uppercase">Errors</span>
                                            <span className={cn("text-lg font-black font-mono", (botStatus?.performance?.log_counts?.errors || 0) > 0 ? "text-rose-500" : "text-slate-500")}>
                                                {botStatus?.performance?.log_counts?.errors || 0}
                                            </span>
                                        </div>
                                        <div className="p-2 bg-slate-900/50 rounded-lg flex flex-col items-center">
                                            <span className="text-[8px] text-slate-500 font-black uppercase">Warnings</span>
                                            <span className={cn("text-lg font-black font-mono", (botStatus?.performance?.log_counts?.warnings || 0) > 0 ? "text-amber-500" : "text-slate-500")}>
                                                {botStatus?.performance?.log_counts?.warnings || 0}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-[9px] text-slate-500 font-mono italic block">
                                        {(botStatus?.performance?.log_counts?.errors || 0) > 0 ? "System Integrity Compromised" : "Integration verified. Nominal state."}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'logs' && (
                    <div className="h-[700px] bg-black rounded-xl border border-slate-800 overflow-hidden">
                        <StreamingTerminal botId={botId} recentlyActive={isRunning} initialLogs={botStatus?.general_logs?.map((l: any) => ({ timestamp: l.timestamp * 1000, level: l.level_name, message: l.msg }))} />
                    </div>
                )}

                {activeTab === 'config' && (
                    <DynamicConfigEditor botId={botId} initialConfig={botStatus?.config || {}} onUpdate={fetchData} isRunning={isRunning} />
                )}

                {(activeTab === 'orders' || activeTab === 'trades') && (
                    <div className="bg-[#0B1221] border border-slate-800 rounded-xl min-h-[400px] flex items-center justify-center text-slate-500">
                        <div className="text-center">
                            <h3 className="text-lg font-bold text-white mb-2">Real-Time Data Feed</h3>
                            <p className="text-sm">Historical {activeTab} will populate here upon node activation.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* DELETE MODAL */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in">
                    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={() => !actionLoading && setShowDeleteModal(false)} />
                    <div className="relative w-full max-w-lg bg-[#0B1221] border border-rose-500/20 rounded-[2.5rem] p-10 overflow-hidden">
                        <div className="flex items-center gap-5 mb-8">
                            <div className="p-4 bg-rose-500/10 rounded-2xl"><AlertTriangle className="w-10 h-10 text-rose-500" /></div>
                            <div>
                                <h2 className="text-2xl font-black text-white italic tracking-widest uppercase">Purge Protocol</h2>
                                <p className="text-[10px] font-black text-rose-500/60 uppercase tracking-[0.4em]">Authorization Required</p>
                            </div>
                        </div>
                        <div className="space-y-6 mb-10">
                            <div className="p-6 bg-slate-900/40 rounded-3xl border border-white/5">
                                <span className="text-[10px] text-slate-500 uppercase block mb-1">Target Node</span>
                                <span className="text-xl font-black text-white font-mono">{botName}</span>
                            </div>
                            <div className="space-y-4">
                                <PurgeItem icon={Box} label="Remove Docker Assets" active={actionLoading || deleteSuccess} />
                                <PurgeItem icon={FileText} label="Delete Configuration" active={actionLoading || deleteSuccess} />
                                <PurgeItem icon={DbIcon} label="Wipe Instance Memory" active={actionLoading || deleteSuccess} />
                            </div>
                        </div>
                        <div className="flex gap-4">
                            {!deleteSuccess && <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-5 bg-slate-900 text-slate-400 font-black uppercase text-[10px] rounded-2xl">Abort</button>}
                            <button onClick={handleDelete} disabled={actionLoading || deleteSuccess} className={cn(
                                "flex-[1.5] py-5 rounded-2xl font-black text-[10px] uppercase transition-all",
                                deleteSuccess ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50" : "bg-rose-600 text-white"
                            )}>
                                {deleteSuccess ? 'Mission Terminated' : actionLoading ? 'Processing...' : 'Confirm & Purge'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function MetricCard({ label, value, subValue, icon: Icon, trend, color }: any) {
    const colorClass = {
        emerald: 'text-emerald-400',
        rose: 'text-rose-400',
        blue: 'text-blue-400',
        purple: 'text-purple-400',
        amber: 'text-amber-400'
    }[color as string] || 'text-white';

    return (
        <div className="bg-[#0B1221] border border-slate-800 rounded-xl p-5 h-[110px] flex flex-col justify-between">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 text-slate-500"><Icon className="w-3.5 h-3.5" /><span className="text-[10px] font-black uppercase">{label}</span></div>
                {trend === 'up' && <TrendingUp className="w-3 h-3 text-emerald-500" />}
                {trend === 'down' && <TrendingDown className="w-3 h-3 text-rose-500" />}
            </div>
            <div>
                <div className={cn("text-2xl font-mono font-bold", colorClass)}>{value}</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase">{subValue}</div>
            </div>
        </div>
    );
}

function StatRow({ label, value, color = "text-white" }: any) {
    return (
        <div className="flex justify-between items-center py-2.5 border-b border-slate-800/50 last:border-0">
            <span className="text-[11px] text-slate-400 font-bold uppercase">{label}</span>
            <span className={cn("text-xs font-mono font-bold", color)}>{value}</span>
        </div>
    );
}

function PurgeItem({ icon: Icon, label, active }: any) {
    return (
        <div className={cn("flex items-center gap-4 px-5 py-3 rounded-2xl border transition-all", active ? "bg-emerald-500/5 border-emerald-500/20" : "bg-white/5 border-white/5 opacity-50")}>
            <div className={cn("w-8 h-8 rounded-xl border flex items-center justify-center", active ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-slate-900 border-slate-800 text-slate-600")}>
                <Icon className="w-4 h-4" />
            </div>
            <span className={cn("text-[10px] font-bold uppercase", active ? "text-slate-200" : "text-slate-500")}>{label}</span>
        </div>
    );
}
