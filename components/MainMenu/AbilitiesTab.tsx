
import React, { useState, useEffect } from 'react';
import type { Ability } from '../../types';

interface AbilitiesTabProps {
  abilities: Ability[];
}

const AbilitiesTab: React.FC<AbilitiesTabProps> = ({ abilities }) => {
  const [selectedAbility, setSelectedAbility] = useState<Ability | null>(null);

  useEffect(() => {
    // Automatically select the first ability if the list is not empty
    if (abilities && abilities.length > 0) {
      setSelectedAbility(abilities[0]);
    } else {
      setSelectedAbility(null);
    }
  }, [abilities]);

  if (!abilities || abilities.length === 0) {
    return (
      <div className="p-4 text-center text-text-muted">
        Esta classe não possui habilidades especiais.
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Ability Icons */}
      <div className="flex justify-center gap-3">
        {abilities.map((ability) => {
          const isActive = selectedAbility?.id === ability.id;
          return (
            <button
              key={ability.id}
              onClick={() => setSelectedAbility(ability)}
              className={`relative w-14 h-14 bg-brand-card border-2 rounded-lg shadow-md
                          flex items-center justify-center text-3xl transition-all duration-150
                          ${isActive 
                            ? 'border-brand-accent scale-110' 
                            : 'border-brand-surface hover:border-brand-primary'
                          }`}
              aria-label={`Ver detalhes da habilidade: ${ability.name}`}
              title={ability.name}
            >
              {ability.icon}
            </button>
          );
        })}
      </div>

      {/* Selected Ability Details */}
      {selectedAbility && (
        <div className="bg-brand-surface p-4 rounded-lg shadow-inner space-y-2 text-left">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{selectedAbility.icon}</span>
            <h4 className="text-lg font-semibold text-brand-primary">{selectedAbility.name}</h4>
          </div>
          <p className="text-sm text-text-light leading-relaxed">
            {selectedAbility.description}
          </p>
          <div className="pt-2 border-t border-brand-card-locked">
            <p className="text-sm">
              <span className="font-semibold text-brand-secondary">Recarga:</span>
              <span className="ml-2 text-text-light">{(selectedAbility.cooldownMs / 1000).toFixed(1)} segundos</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AbilitiesTab;
