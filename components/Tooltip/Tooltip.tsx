


import React from 'react';
import type { Item, BaseStats, ClassDataMap } from '../../types';
import { ITEM_SCALING_FACTOR_PER_THREAT_LEVEL } from '../../gameData';

interface TooltipProps {
  item: Item | null;
  visible: boolean;
  position: { x: number; y: number };
  classes: ClassDataMap;
  threatLevel?: number;
}

// Helper to format stat keys for display
const formatStatName = (key: string): string => {
  switch (key) {
    case 'letalidade': return 'Letalidade';
    case 'vigor': return 'Vigor';
    case 'resistencia': return 'Resistência';
    case 'velocidadeAtaque': return 'Vel. Ataque';
    case 'velocidadeMovimento': return 'Vel. Movimento';
    case 'chanceCritica': return 'Chance Crítica';
    case 'danoCritico': return 'Dano Crítico';
    case 'chanceEsquiva': return 'Esquiva';
    case 'chanceDeAcerto': return 'Chance de Acerto';
    case 'vampirismo': return 'Vampirismo';
    case 'poderDeCura': return 'Poder de Cura';
    case 'curaRecebidaBonus': return 'Cura Recebida Bônus';
    default: return key.charAt(0).toUpperCase() + key.slice(1);
  }
};

// Helper to format item type keys for display
const formatTypeName = (type: string): string => {
    const names: Record<string, string> = {
        sword: 'Espada',
        axe: 'Machado',
        bow: 'Arco',
        staff: 'Cajado',
        dagger: 'Adaga',
        shield: 'Escudo',
        hammer: 'Martelo',
        lute: 'Alaúde',
        armor: 'Armadura',
        insignia: 'Insígnia',
        necklace: 'Amuleto',
        unarmed: 'Desarmado',
    };
    return names[type] || type.charAt(0).toUpperCase() + type.slice(1);
};

const Tooltip: React.FC<TooltipProps> = ({ item, visible, position, classes, threatLevel }) => {
  if (!visible || !item) {
    return null;
  }

  const classKey = item?.equipsToClass;
  const classData = classKey ? classes[classKey] : null;
  
  const percentageStats: (keyof BaseStats)[] = [
      'velocidadeAtaque',
      'chanceCritica',
      'danoCritico',
      'chanceEsquiva',
      'chanceDeAcerto',
      'vampirismo',
      'curaRecebidaBonus',
      'resistencia'
  ];

  const tierColors: { [key: number]: string } = {
    1: 'text-item-tier-1', 
    2: 'text-item-tier-2', 
    3: 'text-item-tier-3', 
    4: 'text-item-tier-4', 
  };
  const tierBorderColors: { [key: number]: string } = {
    1: 'border-item-tier-1',
    2: 'border-item-tier-2',
    3: 'border-item-tier-3',
    4: 'border-item-tier-4',
  };

  const nameColorClass = item.tier ? tierColors[item.tier] : 'text-text-light';
  const borderColorClass = item.tier ? tierBorderColors[item.tier] : 'border-brand-surface';

  const tooltipWidth = 220; 
  let tooltipHeightEstimate = 100 + (item.description ? 30 : 0) + (item.statBonuses ? Object.keys(item.statBonuses).length * 20 : 0);
  if (classData) {
      tooltipHeightEstimate += 120; // Add space for class info
  }
  
  let x = position.x + 15;
  let y = position.y + 15;

  if (typeof window !== 'undefined') {
    if (x + tooltipWidth > window.innerWidth) {
      x = position.x - tooltipWidth - 15; 
    }
    if (y + tooltipHeightEstimate > window.innerHeight) {
      y = position.y - tooltipHeightEstimate - 5; 
    }
     // Ensure tooltip doesn't go off-screen top or left
    if (x < 0) x = 5;
    if (y < 0) y = 5;
  }


  return (
    <div
      className={`fixed p-3 rounded-lg shadow-xl bg-brand-card border ${borderColorClass} text-sm text-text-light z-[100] transition-opacity duration-100 w-[220px] pointer-events-none`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        opacity: visible ? 1 : 0,
      }}
      role="tooltip"
    >
      <div className="flex items-center mb-2 pb-2 border-b border-brand-surface">
        <span className="text-3xl mr-3">{item.icon}</span>
        <h4 className={`font-bold text-base ${nameColorClass}`}>{item.name}</h4>
      </div>
      <div className="space-y-1">
        {item.tier && (
          <p>
            <span className="font-semibold text-brand-secondary">Tier:</span>{' '}
            <span className={nameColorClass}>{item.tier}</span>
          </p>
        )}
        <p>
          <span className="font-semibold text-brand-secondary">Tipo:</span> {formatTypeName(item.type)}
        </p>
        
        {item.statBonuses && Object.keys(item.statBonuses).length > 0 && (
          <div className="mt-2 pt-2 border-t border-brand-surface space-y-0.5">
            {(Object.entries(item.statBonuses) as [keyof BaseStats, number][]).map(([key, baseValue]) => {
              if (baseValue === 0) return null;

              let scaledValue = baseValue;
              let showsBaseValue = false;

              if (threatLevel && threatLevel > 0 && !percentageStats.includes(key)) {
                const scalingFactor = 1 + ITEM_SCALING_FACTOR_PER_THREAT_LEVEL * threatLevel;
                scaledValue = baseValue * scalingFactor;
                showsBaseValue = scalingFactor !== 1;
              }
              
              const displayValue = Math.abs(scaledValue - Math.round(scaledValue)) < 0.01 ? Math.round(scaledValue).toString() : scaledValue.toFixed(1);

              return (
                <p key={key}>
                  <span className="font-semibold text-brand-secondary">{formatStatName(key)}:</span>{' '}
                  <span className="text-green-400">
                    {scaledValue > 0 ? '+' : ''}{displayValue}
                    {['velocidadeAtaque', 'chanceCritica', 'danoCritico', 'chanceEsquiva', 'chanceDeAcerto', 'vampirismo', 'curaRecebidaBonus', 'resistencia'].includes(key) ? '%' : ''}
                    {showsBaseValue && (
                      <span className="text-text-muted text-xs ml-1">
                        ({baseValue > 0 ? '+' : ''}{baseValue})
                      </span>
                    )}
                  </span>
                </p>
              );
            })}
          </div>
        )}


        {classData && (
             <div className="mt-2 pt-2 border-t border-brand-surface space-y-0.5">
                 <h5 className="font-semibold text-brand-primary">Classe: {classData.name}</h5>
                 <p><span className="text-brand-secondary">HP Base:</span> <span className="text-text-light">{classData.hp}</span></p>
                 <p><span className="text-brand-secondary">Dano Base:</span> <span className="text-text-light">{classData.damage}</span></p>
                 <p><span className="text-brand-secondary">Alcance:</span> <span className="text-text-light">{classData.range}</span></p>
                 <p><span className="text-brand-secondary">Intervalo Atq.:</span> <span className="text-text-light">{classData.attackSpeed}ms</span></p>
                 <p><span className="text-brand-secondary">Vel. Movimento:</span> <span className="text-text-light">{classData.velocidadeMovimento}</span></p>
            </div>
        )}

        {item.description && (
          <p className="mt-2 pt-2 border-t border-brand-surface opacity-90 text-xs">
            {item.description}
          </p>
        )}
      </div>
    </div>
  );
};

export default Tooltip;