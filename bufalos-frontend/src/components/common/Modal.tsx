import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      modalRef.current?.focus();

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      previousFocusRef.current?.focus();
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-night-950/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        className="relative w-full max-w-lg bg-night-850 border border-night-border rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_20px_rgba(245,158,11,0.1)] overflow-hidden focus:outline-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-night-border bg-night-800/80">
          <h2 id="modal-title" className="text-lg font-black text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>{title}</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar diálogo modal"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-300 hover:text-white hover:bg-night-700/80 rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-amber-400"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};
