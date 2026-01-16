'use client';

import React from 'react';
import { Download, Filter } from 'lucide-react';

export type TimeRange = '1d' | '2d' | '1w' | '1m' | '3m' | 'all';

export interface DataTableFiltersProps {
    // Time range
    timeRange: TimeRange;
    onTimeRangeChange: (range: TimeRange) => void;

    // Optional status filter (for orders)
    statusFilter?: string;
    statusOptions?: { value: string; label: string }[];
    onStatusChange?: (status: string) => void;

    // Optional side filter
    sideFilter?: string;
    onSideChange?: (side: string) => void;

    // Export
    onExport?: () => void;
    exportLoading?: boolean;

    // Row count display
    showing?: { from: number; to: number };
    total?: number;

    // Custom className
    className?: string;
}

const timeRangeOptions: { value: TimeRange; label: string }[] = [
    { value: '1d', label: '1D' },
    { value: '2d', label: '2D' },
    { value: '1w', label: '1W' },
    { value: '1m', label: '1M' },
    { value: '3m', label: '3M' },
    { value: 'all', label: 'All' },
];

const sideOptions = [
    { value: 'all', label: 'All Sides' },
    { value: 'buy', label: 'Buy Only' },
    { value: 'sell', label: 'Sell Only' },
];

export function DataTableFilters({
    timeRange,
    onTimeRangeChange,
    statusFilter,
    statusOptions,
    onStatusChange,
    sideFilter,
    onSideChange,
    onExport,
    exportLoading,
    showing,
    total,
    className = '',
}: DataTableFiltersProps) {
    return (
        <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${className}`}>
            {/* Left side - Filters */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Time Range Toggle */}
                <div className="flex items-center bg-slate-800/50 rounded-lg p-1">
                    {timeRangeOptions.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => onTimeRangeChange(option.value)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${timeRange === option.value
                                    ? 'bg-blue-500 text-white shadow-sm'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>

                {/* Status Filter (optional) */}
                {statusOptions && onStatusChange && (
                    <div className="relative">
                        <select
                            value={statusFilter || 'all'}
                            onChange={(e) => onStatusChange(e.target.value)}
                            className="appearance-none bg-slate-800/50 border border-slate-700 text-slate-300 text-xs rounded-lg pl-3 pr-8 py-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer hover:border-slate-600"
                        >
                            {statusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
                    </div>
                )}

                {/* Side Filter */}
                {onSideChange && (
                    <div className="relative">
                        <select
                            value={sideFilter || 'all'}
                            onChange={(e) => onSideChange(e.target.value)}
                            className="appearance-none bg-slate-800/50 border border-slate-700 text-slate-300 text-xs rounded-lg pl-3 pr-8 py-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer hover:border-slate-600"
                        >
                            {sideOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
                    </div>
                )}
            </div>

            {/* Right side - Row count & Export */}
            <div className="flex items-center gap-3">
                {/* Row count display */}
                {showing && total !== undefined && (
                    <span className="text-xs text-slate-500">
                        Showing <span className="text-slate-300">{showing.from}-{showing.to}</span> of{' '}
                        <span className="text-slate-300">{total.toLocaleString()}</span>
                    </span>
                )}

                {/* Export button */}
                {onExport && (
                    <button
                        onClick={onExport}
                        disabled={exportLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 bg-slate-800/50 border border-slate-700 rounded-lg hover:text-white hover:border-slate-600 transition-colors disabled:opacity-50"
                    >
                        <Download className="w-3.5 h-3.5" />
                        CSV
                    </button>
                )}
            </div>
        </div>
    );
}
