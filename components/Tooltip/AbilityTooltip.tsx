
import React from 'react';
import type { Ability } from '../../types';

interface AbilityTooltipProps {
  ability: Ability | null;
  visible: boolean;
  position: { x: number; y: number };
}

const AbilityTooltip: React.FC<AbilityTooltipProps> = ({ ability, visible, position }) => {
  if (!visible || !ability) {
    return null;
  }

  const tooltipWidth = 220; 
  let tooltipHeightEstimate = 80 + (ability.description ? 40 : 0);
  
  let x = position.x + 15;
  let y = position.y + 15;

  if (typeof window !== 'undefined') {
    if (x + tooltipWidth > window.innerWidth) {
      x = position.x - tooltipWidth - 15; 
    }
    if (y + tooltipHeightEstimate > window.innerHeight) {
      y = position.y - tooltipHeightEstimate - 5; 
    }
    if (x < 0) x = 5;
    if (y < 0) y = 5;
  }


  return (
    <div
      className={`fixed p-3 rounded-lg shadow-xl bg-brand-card border border-brand-primary text-sm text-text-light z-[100] transition-opacity duration-100 w-[220px] pointer-events-none`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        opacity: visible ? 1 : 0,
      }}
      role="tooltip"
    >
      <div className="flex items-center mb-2 pb-2 border-b border-brand-surface">
        <span className="text-3xl mr-3">{ability.icon}</span>
        <h4 className={`font-bold text-base text-brand-primary`}>{ability.name}</h4>
      </div>
      <div className="space-y-1">
        <p className="opacity-90 text-xs">
          {ability.description}
        </p>
        <div className="mt-2 pt-2 border-t border-brand-surface space-y-0.5">
            <p>
              <span className="font-semibold text-brand-secondary">Recarga:</span>{' '}
              <span className="text-text-light">{(ability.cooldownMs / 1000).toFixed(1)}s</span>
            </p>
        </div>
      </div>
    </div>
  );
};

export default AbilityTooltip;
