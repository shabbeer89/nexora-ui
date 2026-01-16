import React from 'react';
import { Info } from 'lucide-react';

interface OrderFormLayoutProps {
    title: string;
    description: string;
    children: React.ReactNode;
    onSubmit: (e: React.FormEvent) => void;
    isSubmitting?: boolean;
    submitLabel?: string;
}

export function OrderFormLayout({
    title,
    description,
    children,
    onSubmit,
    isSubmitting = false,
    submitLabel = 'Place Order'
}: OrderFormLayoutProps) {
    return (
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
            <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-200">{title}</h3>
                    <div className="group relative">
                        <Info size={14} className="text-gray-500 cursor-help" />
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-gray-800 text-xs text-gray-300 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                            {description}
                        </div>
                    </div>
                </div>
                <p className="text-xs text-gray-500">{description}</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
                {children}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                >
                    {isSubmitting ? 'Placing Order...' : submitLabel}
                </button>
            </form>
        </div>
    );
}
