import React from 'react';
import type { PlayerFragments, Item as ItemType } from '../../types';

interface PurchaseLootModalProps {
  loot: PlayerFragments;
  onClaim: () => void;
  allPossibleItems: ItemType[];
}

const PurchaseLootModal: React.FC<PurchaseLootModalProps> = ({ loot, onClaim, allPossibleItems }) => {
  const getTierColor = (tier: number | undefined): string => {
    if (!tier) return 'text-gray-400';
    return `text-item-tier-${tier}`;
  };

  const getItemByName = (name: string): ItemType | undefined => {
    return allPossibleItems.find(item => item.name === name);
  };

  const fragmentEntries = Object.entries(loot);

  return (
    <div
      className="fixed inset-0 bg-modal-overlay-bg flex justify-center items-center z-50 p-4 font-fredoka"
    >
      <div
        className="modal-content bg-modal-content-bg text-text-light p-6 pt-5 border-4 border-border-game rounded-lg shadow-xl w-full max-w-lg flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center items-center mb-2">
          <h2 id="modal-title" className="text-2xl text-brand-accent font-semibold">🧩 Itens Recebidos! 🧩</h2>
        </div>
        <div className="modal-body my-2 text-text-light max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
          {fragmentEntries.length > 0 ? (
            <div className="space-y-3">
              {fragmentEntries.map(([itemName, quantity]) => {
                const itemDetails = getItemByName(itemName);
                return (
                  <div key={itemName} className="flex items-center bg-brand-surface p-2 rounded-md shadow">
                    <span className="text-3xl mr-3">{itemDetails?.icon || '❓'}</span>
                    <div className="flex-grow">
                      <span className={`font-semibold ${getTierColor(itemDetails?.tier)}`}>{itemName}</span>
                      {itemDetails?.tier && <span className="text-xs text-brand-secondary ml-1">(Tier {itemDetails.tier})</span>}
                    </div>
                    <span className="text-lg font-semibold text-brand-primary">x {quantity}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-text-muted">Nenhum fragmento obtido.</p>
          )}
        </div>
        <div className="button-group flex justify-center pt-4 border-t border-slot-border">
          <button
            onClick={onClaim}
            className="text-md py-2 px-8 rounded-lg border-2 border-border-game cursor-pointer shadow-button-default active:translate-y-0.5 active:shadow-button-active transition-all duration-100 ease-in-out bg-accent hover:bg-accent-hover text-accent-text font-fredoka"
          >
            Coletar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseLootModal;