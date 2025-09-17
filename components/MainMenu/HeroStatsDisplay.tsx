
import React from 'react';
import type { BaseStats, ClassData, Ability } from '../../types'; // Added Ability for type checking

interface HeroStatsDisplayProps {
  stats: BaseStats & Partial<ClassData> & { hp: number; damage: number };
}

// This component is kept for potential future use if a detailed stats list is needed elsewhere.
// For the current HeroTab redesign, HP and Damage are displayed directly in HeroTab.tsx.

const HeroStatsDisplay: React.FC<HeroStatsDisplayProps> = ({ stats }) => {
  const statsOrder = [
    { key: 'hp', name: 'HP Total', format: (v: number) => v.toFixed(0) },
    { key: 'damage', name: 'Dano Base', format: (v: number) => v.toFixed(0) },
    { key: 'letalidade', name: 'Letalidade' },
    { key: 'vigor', name: 'Vigor' },
    { key: 'resistencia', name: 'Resistência' },
    { key: 'velocidadeAtaque', name: 'Vel. Ataque Mod' }, 
    { key: 'attackSpeed', name: 'Intervalo Ataque', suffix: 'ms' }, 
    { key: 'velocidadeMovimento', name: 'Vel. Movimento', format: (v: number) => v.toFixed(1) },
    { key: 'chanceCritica', name: 'Chance Crítica', suffix: '%' },
    { key: 'danoCritico', name: 'Dano Crítico', prefix: '+', suffix: '%' },
    { key: 'chanceEsquiva', name: 'Esquiva', suffix: '%' },
    { key: 'vampirismo', name: 'Vampirismo', suffix: '%' },
    { key: 'range', name: 'Alcance' },
  ];

  return (
    <div id="hero-stats-list" className="hero-stats bg-black bg-opacity-5 rounded-md p-3.5 text-sm font-bold leading-relaxed text-left flex flex-col gap-1 w-full max-w-xs text-primary-dark">
      {statsOrder.map(statInfo => {
        const value = stats[statInfo.key as keyof typeof stats];
        if (value === undefined || value === null) return null;

        let renderedValue: React.ReactNode;

        if (statInfo.format) {
          renderedValue = statInfo.format(value as number);
        } else if (typeof value === 'number' || typeof value === 'string') {
          renderedValue = value;
        } else {
          // If value is an array (e.g., Ability[]) or other complex object and no formatter, skip.
          if (Array.isArray(value)) {
            console.warn(`HeroStatsDisplay: Stat key "${statInfo.key}" resolved to an array and has no formatter. Skipping.`);
            return null; 
          }
          // For other non-primitive, non-array types without a formatter, also skip.
          console.warn(`HeroStatsDisplay: Stat key "${statInfo.key}" has a complex type and no formatter. Skipping.`);
          return null;
        }

        return (
          <span key={statInfo.key}>
            {statInfo.name}: {statInfo.prefix || ''}{renderedValue}{statInfo.suffix || ''}
          </span>
        );
      })}
    </div>
  );
};

export default HeroStatsDisplay;
