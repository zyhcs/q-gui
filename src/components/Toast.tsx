import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type?: 'success' | 'warning' | 'error' | 'info';
  title?: string;
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none">
      {toasts.map((toast) => {
        const type = toast.type || 'info';
        const isSuccess = type === 'success';
        const isWarning = type === 'warning';
        const isError = type === 'error';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-2 fade-in duration-200 ${
              isSuccess
                ? 'bg-zinc-950/90 border-emerald-500/40 text-emerald-300'
                : isWarning
                ? 'bg-zinc-950/90 border-amber-500/40 text-amber-300'
                : isError
                ? 'bg-zinc-950/90 border-rose-500/40 text-rose-300'
                : 'bg-zinc-950/90 border-zinc-700/60 text-zinc-200'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {isWarning && <AlertTriangle className="w-4 h-4 text-amber-400" />}
              {isError && <XCircle className="w-4 h-4 text-rose-400" />}
              {type === 'info' && <Info className="w-4 h-4 text-cyan-400" />}
            </div>

            <div className="flex-1 min-w-0">
              {toast.title && (
                <div className="text-xs font-semibold tracking-wide text-zinc-100 mb-0.5">
                  {toast.title}
                </div>
              )}
              <div className="text-xs leading-relaxed text-zinc-300 break-words">
                {toast.message}
              </div>
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              className="text-zinc-500 hover:text-zinc-300 transition-colors p-0.5 rounded -mr-1 -mt-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
