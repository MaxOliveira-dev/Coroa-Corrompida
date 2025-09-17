import React from 'react';
import type { PlayerData, MarketItem, PurchaseOption } from '../../types';

interface MarketTabProps {
  playerData: PlayerData;
  marketItems: MarketItem[];
  onPurchase: (item: MarketItem, option: PurchaseOption) => void;
}

const MarketCard: React.FC<{
  item: MarketItem;
  playerData: PlayerData;
  onPurchase: (item: MarketItem, option: PurchaseOption) => void;
}> = ({ item, playerData, onPurchase }) => {
  return (
    <div
      id={`market-item-${item.id}`}
      className="bg-brand-card border-2 border-brand-surface rounded-lg p-3 flex flex-col items-center text-center text-white shadow-lg w-full max-w-xs mx-auto font-fredoka transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-xl hover:border-brand-accent"
    >
      {/* Header */}
      <div className="w-full text-center py-1">
        <h3 className="text-xl font-bold tracking-wide uppercase text-text-light" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>{item.name}</h3>
        <p className="text-xs font-semibold text-brand-secondary mt-1 px-2" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>{item.description}</p>
      </div>

      {/* Icon Area */}
      <div className="relative w-40 h-40 bg-brand-background rounded-lg border-2 border-brand-card-locked shadow-inner flex items-center justify-center my-3">
        <span className="text-7xl" style={{ textShadow: '3px 3px 6px rgba(0,0,0,0.5)' }}>{item.icon}</span>
      </div>

      {/* Purchase Options */}
      <div className="w-full space-y-2 mt-auto">
        {item.purchaseOptions.map(option => {
          const hasEnoughCurrency = option.currency === 'coins'
            ? playerData.coins >= option.cost
            : playerData.gems >= option.cost;
          const currencyIcon = option.currency === 'coins' ? '💰' : '💎';

          return (
            <button
              key={`${item.id}-${option.quantity}`}
              onClick={() => onPurchase(item, option)}
              disabled={!hasEnoughCurrency}
              className={`w-full py-2 px-4 rounded-lg font-bold text-lg transition-transform duration-150 transform active:scale-95
                          ${hasEnoughCurrency
                            ? 'bg-button-success-bg hover:bg-button-success-hover-bg border-b-4 border-green-700 active:border-b-2 text-white'
                            : 'bg-gray-600 border-b-4 border-gray-700 cursor-not-allowed text-gray-400'
                          }`}
              style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.4)' }}
            >
              <div className="flex justify-between items-center px-2">
                <span>{`x${option.quantity}`}</span>
                <div className="flex items-center">
                    <span className="mr-1">{option.cost.toLocaleString('pt-BR')}</span>
                    <span className="text-2xl">{currencyIcon}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};


const MarketTab: React.FC<MarketTabProps> = ({ playerData, marketItems, onPurchase }) => {
  return (
    <div className="p-4 flex flex-col h-full bg-brand-background">
      <h2 className="text-xl font-semibold text-text-light mb-4 text-center shrink-0">Mercado</h2>
      <div className="flex-grow overflow-y-auto custom-scrollbar -mr-2 pr-2">
        <div className="space-y-4">
          {marketItems.map(item => (
            <MarketCard
              key={item.id}
              item={item}
              playerData={playerData}
              onPurchase={onPurchase}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MarketTab;