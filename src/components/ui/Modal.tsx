import React from 'react';

interface Props {
  open:     boolean;
  onClose:  () => void;
  title?:   React.ReactNode;
  children: React.ReactNode;
  xl?:      boolean;
  headerExtra?: React.ReactNode;
}

export function Modal({ open, onClose, title, children, xl, headerExtra }: Props) {
  if (!open) return null;
  return (
    <div className="overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`modal${xl ? ' modal-xl' : ''}`} onClick={e => e.stopPropagation()}>
        {title !== undefined && (
          <div className="modal-head">
            <span className="modal-title">{title}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {headerExtra}
              <button className="modal-close" onClick={onClose}>✕</button>
            </div>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
