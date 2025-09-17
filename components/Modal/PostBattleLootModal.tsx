import React from 'react';
import type { PlayerFragments, Item as ItemType, PendingLoot } from '../../types';

interface PostBattleLootModalProps {
  loot: PendingLoot;
  onClose: () => void; // For "Prosseguir"
  onReturnToMenuClick: () => void;
  onShowReportClick: () => void; // New prop for showing the report
  allPossibleItems: ItemType[]; // To get item icons and details
}

const PostBattleLootModal: React.FC<PostBattleLootModalProps> = ({ loot, onClose, onReturnToMenuClick, onShowReportClick, allPossibleItems }) => {
  const getTierColor = (tier: number | undefined): string => {
    if (!tier) return 'text-gray-400';
    switch (tier) {
      case 1: return 'text-item-tier-1';
      case 2: return 'text-item-tier-2';
      case 3: return 'text-item-tier-3';
      case 4: return 'text-item-tier-4';
      default: return 'text-gray-400';
    }
  };

  const getItemByName = (name: string): ItemType | undefined => {
    return allPossibleItems.find(item => item.name === name);
  };

  const fragmentEntries = Object.entries(loot.fragments);

  return (
    <div
      className="fixed inset-0 bg-modal-overlay-bg flex justify-center items-center z-50 p-4 font-fredoka"
    >
      <div
        className="modal-content bg-modal-content-bg text-text-light p-6 pt-5 border-4 border-border-game rounded-lg shadow-xl w-full max-w-lg flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center items-center mb-2">
          <h2 id="modal-title" className="text-2xl text-brand-accent font-semibold">Recompensas da Batalha!</h2>
        </div>
        <div className="modal-body my-2 text-text-light max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
          {loot.coins && loot.coins > 0 && (
            <div className="text-center mb-4 border-b border-brand-surface pb-4">
                <h3 className="text-lg font-medium text-text-light mb-1">Moedas Ganhas:</h3>
                <p className="text-2xl font-bold text-yellow-400">
                    {loot.coins} 💰
                </p>
            </div>
          )}
          {fragmentEntries.length > 0 ? (
            <div id="loot-items-list" className="space-y-3">
              <h3 className="text-lg font-medium text-text-light mb-2">Fragmentos Obtidos:</h3>
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
             // Only show this if there are no coins either
            (!loot.coins || loot.coins <= 0) && 
                <p className="text-center text-text-muted">Nenhuma recompensa especial desta vez.</p>
          )}
        </div>
        <div className="button-group flex flex-col sm:flex-row justify-center items-center gap-3 pt-4 border-t border-slot-border">
            <button
              id="loot-return-button"
              onClick={onReturnToMenuClick} // "Voltar ao Menu" button
              className="text-md py-2 px-6 rounded-lg border-2 border-border-game cursor-pointer shadow-button-default active:translate-y-0.5 active:shadow-button-active transition-all duration-100 ease-in-out bg-brand-card hover:bg-brand-surface text-text-light font-fredoka order-3 sm:order-1"
            >
              Voltar ao Menu
            </button>
            <button
              id="loot-report-button"
              onClick={onShowReportClick}
              className="text-md py-2 px-6 rounded-lg border-2 border-border-game cursor-pointer shadow-button-default active:translate-y-0.5 active:shadow-button-active transition-all duration-100 ease-in-out bg-brand-card hover:bg-brand-surface text-text-light font-fredoka order-2 sm:order-2"
            >
              Ver Relatório
            </button>
            <button
              id="loot-proceed-button"
              onClick={onClose} // "Prosseguir" button
              className="text-md py-2 px-8 rounded-lg border-2 border-border-game cursor-pointer shadow-button-default active:translate-y-0.5 active:shadow-button-active transition-all duration-100 ease-in-out bg-accent hover:bg-accent-hover text-accent-text font-fredoka order-1 sm:order-3"
            >
              Prosseguir
            </button>
        </div>
      </div>
    </div>
  );
};

export default PostBattleLootModal;