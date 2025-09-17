


import React from 'react';
import type { Ability } from '../../types';

interface AbilityIconProps {
  ability: Ability;
  remainingCooldownMs: number;
  onClick: () => void;
  hotkey: string;
  castTimeMs?: number; // Optional: for showing cast progress
  remainingCastTimeMs?: number; // Optional
  isDisabled?: boolean; // New prop
}

const AbilityIcon: React.FC<AbilityIconProps> = ({
  ability,
  remainingCooldownMs,
  onClick,
  hotkey,
  castTimeMs,
  remainingCastTimeMs,
  isDisabled,
}) => {
  const isChannelling = castTimeMs && remainingCastTimeMs && remainingCastTimeMs > 0;
  const isOnCooldown = remainingCooldownMs > 0;
  const cooldownSeconds = (remainingCooldownMs / 1000).toFixed(1);
  const castProgressPercent = castTimeMs && remainingCastTimeMs ? ((castTimeMs - remainingCastTimeMs) / castTimeMs) * 100 : 0;

  return (
    <button
      onClick={onClick}
      disabled={isDisabled || isOnCooldown && !isChannelling}
      className={`relative w-14 h-14 sm:w-16 sm:h-16 bg-brand-card border-2 border-brand-surface rounded-lg shadow-md
                  flex flex-col items-center justify-center text-text-light transition-all duration-150
                  hover:border-brand-primary focus:outline-none focus:border-brand-accent
                  disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:border-brand-surface`}
      aria-label={`${ability.name} (Hotkey: ${hotkey}) ${isOnCooldown ? `Cooldown: ${cooldownSeconds}s` : ''}`}
      title={`${ability.name}\n${ability.description}\nCooldown: ${ability.cooldownMs / 1000}s`}
    >
      <span className="text-2xl sm:text-3xl pointer-events-none">{ability.icon}</span>
      <span className="hidden sm:block absolute top-0.5 right-1 text-xs font-bold text-brand-accent pointer-events-none">{hotkey}</span>

      {/* Cooldown Overlay */}
      {isOnCooldown && !isChannelling && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center rounded-md pointer-events-none">
          <span className="text-lg font-bold text-white">{cooldownSeconds}</span>
        </div>
      )}

      {/* Channeling/Cast Progress Bar (optional) */}
      {isChannelling && castTimeMs && (
         <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-brand-background rounded-b-md overflow-hidden pointer-events-none">
            <div
                className="h-full bg-brand-accent transition-all duration-100 ease-linear"
                style={{ width: `${castProgressPercent}%` }}
            ></div>
        </div>
      )}
    </button>
  );
};

export default AbilityIcon;