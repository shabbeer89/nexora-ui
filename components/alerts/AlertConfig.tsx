'use client';

import React, { useState } from 'react';
import { Bell, Trash2, Plus } from 'lucide-react';

// Local types (previously from removed server module)
type AlertType = 'price' | 'pnl' | 'risk';
type AlertCondition = 'gt' | 'lt' | 'eq';
interface AlertConfig {
    id: string;
    name: string;
    type: AlertType;
    condition: AlertCondition;
    value: number;
    symbol?: string;
    enabled: boolean;
    channels: string[];
}

export function AlertConfigPanel() {
    const [alerts, setAlerts] = useState<AlertConfig[]>([
        {
            id: '1',
            name: 'BTC Price Alert',
            type: 'price',
            condition: 'gt',
            value: 65000,
            symbol: 'BTC-USDT',
            enabled: true,
            channels: ['email']
        }
    ]);

    const [newAlert, setNewAlert] = useState<Partial<AlertConfig>>({
        type: 'price',
        condition: 'gt',
        channels: ['email']
    });

    const handleAddAlert = () => {
        if (!newAlert.name || !newAlert.value) return;

        const alert: AlertConfig = {
            id: Math.random().toString(36).substr(2, 9),
            name: newAlert.name,
            type: newAlert.type as AlertType,
            condition: newAlert.condition as AlertCondition,
            value: Number(newAlert.value),
            symbol: newAlert.symbol || 'BTC-USDT',
            enabled: true,
            channels: newAlert.channels as any[] || ['email']
        };

        setAlerts([...alerts, alert]);
        setNewAlert({ type: 'price', condition: 'gt', channels: ['email'] });
    };

    const handleDelete = (id: string) => {
        setAlerts(alerts.filter(a => a.id !== id));
    };

    const toggleEnabled = (id: string) => {
        setAlerts(alerts.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
    };

    return (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Bell className="text-blue-500" />
                    Alert Configuration
                </h2>
            </div>

            {/* Add New Alert Form */}
            <div className="bg-gray-800/50 p-4 rounded-lg space-y-4 border border-gray-700">
                <h3 className="text-sm font-medium text-gray-300">Create New Alert</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <input
                        type="text"
                        placeholder="Alert Name"
                        className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white"
                        value={newAlert.name || ''}
                        onChange={e => setNewAlert({ ...newAlert, name: e.target.value })}
                    />
                    <select
                        className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white"
                        value={newAlert.type}
                        onChange={e => setNewAlert({ ...newAlert, type: e.target.value as AlertType })}
                    >
                        <option value="price">Price</option>
                        <option value="pnl">PnL</option>
                        <option value="risk">Risk</option>
                    </select>
                    <div className="flex gap-2">
                        <select
                            className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white w-20"
                            value={newAlert.condition}
                            onChange={e => setNewAlert({ ...newAlert, condition: e.target.value as AlertCondition })}
                        >
                            <option value="gt">&gt;</option>
                            <option value="lt">&lt;</option>
                            <option value="eq">=</option>
                        </select>
                        <input
                            type="number"
                            placeholder="Value"
                            className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white flex-1"
                            value={newAlert.value || ''}
                            onChange={e => setNewAlert({ ...newAlert, value: Number(e.target.value) })}
                        />
                    </div>
                    <button
                        onClick={handleAddAlert}
                        className="bg-blue-600 hover:bg-blue-500 text-white rounded px-4 py-2 text-sm font-medium flex items-center justify-center gap-2"
                    >
                        <Plus size={16} /> Add Alert
                    </button>
                </div>
            </div>

            {/* Alerts List */}
            <div className="space-y-2">
                {alerts.map(alert => (
                    <div key={alert.id} className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className={`w-2 h-2 rounded-full ${alert.enabled ? 'bg-green-500' : 'bg-gray-500'}`} />
                            <div>
                                <p className="font-medium text-white">{alert.name}</p>
                                <p className="text-xs text-gray-400">
                                    {alert.type.toUpperCase()} {alert.symbol ? `(${alert.symbol})` : ''} {alert.condition === 'gt' ? '>' : alert.condition === 'lt' ? '<' : '='} {alert.value}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={alert.enabled}
                                    onChange={() => toggleEnabled(alert.id)}
                                    className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                            <button
                                onClick={() => handleDelete(alert.id)}
                                className="text-gray-500 hover:text-red-500 transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
