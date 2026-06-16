import { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmDialog({
    open,
    title,
    message,
    confirmLabel = 'Delete',
    cancelLabel = 'Cancel',
    onConfirm,
    onCancel
}: ConfirmDialogProps) {
    const confirmRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (open) confirmRef.current?.focus();
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCancel();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onCancel]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-50 bg-black/45"
            role="presentation"
            onClick={onCancel}
        >
            <div
                className="rounded-xl p-6 w-[min(90vw,400px)] flex flex-col gap-4 shadow-xl"
                style={{ background: 'var(--surface)' }}
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-title"
                aria-describedby="confirm-message"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 id="confirm-title" className="m-0 text-[17px] font-semibold">
                    {title}
                </h2>
                <p id="confirm-message" className="m-0 text-sm" style={{ color: 'var(--text-muted)' }}>
                    {message}
                </p>
                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        className="px-4 py-2 text-sm rounded-md border cursor-pointer hover:opacity-80 transition-opacity"
                        style={{
                            background: 'var(--surface-2)',
                            borderColor: 'var(--border)',
                            color: 'var(--text)'
                        }}
                        onClick={onCancel}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        ref={confirmRef}
                        className="px-4 py-2 text-sm rounded-md border border-red-500 text-red-600 bg-transparent cursor-pointer hover:bg-red-600 hover:text-white transition-colors"
                        onClick={onConfirm}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
