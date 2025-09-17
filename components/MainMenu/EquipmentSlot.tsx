
import React from 'react';
import type { Item } from '../../types'; 

interface EquipmentSlotProps {
  id: string;
  slotType: 'weapon' | 'armor' | 'insignia' | 'enchantment';
  item: Item | null;
  onClick?: () => void;
  ariaLabel: string;
  onShowTooltip?: (item: Item, event: React.MouseEvent) => void;
  onHideTooltip?: () => void;
}

const SlotPlaceholderIcon: React.FC<{ slotType: EquipmentSlotProps['slotType'] }> = ({ slotType }) => {
  const commonSvgProps = {
    stroke: "currentColor",
    strokeWidth: "1.5",
    fill: "none",
    viewBox: "0 0 24 24",
    className: "w-2/3 h-2/3", 
    strokeLinecap: "round" as "round", 
    strokeLinejoin: "round" as "round", 
  };

  switch (slotType) {
    case 'weapon':
      return (
        <svg {...commonSvgProps} aria-label="Weapon slot placeholder">
          <path d="M21.71 3.29c-0.39-0.39-1.02-0.39-1.41 0L12 11.59l-2.78 2.78L4 19.59V21h1.41l5.21-5.21L13.41 13l8.29-8.29c0.39-0.39 0.39-1.02 0-1.42z" />
        </svg>
      );
    case 'insignia':
      return (
        <svg {...commonSvgProps} aria-label="Insignia slot placeholder">
          <circle cx="12" cy="11" r="6" />
          <path d="M8 18l4-4 4 4" />
        </svg>
      );
    case 'armor': 
      return (
        <svg {...commonSvgProps} aria-label="Armor slot placeholder">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    case 'enchantment':
      return (
        <svg {...commonSvgProps} aria-label="Enchantment slot placeholder" viewBox="0 0 24 24">
          <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20Z"/>
          {/* Optional: simpler highlight for the page fold, ensure fill is "none" or stroke only */}
          {/* <path d="M13 3.5V9H18.5" fill="none" stroke="currentColor" stroke-width="0.5" />  */}
        </svg>
      );
    default:
      // Fallback, though all defined types should be handled
      return (
        <svg {...commonSvgProps} aria-label="Empty slot placeholder">
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
};


const EquipmentSlot: React.FC<EquipmentSlotProps> = ({ 
  id, 
  slotType, 
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
      className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-md flex justify-center items-center text-3xl sm:text-4xl shadow-sm transition-all duration-150 ease-in-out
                  ${hasItem ? itemTierClass : 'bg-brand-card-locked'} 
                  ${onClick && hasItem ? 'cursor-pointer hover:brightness-110' : 'cursor-default'}
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
          <div className="item-icon text-3xl sm:text-4xl drop-shadow-sm" aria-hidden="true">{item.icon}</div>
          {item.hasNotification && (
            <div className="absolute -top-1.5 -right-1.5 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-item-notification-bg rounded-full border-2 border-white shadow-md flex items-center justify-center">
              <span className="text-white text-[8px] sm:text-[9px] font-bold">!</span>
            </div>
          )}
        </>
      ) : (
        <span
          className="flex justify-center items-center w-full h-full text-brand-secondary opacity-50"
          aria-hidden="true"
        >
          <SlotPlaceholderIcon slotType={slotType} />
        </span>
      )}
    </div>
  );
};

export default EquipmentSlot;