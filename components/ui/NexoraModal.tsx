"use client";

import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    maxWidth?: string;
}

export function NexoraModal({ isOpen, onClose, title, children, footer, maxWidth = "max-w-md" }: ModalProps) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
                />

                {/* Modal Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className={cn(
                        "relative w-full overflow-hidden gelly-card bg-slate-900 border border-white/10 shadow-2xl",
                        maxWidth
                    )}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/5">
                        <h3 className="text-lg font-black text-white uppercase tracking-tighter">{title}</h3>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {children}
                    </div>

                    {/* Footer */}
                    {footer && (
                        <div className="p-6 pt-0 flex justify-end gap-3">
                            {footer}
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
