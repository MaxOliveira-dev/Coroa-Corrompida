
import React from 'react';
import type { ModalButton } from '../../types';

interface ModalProps {
  title: string;
  children: React.ReactNode;
  buttons: ModalButton[];
  onClose?: () => void; 
}

export const Modal: React.FC<ModalProps> = ({ title, children, buttons, onClose }) => {
  const getButtonClasses = (styleType: ModalButton['styleType']) => {
    let base = "text-md py-2 px-5 rounded-lg border-2 border-border-game cursor-pointer shadow-button-default active:translate-y-0.5 active:shadow-button-active transition-all duration-100 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed font-fredoka";
    // Using new theme button colors, confirm/cancel might need specific brand colors if defined
    if (styleType === 'confirm') {
      return `${base} bg-button-success-bg hover:bg-button-success-hover-bg text-white`; // Kept green for general success
    } else if (styleType === 'cancel') {
      return `${base} bg-button-danger-bg hover:bg-button-danger-hover-bg text-white`; // Kept red for general danger
    }
    // Default style uses accent color
    return `${base} bg-accent hover:bg-accent-hover text-accent-text`; 
  };

  return (
    <div 
        className="fixed inset-0 bg-modal-overlay-bg flex justify-center items-center z-50 p-4 font-fredoka"
        onClick={onClose} 
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
    >
      <div 
        className="modal-content bg-modal-content-bg text-text-light p-6 pt-5 border-4 border-border-game rounded-lg shadow-xl w-full max-w-md flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()} 
      >
        <div className="flex justify-between items-center">
            <h2 id="modal-title" className="text-2xl text-text-light font-fredoka">{title}</h2>
            {onClose && (
                 <button 
                    onClick={onClose} 
                    className="text-text-muted hover:text-text-light text-2xl font-bold"
                    aria-label="Fechar modal"
                >&times;</button>
            )}
        </div>
        <div className="modal-body my-2 text-text-light"> {/* Ensure children text defaults to light */}
          {children}
        </div>
        {buttons.length > 0 && (
          <div className="button-group flex justify-end gap-3 pt-3 border-t border-slot-border"> {/* Use slot-border for divider */}
            {buttons.map((btn, index) => (
              <button
                key={index}
                onClick={btn.onClick}
                className={getButtonClasses(btn.styleType)}
                disabled={btn.disabled}
              >
                {btn.text}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
