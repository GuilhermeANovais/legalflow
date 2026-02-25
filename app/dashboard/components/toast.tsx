"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

let toastCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = "info") => {
        const id = ++toastCounter;
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto-dismiss after 4s
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    const dismiss = (id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    const iconMap = {
        success: <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />,
        error: <AlertTriangle size={18} className="text-red-500 shrink-0" />,
        info: <Info size={18} className="text-blue-500 shrink-0" />,
    };

    const bgMap = {
        success: "bg-emerald-50 border-emerald-200",
        error: "bg-red-50 border-red-200",
        info: "bg-blue-50 border-blue-200",
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Toast Container */}
            <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-2xl border shadow-lg backdrop-blur-sm max-w-sm animate-in slide-in-from-right-5 fade-in duration-300 ${bgMap[toast.type]}`}
                    >
                        {iconMap[toast.type]}
                        <p className="text-sm font-medium text-slate-800 flex-1">{toast.message}</p>
                        <button
                            onClick={() => dismiss(toast.id)}
                            className="p-1 rounded-full hover:bg-white/50 transition-colors"
                        >
                            <X size={14} className="text-slate-400" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast deve ser usado dentro de <ToastProvider>");
    return ctx;
}
