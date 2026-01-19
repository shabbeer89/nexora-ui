'use client';

import { useState } from 'react';
import RegimeDashboard from '@/components/nexora/RegimeDashboard';
import UnifiedPortfolio from '@/components/nexora/UnifiedPortfolio';
import StrategyPerformance from '@/components/nexora/StrategyPerformance';
import RiskMonitoring from '@/components/nexora/RiskMonitoring';
import EngineControl from '@/components/nexora/EngineControl';
import PairlistTuner from '@/components/nexora/PairlistTuner';
import MacroContextDashboard from '@/components/nexora/MacroContextDashboard';
import FreqAIModelStatus from '@/components/nexora/FreqAIModelStatus';
import PerformanceAnalytics from '@/components/nexora/PerformanceAnalytics';
import EmergencyControls from '@/components/nexora/EmergencyControls';
import TradeManagerUI from '@/components/nexora/TradeManagerUI';
import AdvancedOrdersUI from '@/components/nexora/AdvancedOrdersUI';
import AlertsManager from '@/components/nexora/AlertsManager';
import HyperoptDashboard from '@/components/nexora/HyperoptDashboard';
import DrawdownTracker from '@/components/nexora/DrawdownTracker';
import TradingCockpit from '@/components/dashboard/TradingCockpit';

type TabType = 'overview' | 'portfolio' | 'strategies' | 'risk' | 'engines' | 'cockpit' | 'macro' | 'ml' | 'analytics' | 'emergency' | 'trades' | 'orders' | 'alerts' | 'hyperopt' | 'drawdown';

export default function NexoraDashboard() {
    const [activeTab, setActiveTab] = useState<TabType>('overview');

    const tabs = [
        { id: 'overview', label: 'Tactical Overview', icon: '📡' },
        { id: 'portfolio', label: 'Liquidity Vault', icon: '🏦' },
        { id: 'strategies', label: 'Alpha Engines', icon: '⚡' },
        { id: 'risk', label: 'Risk Guardian', icon: '🛡️' },
        { id: 'macro', label: 'Macro Context', icon: '🌍' },
        { id: 'ml', label: 'FreqAI Models', icon: '🧠' },
        { id: 'analytics', label: 'Performance', icon: '📊' },
        { id: 'trades', label: 'Active Trades', icon: '💼' },
        { id: 'orders', label: 'Advanced Orders', icon: '⚡' },
        { id: 'alerts', label: 'Alerts', icon: '🔔' },
        { id: 'hyperopt', label: 'Optimization', icon: '🎯' },
        { id: 'drawdown', label: 'Drawdown', icon: '📉' },
        { id: 'engines', label: 'Protocol Engines', icon: '⚙️' },
        { id: 'emergency', label: 'Emergency', icon: '🚨' },
        { id: 'cockpit', label: 'Tactical Cockpit', icon: '🕹️' },
    ];

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200">
            {/* Ambient Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-600/10 to-transparent"></div>
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px]"></div>
                <div className="absolute top-1/2 left-1/4 w-[300px] h-[300px] bg-cyan-600/5 rounded-full blur-[100px]"></div>
            </div>

            {/* Strategic Header */}
            <header className="relative z-10 border-b border-white/5 bg-slate-950/50 backdrop-blur-xl">
                <div className="max-w-[1600px] mx-auto px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                                <span className="font-black text-white text-xs">NX</span>
                            </div>
                            <h1 className="text-2xl font-black text-white tracking-tighter uppercase">Nexora <span className="text-cyan-400">Mission Control</span></h1>
                        </div>
                        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.3em]">Quantum-Ready Hybrid Trading Infrastructure</p>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-2xl">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500/80">API LINK: SECURE</span>
                        </div>
                        <div className="hidden lg:block text-right">
                            <div className="text-[10px] font-mono text-slate-500 uppercase">System Latency</div>
                            <div className="text-xs font-black text-cyan-400">14ms AVG</div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Tactical Navigation */}
            <nav className="relative z-10 sticky top-0 border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
                <div className="max-w-[1600px] mx-auto px-8">
                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as TabType)}
                                className={`group py-4 px-6 flex items-center gap-2 transition-all relative ${activeTab === tab.id
                                    ? 'text-white'
                                    : 'text-slate-500 hover:text-slate-300'
                                    }`}
                            >
                                <span className="text-lg">{tab.icon}</span>
                                <span className="text-xs font-black uppercase tracking-widest">{tab.label}</span>
                                {activeTab === tab.id && (
                                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 shadow-[0_0_10px_rgba(6,182,212,0.8)]"></div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </nav>

            {/* Main Stage */}
            <main className="relative z-10 max-w-[1600px] mx-auto px-8 py-10">
                {activeTab === 'overview' && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                            <RegimeDashboard />
                            <RiskMonitoring />
                        </div>
                        <div className="pt-4">
                            <UnifiedPortfolio />
                        </div>
                    </div>
                )}

                {activeTab === 'portfolio' && (
                    <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                        <UnifiedPortfolio />
                    </div>
                )}

                {activeTab === 'strategies' && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                        <StrategyPerformance />
                    </div>
                )}

                {activeTab === 'risk' && (
                    <div className="animate-in fade-in zoom-in-95 duration-500">
                        <RiskMonitoring />
                    </div>
                )}

                {activeTab === 'engines' && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-top-4 duration-500">
                        <EngineControl />
                        <div className="pt-10 border-t border-white/5">
                            <PairlistTuner />
                        </div>
                    </div>
                )}

                {activeTab === 'cockpit' && (
                    <div className="animate-in fade-in zoom-in-95 duration-700">
                        <TradingCockpit symbol="BTC-USDT" />
                    </div>
                )}

                {activeTab === 'macro' && (
                    <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                        <MacroContextDashboard />
                    </div>
                )}

                {activeTab === 'ml' && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                        <FreqAIModelStatus />
                    </div>
                )}

                {activeTab === 'analytics' && (
                    <div className="animate-in fade-in zoom-in-95 duration-500">
                        <PerformanceAnalytics />
                    </div>
                )}

                {activeTab === 'emergency' && (
                    <div className="animate-in fade-in zoom-in-90 duration-500">
                        <EmergencyControls />
                    </div>
                )}

                {activeTab === 'trades' && (
                    <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                        <TradeManagerUI />
                    </div>
                )}

                {activeTab === 'orders' && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                        <AdvancedOrdersUI />
                    </div>
                )}

                {activeTab === 'alerts' && (
                    <div className="animate-in fade-in zoom-in-95 duration-500">
                        <AlertsManager />
                    </div>
                )}

                {activeTab === 'hyperopt' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <HyperoptDashboard />
                    </div>
                )}

                {activeTab === 'drawdown' && (
                    <div className="animate-in fade-in zoom-in-95 duration-500">
                        <DrawdownTracker />
                    </div>
                )}
            </main>

            {/* Strategic Footer */}
            <footer className="relative z-10 mt-20 border-t border-white/5 bg-slate-950/80 backdrop-blur-xl">
                <div className="max-w-[1600px] mx-auto px-8 py-12">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="flex items-center gap-4">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Core Engine v1.0.42-STABLE</div>
                            <div className="w-1 h-1 rounded-full bg-slate-700"></div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-cyan-500/80">CEX: SOL-Trend-AI</div>
                            <div className="w-1 h-1 rounded-full bg-slate-700"></div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-purple-500/80">DEX: USDC-SOL-Yield</div>
                        </div>

                        <div className="flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.2em]">
                            <a href="/docs" target="_blank" className="text-slate-500 hover:text-cyan-400 transition-colors">Documentation</a>
                            <a href="#" className="text-slate-500 hover:text-white transition-colors">Protocol Status</a>
                            <div className="px-4 py-2 border border-white/10 rounded-full bg-white/5 text-slate-400">
                                Local Node: <span className="text-white">Active</span>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
