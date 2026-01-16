'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface PaginationProps {
    page: number;
    totalPages: number;
    limit: number;
    total: number;
    onPageChange: (page: number) => void;
    onLimitChange?: (limit: number) => void;
    limitOptions?: number[];
    className?: string;
}

const defaultLimitOptions = [10, 25, 50, 100];

export function Pagination({
    page,
    totalPages,
    limit,
    total,
    onPageChange,
    onLimitChange,
    limitOptions = defaultLimitOptions,
    className = '',
}: PaginationProps) {
    const canGoPrev = page > 1;
    const canGoNext = page < totalPages;

    // Generate page numbers to show
    const getPageNumbers = () => {
        const pages: (number | 'ellipsis')[] = [];
        const showPages = 5;

        if (totalPages <= showPages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show first page
            pages.push(1);

            if (page > 3) {
                pages.push('ellipsis');
            }

            // Show pages around current
            const start = Math.max(2, page - 1);
            const end = Math.min(totalPages - 1, page + 1);

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (page < totalPages - 2) {
                pages.push('ellipsis');
            }

            // Always show last page
            if (totalPages > 1) {
                pages.push(totalPages);
            }
        }

        return pages;
    };

    if (total === 0) {
        return null;
    }

    return (
        <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-4 ${className}`}>
            {/* Left side - Page size selector */}
            {onLimitChange && (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                    <span>Show</span>
                    <select
                        value={limit}
                        onChange={(e) => onLimitChange(Number(e.target.value))}
                        className="bg-slate-800/50 border border-slate-700 text-slate-300 text-xs rounded-lg px-2 py-1.5 focus:ring-blue-500 focus:border-blue-500 cursor-pointer hover:border-slate-600"
                    >
                        {limitOptions.map((opt) => (
                            <option key={opt} value={opt}>
                                {opt}
                            </option>
                        ))}
                    </select>
                    <span>per page</span>
                </div>
            )}

            {/* Right side - Pagination controls */}
            <div className="flex items-center gap-1">
                {/* First page */}
                <button
                    onClick={() => onPageChange(1)}
                    disabled={!canGoPrev}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="First page"
                >
                    <ChevronsLeft className="w-4 h-4" />
                </button>

                {/* Previous page */}
                <button
                    onClick={() => onPageChange(page - 1)}
                    disabled={!canGoPrev}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Previous page"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-1 mx-2">
                    {getPageNumbers().map((pageNum, idx) =>
                        pageNum === 'ellipsis' ? (
                            <span key={`ellipsis-${idx}`} className="px-2 text-slate-500">
                                ...
                            </span>
                        ) : (
                            <button
                                key={pageNum}
                                onClick={() => onPageChange(pageNum)}
                                className={`min-w-[32px] h-8 rounded-lg text-xs font-medium transition-colors ${page === pageNum
                                        ? 'bg-blue-500 text-white'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                    }`}
                            >
                                {pageNum}
                            </button>
                        )
                    )}
                </div>

                {/* Next page */}
                <button
                    onClick={() => onPageChange(page + 1)}
                    disabled={!canGoNext}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Next page"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>

                {/* Last page */}
                <button
                    onClick={() => onPageChange(totalPages)}
                    disabled={!canGoNext}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Last page"
                >
                    <ChevronsRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
