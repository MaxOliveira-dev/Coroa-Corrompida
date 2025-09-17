import React from 'react';
import type { Item } from '../../types';
import InventorySlot from './InventorySlot';

interface InventorySectionProps {
  backpack: (Item | null)[];
  onItemClick: (index: number) => void;
  onShowTooltip: (item: Item, event: React.MouseEvent) => void;
  onHideTooltip: () => void;
}

const InventorySection: React.FC<InventorySectionProps> = ({ 
  backpack, 
  onItemClick,
  onShowTooltip,
  onHideTooltip,
}) => {

  return (
    <div className="inventory-section flex flex-col gap-3">
      {/* Grid container */}
      <div className="bg-brand-surface p-2.5 rounded-lg shadow-inner h-[228px] sm:h-[244px] overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-5 gap-2 sm:gap-2.5 justify-center">
          {backpack.map((item, index) => {
            return (
              <InventorySlot
                key={`inv-slot-${index}`}
                id={`inv-slot-${index}`}
                item={item}
                onClick={() => item && onItemClick(index)}
                ariaLabel={`Inventário slot ${index + 1}`}
                onShowTooltip={onShowTooltip}
                onHideTooltip={onHideTooltip}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default InventorySection;