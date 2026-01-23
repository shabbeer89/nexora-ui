'use client';

import { useState, useEffect } from 'react';
import {
    ChevronRight,
    ChevronLeft,
    Rocket,
    Cpu,
    Target,
    Shield,
    Zap,
    Trash2,
    Settings,
    ArrowRight,
    Search,
    Network,
    Activity,
    BrainCircuit,
    Info,
    CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { backendApi } from '@/lib/backend-api';
import { toast } from 'sonner';

interface BotWizardProps {
    onClose: () => void;
    onSuccess: () => void;
}

const MISSIONS = [
    { id: 'steady', label: 'Steady Gains', description: 'Low volatility, consistent growth', icon: Activity, color: 'text-emerald-400', strategies: ['dca', 'liquidity_mining'] },
    { id: 'neutral', label: 'Market Neutral', description: 'Profit from volatility, regardless of trend', icon: Target, color: 'text-blue-400', strategies: ['pmm', 'avellaneda'] },
    { id: 'alpha', label: 'High Octane', description: 'Aggressive alpha generation', icon: Zap, color: 'text-rose-400', strategies: ['dman', 'smart_bot'] }
];

const STRATEGIES = [
    { id: 'dca', label: 'Dollar Cost Averaging', desc: 'Accumulate assets during dips', mission: 'steady' },
    { id: 'pmm', label: 'Pure Market Making', desc: 'Institutional grade bidirectional liquidity', mission: 'neutral' },
    { id: 'liquidity_mining', label: 'Liquidity Mining', desc: 'High yield DEX pool operations', mission: 'steady' },
    { id: 'smart_bot', label: 'Nexora AI v4', desc: 'ML-driven adaptive regime strategy', mission: 'alpha' }
];

export default function BotWizard({ onClose, onSuccess }: BotWizardProps) {
    const [step, setStep] = useState(1);
    const [isDeploying, setIsDeploying] = useState(false);

    const [formData, setFormData] = useState({
        name: `Node-${Math.floor(Math.random() * 9000) + 1000}`,
        mission: 'steady',
        strategy: 'dca',
        exchange: 'binance',
        pair: 'BTC-USDT',
        amount: '1000',
        risk: 'medium'
    });

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);

    const handleLaunch = async () => {
        setIsDeploying(true);
        const loadingId = toast.loading('Initializing Mission Control...');
        try {
            // Prepare the payload for the real deployment API
            const payload = {
                name: formData.name,
                strategy: formData.strategy,
                exchange: formData.exchange,
                pair: formData.pair.replace('-', '/'), // Ensure format matches Hummingbot expectations (e.g. BTC/USDT)
                isPaperTrade: formData.exchange.includes('paper_trade') || formData.exchange.includes('mock'),
                parameters: {
                    order_amount: formData.amount,
                    // Add other defaults based on strategy if needed, 
                    // though the deploy route has fallbacks.
                },
                riskSettings: {
                    max_position_usd: formData.amount,
                    // More detailed risk mapping can be added here
                }
            };

            const response = await backendApi.post('/bots/deploy', payload);

            if (response.data.success) {
                toast.dismiss(loadingId);
                toast.success(`Mission ${formData.name} Initialized!`);
                onSuccess();
            } else {
                throw new Error(response.data.error || 'Unknown error during deployment');
            }
        } catch (error: any) {
            console.error('Launch Error:', error);
            toast.dismiss(loadingId);
            toast.error(error.response?.data?.error || error.message || 'Mission Initialization Failed.');
        } finally {
            setIsDeploying(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Header */}
            <div className="flex justify-between items-center bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8">
                <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                        <Rocket className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Node Initialization Wizard</h2>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Step {step} of 4: {['Select Mission', 'Protocol Selection', 'Fleet Configuration', 'Final Review'][step - 1]}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                                "w-8 h-1 rounded-full transition-all duration-500",
                                step > i ? "bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" : "bg-white/5"
                            )}
                        />
                    ))}
                </div>
            </div>

            {/* Step Content */}
            <div className="min-h-[400px]">
                {step === 1 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        {MISSIONS.map(m => (
                            <div
                                key={m.id}
                                onClick={() => { setFormData({ ...formData, mission: m.id }); handleNext(); }}
                                className={cn(
                                    "bg-[#0b1120]/60 backdrop-blur-2xl border-2 rounded-[2.5rem] p-10 cursor-pointer transition-all duration-500 hover:-translate-y-2 group",
                                    formData.mission === m.id ? "border-cyan-500/50 bg-cyan-500/5 shadow-[0_0_40px_rgba(6,182,212,0.1)]" : "border-white/5 hover:border-white/10"
                                )}
                            >
                                <div className={cn("w-16 h-16 rounded-[1.5rem] bg-white/5 flex items-center justify-center mb-8 border border-white/5 group-hover:scale-110 transition-transform duration-500", m.color)}>
                                    <m.icon className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">{m.label}</h3>
                                <p className="text-xs text-slate-500 leading-relaxed font-mono">{m.description}</p>
                            </div>
                        ))}
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] pl-2 mb-4 text-center">Available protocols for {formData.mission}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {STRATEGIES.filter(s => s.mission === formData.mission || formData.mission === 'alpha').map(s => (
                                <div
                                    key={s.id}
                                    onClick={() => setFormData({ ...formData, strategy: s.id })}
                                    className={cn(
                                        "bg-[#0b1120]/60 backdrop-blur-2xl border rounded-[2rem] p-8 cursor-pointer transition-all flex items-center gap-6",
                                        formData.strategy === s.id ? "border-cyan-500/50 bg-cyan-500/5" : "border-white/5 hover:border-white/10"
                                    )}
                                >
                                    <div className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center border",
                                        formData.strategy === s.id ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" : "bg-white/5 border-white/5 text-slate-600"
                                    )}>
                                        <BrainCircuit className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-white uppercase tracking-wider">{s.label}</h4>
                                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">{s.desc}</p>
                                    </div>
                                    {formData.strategy === s.id && <CheckCircle2 className="w-5 h-5 text-cyan-400 ml-auto" />}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Node Name</label>
                                <input
                                    className="w-full bg-[#0b1120]/80 border border-white/10 rounded-2xl px-6 py-4 text-white font-mono outline-none focus:border-cyan-500/50 transition-all"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Trading Pair</label>
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        className="w-full bg-[#0b1120]/80 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-white font-mono outline-none focus:border-cyan-500/50 transition-all"
                                        value={formData.pair}
                                        onChange={e => setFormData({ ...formData, pair: e.target.value.toUpperCase() })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Initial Allocation (USD)</label>
                                <input
                                    type="number"
                                    className="w-full bg-[#0b1120]/80 border border-white/10 rounded-2xl px-6 py-4 text-white font-mono outline-none focus:border-cyan-500/50 transition-all"
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                />
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Deployment Target</label>
                                <select
                                    className="w-full bg-[#0b1120]/80 border border-white/10 rounded-2xl px-6 py-4 text-white font-mono outline-none focus:border-cyan-500/50 transition-all appearance-none"
                                    value={formData.exchange}
                                    onChange={e => setFormData({ ...formData, exchange: e.target.value })}
                                >
                                    <option value="binance">Binance (CEX)</option>
                                    <option value="kucoin">KuCoin (CEX)</option>
                                    <option value="uniswap">Uniswap V3 (DEX)</option>
                                    <option value="gate_io">Gate.io (CEX)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="bg-[#0b1120]/60 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-10">
                            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-10 text-center">Pre-Flight Review</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-10">
                                <div>
                                    <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Protocol</div>
                                    <div className="text-lg font-black text-white uppercase">{formData.strategy}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Network</div>
                                    <div className="text-lg font-black text-cyan-400 uppercase">{formData.exchange}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Symbol</div>
                                    <div className="text-lg font-black text-white">{formData.pair}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Liquidity</div>
                                    <div className="text-lg font-black text-emerald-400">${formData.amount}</div>
                                </div>
                            </div>
                            <div className="p-6 bg-cyan-500/5 border border-cyan-500/10 rounded-2xl flex items-start gap-4">
                                <Info className="w-5 h-5 text-cyan-500 mt-1" />
                                <div className="text-[10px] text-slate-400 font-mono leading-relaxed">
                                    By initializing this node, Nexora will deploy a sandboxed trading container with the specified parameters. Safety checks are enabled by default for this mission.
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="flex justify-between items-center pt-8 border-t border-white/5">
                <button
                    onClick={step === 1 ? onClose : handleBack}
                    className="px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all flex items-center gap-2"
                >
                    <ChevronLeft className="w-4 h-4" />
                    {step === 1 ? 'Cancel' : 'Rollback'}
                </button>

                {step < 4 ? (
                    <button
                        onClick={handleNext}
                        className="px-10 py-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white transition-all flex items-center gap-3 shadow-xl"
                    >
                        Advance Configuration
                        <ChevronRight className="w-4 h-4" />
                    </button>
                ) : (
                    <button
                        onClick={handleLaunch}
                        disabled={isDeploying}
                        className="px-12 py-5 rounded-[1.5rem] bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all flex items-center gap-4 group"
                    >
                        <Rocket className={cn("w-5 h-5 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform", isDeploying && "animate-bounce")} />
                        <span className="text-xs font-black uppercase tracking-widest">Authorize & Initialize Node</span>
                    </button>
                )}
            </div>
        </div>
    );
}
