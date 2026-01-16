"use client";

import { useState, useEffect } from "react";
import {
    Building2, Activity, PieChart as PieChartIcon,
    Wallet, Shield, Server, FileText, Plus, Trash2,
    Copy, Check
} from "lucide-react";
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from "recharts";
import { toast } from "sonner";
import { cn } from "@/utils/cn";
import backendApi from "@/lib/backend-api";

// Types
interface RiskExposure {
    total_exposure: number;
    by_asset: Record<string, { exposure: number, percentage: number }>;
    by_exchange: Record<string, { exposure: number, percentage: number }>;
}

interface UsageReport {
    api_calls: number;
    trades_executed: number;
    strategies_deployed: number;
    estimated_cost: number;
}

interface Allocation {
    strategy_id: string;
    percentage: number;
    allocated_capital: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function InstitutionalPage() {
    const [loading, setLoading] = useState(true);
    const [riskData, setRiskData] = useState<RiskExposure | null>(null);
    const [usageData, setUsageData] = useState<UsageReport | null>(null);
    const [allocations, setAllocations] = useState<Allocation[]>([]);

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Parallel fetch using authenticated client
                const [riskRes, usageRes, perfRes] = await Promise.all([
                    backendApi.get('/institutional/risk/exposure'),
                    backendApi.get('/institutional/usage'),
                    backendApi.get('/institutional/performance/aggregate')
                ]);

                setRiskData(riskRes.data);
                if (usageRes.data) {
                    const data = usageRes.data;
                    setUsageData({ ...data.usage, estimated_cost: data.estimated_cost });
                }

                // Mock allocations based on perf data (or real if endpoint existed)
                if (perfRes.data) {
                    const data = perfRes.data;
                    setAllocations(data.by_strategy?.map((s: any) => ({
                        strategy_id: s.strategy_id,
                        percentage: 20, // Mock
                        allocated_capital: s.pnl * 10 // Mock
                    })) || []);
                }

            } catch (error) {
                console.error(error);
                toast.error("Failed to load institutional data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Format Data for Charts
    const assetData = riskData ? Object.entries(riskData.by_asset).map(([name, val]) => ({
        name, value: val.exposure
    })) : [];

    const exchangeData = riskData ? Object.entries(riskData.by_exchange).map(([name, val]) => ({
        name: name.toUpperCase(), value: val.exposure
    })) : [];

    return (
        <div className="min-h-screen pb-20 space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                    <Building2 className="w-8 h-8 text-blue-500" />
                    Institutional Dashboard
                </h1>
                <p className="text-slate-400 mt-2">Enterprise-grade portfolio management and risk analytics.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card
                    title="Total Exposure"
                    value={riskData ? `$${(riskData.total_exposure / 1000000).toFixed(2)}M` : '...'}
                    icon={Wallet}
                />
                <Card
                    title="API Usage (Month)"
                    value={usageData ? usageData.api_calls.toLocaleString() : '...'}
                    icon={Server}
                />
                <Card
                    title="Active Strategies"
                    value={usageData ? usageData.strategies_deployed : '...'}
                    icon={Activity}
                />
                <Card
                    title="Estimated Cost"
                    value={usageData ? `$${usageData.estimated_cost.toFixed(2)}` : '...'}
                    icon={FileText}
                    alert={usageData && usageData.estimated_cost > 1000}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Risk Exposure by Asset */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <PieChartIcon className="w-5 h-5 text-blue-500" />
                        Risk Exposure by Asset
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={assetData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {assetData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
                                    formatter={(val: any) => [`$${Number(val || 0).toLocaleString()}`, 'Exposure']}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Exchange Exposure */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-green-500" />
                        Exchange Counterparty Risk
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={exchangeData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                                <XAxis type="number" stroke="#64748b" fontSize={12} tickFormatter={(val) => `$${val / 1000}k`} />
                                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} width={80} />
                                <RechartsTooltip
                                    cursor={{ fill: '#1e293b', opacity: 0.4 }}
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
                                    formatter={(val: any) => [`$${Number(val || 0).toLocaleString()}`, 'Exposure']}
                                />
                                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Capital Allocation & API Keys */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Allocation Table */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-white">Strategy Allocation</h3>
                        <button className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg border border-slate-700 transition-colors">
                            Rebalance
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="text-xs text-slate-500 uppercase border-b border-slate-800">
                                <tr>
                                    <th className="pb-3 pl-2">Strategy</th>
                                    <th className="pb-3">Weight</th>
                                    <th className="pb-3">Capital</th>
                                    <th className="pb-3 text-right pr-2">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {allocations.map((alloc) => (
                                    <tr key={alloc.strategy_id} className="text-sm">
                                        <td className="py-3 pl-2 text-white font-medium">{alloc.strategy_id}</td>
                                        <td className="py-3 text-slate-400">{alloc.percentage}%</td>
                                        <td className="py-3 text-white">${alloc.allocated_capital.toLocaleString()}</td>
                                        <td className="py-3 text-right pr-2">
                                            <button className="text-blue-500 hover:text-blue-400 text-xs">Edit</button>
                                        </td>
                                    </tr>
                                ))}
                                {allocations.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-slate-500">
                                            No allocations set
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* API Keys Management */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-white">API Keys</h3>
                        <button className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors">
                            <Plus className="w-3 h-3" />
                            Create Key
                        </button>
                    </div>

                    <div className="space-y-3">
                        {[{ name: "Production Read-Write", key: "pk_live_...8f9a", date: "2024-12-01" }, { name: "Audit Read-Only", key: "pk_live_...2d1b", date: "2024-11-15" }].map((key, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <div>
                                    <div className="text-sm font-medium text-white">{key.name}</div>
                                    <div className="text-xs text-slate-500 font-mono mt-0.5">{key.key}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-slate-600 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                                        {key.date}
                                    </span>
                                    <button className="text-slate-500 hover:text-red-500 p-1.5 hover:bg-slate-900 rounded transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

const Card = ({ title, value, icon: Icon, alert }: any) => (
    <div className={cn(
        "bg-slate-900/50 border rounded-xl p-6",
        alert ? "border-red-500/30 bg-red-500/5" : "border-slate-800"
    )}>
        <div className="flex justify-between items-start mb-4">
            <div className={cn("p-2 rounded-lg border", alert ? "bg-red-500/10 border-red-500/20" : "bg-slate-950 border-slate-800")}>
                <Icon className={cn("w-5 h-5", alert ? "text-red-500" : "text-slate-400")} />
            </div>
        </div>
        <div>
            <h3 className={cn("text-sm font-medium mb-1", alert ? "text-red-300" : "text-slate-400")}>{title}</h3>
            <div className={cn("text-2xl font-bold", alert ? "text-red-400" : "text-white")}>{value}</div>
        </div>
    </div>
);
