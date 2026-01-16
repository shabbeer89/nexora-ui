"use client";

import { useState } from "react";
import { AlertTriangle, Trash2, X, Loader2, Database, FileCode, FolderOpen, Container } from "lucide-react";
import { cn } from "@/utils/cn";

interface DeleteBotModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    botName: string;
    botId: string;
}

export function DeleteBotModal({ isOpen, onClose, onConfirm, botName, botId }: DeleteBotModalProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [confirmText, setConfirmText] = useState("");

    if (!isOpen) return null;

    const handleConfirm = async () => {
        if (confirmText !== "DELETE") return;

        setIsDeleting(true);
        try {
            await onConfirm();
            onClose();
        } catch (error) {
            // Error handling done by parent
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={!isDeleting ? onClose : undefined}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md mx-4 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                {/* Close button */}
                <button
                    onClick={onClose}
                    disabled={isDeleting}
                    className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header with warning icon */}
                <div className="p-6 pb-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30">
                            <AlertTriangle className="w-8 h-8 text-red-500 animate-pulse" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Delete Bot</h3>
                            <p className="text-slate-400 text-sm mt-1">This action cannot be undone</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">
                    {/* Bot name display */}
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                        <p className="text-sm text-slate-400 mb-1">Bot to delete:</p>
                        <p className="text-lg font-semibold text-white font-mono">{botName}</p>
                    </div>

                    {/* What will be deleted */}
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-slate-300">The following will be permanently removed:</p>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/5 border border-red-500/10">
                                <FileCode className="w-4 h-4 text-red-400" />
                                <span className="text-sm text-slate-300">Config files</span>
                            </div>
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/5 border border-red-500/10">
                                <Container className="w-4 h-4 text-red-400" />
                                <span className="text-sm text-slate-300">Docker container</span>
                            </div>
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/5 border border-red-500/10">
                                <Database className="w-4 h-4 text-red-400" />
                                <span className="text-sm text-slate-300">Trade history</span>
                            </div>
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/5 border border-red-500/10">
                                <FolderOpen className="w-4 h-4 text-red-400" />
                                <span className="text-sm text-slate-300">Instance data</span>
                            </div>
                        </div>
                    </div>

                    {/* Confirmation input */}
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">
                            Type <span className="text-red-400 font-mono font-bold">DELETE</span> to confirm:
                        </label>
                        <input
                            type="text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                            placeholder="DELETE"
                            disabled={isDeleting}
                            className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 disabled:opacity-50 transition-colors"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="p-6 pt-0 flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isDeleting}
                        className="flex-1 px-4 py-3 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isDeleting || confirmText !== "DELETE"}
                        className={cn(
                            "flex-1 px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all",
                            confirmText === "DELETE" && !isDeleting
                                ? "bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-500 hover:to-red-400 shadow-lg shadow-red-900/30"
                                : "bg-slate-800 text-slate-500 cursor-not-allowed"
                        )}
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            <>
                                <Trash2 className="w-4 h-4" />
                                Delete Bot
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
