

import React from 'react';
import type { Item } from '../../types';

interface InventorySlotProps {
  id: string;
  item: Item | null;
  onClick?: () => void;
  ariaLabel: string;
  onShowTooltip?: (item: Item, event: React.MouseEvent) => void;
  onHideTooltip?: () => void;
}

const InventorySlot: React.FC<InventorySlotProps> = ({ 
  id, 
  item, 
  onClick, 
  ariaLabel,
  onShowTooltip,
  onHideTooltip
}) => {
  const itemTierClass = item?.tier ? `bg-item-tier-${item.tier}` : 'bg-brand-card-locked';
  const hasItem = item !== null;

  const handleMouseEnter = (event: React.MouseEvent) => {
    if (item && onShowTooltip) {
      onShowTooltip(item, event);
    }
  };

  const handleMouseLeave = () => {
    if (onHideTooltip) {
      onHideTooltip();
    }
  };

  return (
    <div
      id={id}
      className={`relative w-16 h-16 sm:w-[68px] sm:h-[68px] rounded-md flex justify-center items-center text-3xl sm:text-4xl shadow-sm transition-all duration-150 ease-in-out aspect-square
                  ${hasItem ? itemTierClass : 'bg-brand-card-locked'} 
                  ${onClick && hasItem ? 'cursor-pointer hover:brightness-110 active:scale-95' : 'cursor-default'}
                  border-2 ${hasItem ? 'border-gray-600' : 'border-gray-500'}`}
      onClick={hasItem && onClick ? onClick : undefined}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onKeyDown={hasItem && onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      tabIndex={hasItem && onClick ? 0 : -1}
      role={hasItem && onClick ? "button" : "img"}
      aria-label={item ? `${ariaLabel}: ${item.name}` : `${ariaLabel}: Vazio`}
      title={item ? item.name : "Slot Vazio"}
    >
      {item ? (
        <>
          <div 
            className="item-icon text-3xl sm:text-4xl drop-shadow-sm" 
            aria-hidden="true"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }} // Add slight shadow to icon like in image
          >
            {item.icon}
          </div>
          {/* Removed Level Display
          {item.level && (
            <div className="absolute -top-1 -left-1 bg-gray-700 bg-opacity-80 text-white text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full shadow-md font-semibold border border-gray-500 z-10">
              Lv{item.level}
            </div>
          )}
          */}
          {item.hasNotification && (
            <div className="absolute -top-1.5 -right-1.5 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-item-notification-bg rounded-full border-2 border-white shadow-md flex items-center justify-center z-10">
              <span className="text-white text-[8px] sm:text-[9px] font-bold">!</span>
            </div>
          )}
        </>
      ) : (
        <span className="text-brand-secondary opacity-30 text-4xl"></span>
      )}
    </div>
  );
};

export default InventorySlot;