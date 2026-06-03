/**
 * ONE TWO — Toast / Modal / ConfirmDialog overlays
 */
'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { Check, Bell, Sparkles, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

// ─────────────── Toast system ───────────────
type ToastTone = 'success' | 'warning' | 'primary' | 'danger';
interface Toast { id: string; tone: ToastTone; title: string; body?: string }

interface ToastCtx {
  push: (t: Omit<Toast, 'id'>) => void;
}
const Ctx = createContext<ToastCtx | null>(null);

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((t: Omit<Toast, 'id'>) => {
    const id = crypto.randomUUID();
    setToasts((cur) => [...cur, { ...t, id }]);
    setTimeout(() => setToasts((cur) => cur.filter((x) => x.id !== id)), 5000);
  }, []);
  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-3.5 w-[320px] max-w-[calc(100vw-2.5rem)]">
        {toasts.map((t) => (
          <ToastCard key={t.id} {...t} onClose={() => setToasts((cur) => cur.filter((x) => x.id !== t.id))} />
        ))}
      </div>
    </Ctx.Provider>
  );
}

const toastIcons: Record<ToastTone, ReactNode> = {
  success: <Check size={16} />,
  warning: <Bell size={16} />,
  primary: <Sparkles size={16} />,
  danger: <AlertCircle size={16} />,
};
const toastCls: Record<ToastTone, { bg: string; fg: string }> = {
  success: { bg: 'bg-success-soft', fg: 'text-success' },
  warning: { bg: 'bg-warning-soft', fg: 'text-warning' },
  primary: { bg: 'bg-primary-soft', fg: 'text-primary' },
  danger:  { bg: 'bg-danger-soft',  fg: 'text-danger' },
};

function ToastCard({ tone, title, body, onClose }: Toast & { onClose: () => void }) {
  const c = toastCls[tone];
  return (
    <div className="bg-paper border border-line rounded-2xl p-3.5 flex gap-3 items-start shadow-s1 animate-in slide-in-from-right">
      <div className={cn('w-9 h-9 rounded-full flex items-center justify-center shrink-0', c.bg, c.fg)}>
        {toastIcons[tone]}
      </div>
      <div className="flex-1">
        <div className="text-[13px] font-medium text-ink">{title}</div>
        {body && <div className="text-[11px] text-ink-soft mt-0.5">{body}</div>}
      </div>
      <button type="button" onClick={onClose} aria-label="Fechar">
        <X size={14} className="text-ink-soft" />
      </button>
    </div>
  );
}

// ─────────────── Modal ───────────────
export function Modal({ open, onClose, children, className }: {
  open: boolean; onClose: () => void; children: ReactNode; className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-40 bg-ink/20 backdrop-blur-[2px] flex items-center justify-center p-5"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn('bg-paper border border-line rounded-[22px] p-7 max-w-[400px] w-full shadow-s3', className)}
      >
        {children}
      </div>
    </div>
  );
}

// ─────────────── ConfirmDialog ───────────────
export function ConfirmDialog({
  open, onClose, onConfirm, title, body, confirmLabel = 'Confirmar', tone = 'primary',
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  body?: string;
  confirmLabel?: string;
  tone?: 'primary' | 'danger';
}) {
  const iconBg = tone === 'danger' ? 'bg-danger-soft text-danger' : 'bg-primary-soft text-primary';
  return (
    <Modal open={open} onClose={onClose}>
      <div className={cn('w-12 h-12 rounded-full flex items-center justify-center', iconBg)}>
        {tone === 'danger' ? <X size={20} /> : <Check size={20} />}
      </div>
      <h2 className="font-serif text-[22px] text-ink mt-4.5 m-0">{title}</h2>
      {body && <p className="text-[13px] text-ink-soft mt-2 leading-[1.55]">{body}</p>}
      <div className="flex gap-2.5 mt-5.5">
        <Button variant="secondary" block onClick={onClose}>Cancelar</Button>
        <Button
          variant={tone === 'danger' ? 'danger' : 'primary'}
          block
          onClick={() => { onConfirm(); onClose(); }}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
