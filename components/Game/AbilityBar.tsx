

import React from 'react';
import type { Ability } from '../../types';
import AbilityIcon from './AbilityIcon';

interface AbilityBarProps {
  heroAbilities: Ability[];
  abilityCooldowns: { [abilityId: string]: number }; // Remaining MS
  onActivateAbility: (abilityId: string) => void;
  isSpectator?: boolean;
}

const AbilityBar: React.FC<AbilityBarProps> = ({
  heroAbilities,
  abilityCooldowns,
  onActivateAbility,
  isSpectator,
}) => {
  if (!heroAbilities || heroAbilities.length === 0) {
    return null;
  }

  const hotkeys = ['1', '2', '3', '4'];

  return (
    <div className={`pointer-events-auto absolute bottom-4 left-1/2 -translate-x-1/2 bg-brand-surface bg-opacity-80 p-2 rounded-xl shadow-lg
                    flex space-x-2 z-20 backdrop-blur-sm border border-brand-card transition-all duration-300 ${isSpectator ? 'grayscale' : ''}`}>
      {heroAbilities.slice(0, 4).map((ability, index) => (
        <AbilityIcon
          key={ability.id}
          ability={ability}
          remainingCooldownMs={abilityCooldowns[ability.id] || 0}
          onClick={() => onActivateAbility(ability.id)}
          hotkey={hotkeys[index]}
          isDisabled={isSpectator}
        />
      ))}
      {isSpectator && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded-xl pointer-events-none">
              <span className="text-white font-bold text-lg" style={{ textShadow: '2px 2px 4px #000' }}>MODO ESPECTADOR</span>
          </div>
      )}
    </div>
  );
};

export default AbilityBar;