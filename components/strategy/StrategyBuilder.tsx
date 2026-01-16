'use client';

import React, { useState, useEffect } from 'react';
import { StrategyType, StrategyConfig, STRATEGY_TEMPLATES, StrategyParameter } from '@/types/strategy';
import { Save, Play, Info } from 'lucide-react';

interface StrategyBuilderProps {
    initialConfig?: StrategyConfig;
    onSave: (config: StrategyConfig) => void;
}

export function StrategyBuilder({ initialConfig, onSave }: StrategyBuilderProps) {
    const [name, setName] = useState(initialConfig?.name || '');
    const [description, setDescription] = useState(initialConfig?.description || '');
    const [type, setType] = useState<StrategyType>(initialConfig?.type || 'pure_market_making');
    const [parameters, setParameters] = useState<Record<string, any>>(initialConfig?.parameters || {});

    // Reset parameters when type changes if not editing existing
    useEffect(() => {
        if (!initialConfig) {
            const defaultParams: Record<string, any> = {};
            STRATEGY_TEMPLATES[type].forEach(param => {
                defaultParams[param.name] = param.defaultValue;
            });
            setParameters(defaultParams);
        }
    }, [type, initialConfig]);

    const handleParamChange = (name: string, value: any) => {
        setParameters(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        if (!name) return;

        const config: StrategyConfig = {
            id: initialConfig?.id || Math.random().toString(36).substr(2, 9),
            name,
            description,
            type,
            parameters,
            created: initialConfig?.created || Date.now(),
            updated: Date.now(),
            status: initialConfig?.status || 'inactive'
        };

        onSave(config);
    };

    return (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Strategy Builder</h2>
                <button
                    onClick={handleSave}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
                >
                    <Save size={18} /> Save Strategy
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Basic Info */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Strategy Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="My Strategy"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Strategy Type</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value as StrategyType)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="pure_market_making">Pure Market Making</option>
                            <option value="cross_exchange_market_making">Cross Exchange MM</option>
                            <option value="avellaneda_market_making">Avellaneda MM</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none h-32 resize-none"
                            placeholder="Describe your strategy logic..."
                        />
                    </div>
                </div>

                {/* Dynamic Parameters */}
                <div className="lg:col-span-2 bg-gray-800/30 rounded-xl border border-gray-800 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Configuration Parameters</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {STRATEGY_TEMPLATES[type].map((param) => (
                            <ParameterInput
                                key={param.name}
                                param={param}
                                value={parameters[param.name]}
                                onChange={(val) => handleParamChange(param.name, val)}
                            />
                        ))}
                        {STRATEGY_TEMPLATES[type].length === 0 && (
                            <div className="col-span-2 text-center py-12 text-gray-500">
                                No parameters defined for this strategy type yet.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function ParameterInput({
    param,
    value,
    onChange,
    warning
}: {
    param: StrategyParameter;
    value: any;
    onChange: (val: any) => void;
    warning?: string;
}) {
    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-300">{param.label}</label>
                <div className="group relative">
                    <Info size={14} className="text-gray-500 cursor-help" />
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-gray-900 text-xs text-gray-300 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border border-gray-800">
                        {param.description}
                    </div>
                </div>
            </div>

            {param.type === 'select' && (
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                    {param.options?.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            )}

            {(param.type === 'string' || param.type === 'number' || param.type === 'percentage') && (
                <input
                    type={param.type === 'string' ? 'text' : 'number'}
                    value={value ?? (param.type === 'string' ? "" : 0)}
                    onChange={(e) => onChange(param.type === 'number' || param.type === 'percentage' ? Number(e.target.value) : e.target.value)}
                    step={param.step}
                    min={param.min}
                    max={param.max}
                    className={`w-full bg-gray-800 border rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none ${warning ? 'border-amber-500/50 focus:border-amber-500' : 'border-gray-700'}`}
                />
            )}

            {param.type === 'boolean' && (
                <label className="relative inline-flex items-center cursor-pointer mt-2">
                    <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => onChange(e.target.checked)}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            )}

            {warning && (
                <p className="text-xs text-amber-400 font-medium animate-in fade-in slide-in-from-top-1">
                    ⚠️ {warning}
                </p>
            )}
        </div>
    );
}
