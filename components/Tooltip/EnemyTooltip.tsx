import React from 'react';
import type { EnemyTemplate, BaseStats } from '../../types';

interface EnemyTooltipProps {
  enemy: EnemyTemplate | null;
  visible: boolean;
  position: { x: number; y: number };
}

// Helper to format stat keys for display
const formatStatName = (key: string): string => {
  switch (key) {
    case 'baseHp': return 'HP Base';
    case 'baseDamage': return 'Dano Base';
    case 'range': return 'Alcance';
    case 'attackSpeed': return 'Intervalo Atq.';
    case 'velocidadeMovimento': return 'Vel. Movimento';
    // from baseStats
    case 'letalidade': return 'Letalidade';
    case 'vigor': return 'Vigor';
    case 'resistencia': return 'Resistência';
    case 'velocidadeAtaque': return 'Vel. Ataque Mod.';
    case 'chanceCritica': return 'Chance Crítica';
    case 'danoCritico': return 'Dano Crítico';
    case 'chanceEsquiva': return 'Esquiva';
    case 'vampirismo': return 'Vampirismo';
    default: return key.charAt(0).toUpperCase() + key.slice(1);
  }
};

const EnemyTooltip: React.FC<EnemyTooltipProps> = ({ enemy, visible, position }) => {
  if (!visible || !enemy) {
    return null;
  }

  const statsToShow: { key: keyof EnemyTemplate | keyof BaseStats, name: string, value: number, suffix?: string }[] = [
    { key: 'baseHp', name: 'HP Base', value: enemy.baseHp },
    { key: 'baseDamage', name: 'Dano Base', value: enemy.baseDamage },
    { key: 'range', name: 'Alcance', value: enemy.range },
    { key: 'attackSpeed', name: 'Intervalo Atq.', value: enemy.attackSpeed, suffix: 'ms' },
    { key: 'velocidadeMovimento', name: 'Vel. Movimento', value: enemy.velocidadeMovimento },
  ];

  if (enemy.baseStats) {
    for (const [key, value] of Object.entries(enemy.baseStats)) {
        if (value !== undefined && value !== 0) {
            statsToShow.push({ 
                key: key as keyof BaseStats, 
                name: formatStatName(key), 
                value, 
                suffix: ['chanceCritica', 'danoCritico', 'chanceEsquiva', 'velocidadeAtaque', 'vampirismo'].includes(key) ? '%' : undefined 
            });
        }
    }
  }

  const tooltipWidth = 220; 
  let tooltipHeightEstimate = 80 + statsToShow.length * 20;
  
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
      className="fixed p-3 rounded-lg shadow-xl bg-brand-card border border-brand-primary text-sm text-text-light z-[100] transition-opacity duration-100 w-[220px] pointer-events-none"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        opacity: visible ? 1 : 0,
      }}
      role="tooltip"
    >
      <div className="flex items-center mb-2 pb-2 border-b border-brand-surface">
        <span className="text-3xl mr-3">{enemy.emoji}</span>
        <h4 className={`font-bold text-base text-text-light`}>{enemy.name}</h4>
      </div>
      <div className="space-y-0.5">
        {statsToShow.map(({ key, name, value, suffix }) => (
          <p key={key}>
            <span className="font-semibold text-brand-secondary">{name}:</span>{' '}
            <span className="text-text-light">{value}{suffix || ''}</span>
          </p>
        ))}
      </div>
    </div>
  );
};

export default EnemyTooltip;
