




import React from 'react';
import type { BaseStats, ClassData, PlayerData } from '../../types';

interface StatsDetailViewProps {
  baseStats: BaseStats;
  finalStats: BaseStats & Partial<ClassData> & { hp: number; damage: number };
  onShowSimpleTooltip: (text: string, event: React.MouseEvent) => void;
  onHideSimpleTooltip: () => void;
}

type StatKey = keyof BaseStats | 'maxHp' | 'effectiveDamage' | 'range' | 'attackSpeed';

interface StatDisplayConfig {
  key: StatKey;
  name: string;
  format?: (value: number) => string;
  prefix?: string;
  isPercentage?: boolean;
  isTimeMs?: boolean;
  isBaseStat?: boolean;
}

const STATS_GROUPS: { title: string; stats: StatDisplayConfig[] }[] = [
    {
        title: "Atributos Base",
        stats: [
            { key: 'maxHp', name: 'HP total', format: (v) => v > 1000 ? `${(v / 1000).toFixed(2)}K` : v.toFixed(0) },
            { key: 'resistencia', name: 'Resistência', isBaseStat: true, isPercentage: true },
            { key: 'effectiveDamage', name: 'Dano Base', format: (v) => v.toFixed(0) },
            { key: 'chanceCritica', name: 'Chance Crítica', isBaseStat: true, isPercentage: true },
            { key: 'chanceDeAcerto', name: 'Chance de Acerto', isBaseStat: true, isPercentage: true },
            { key: 'danoCritico', name: 'Dano Crítico', prefix: '+', isBaseStat: true, isPercentage: true },
            { key: 'chanceEsquiva', name: 'Esquiva', isBaseStat: true, isPercentage: true },
            { key: 'range', name: 'Alcance' },
            { key: 'vampirismo', name: 'Vampirismo', isBaseStat: true, isPercentage: true },
        ]
    },
    {
        title: "Atributos de Escalamento",
        stats: [
            { key: 'letalidade', name: 'Letalidade', isBaseStat: true },
            { key: 'vigor', name: 'Vigor', isBaseStat: true },
            { key: 'poderDeCura', name: 'Poder de Cura', isBaseStat: true },
        ]
    },
    {
        title: "Atributos Bônus",
        stats: [
            { key: 'velocidadeAtaque', name: 'Velocidade de Ataque Bônus', isBaseStat: true, isPercentage: true },
            { key: 'curaRecebidaBonus', name: 'Cura Recebida Bônus', isBaseStat: true, isPercentage: true },
        ]
    }
];

const STATUS_DESCRIPTIONS: Record<StatKey, string> = {
  maxHp: "Vida máxima do seu herói. Chegar a 0 HP resulta em derrota.",
  effectiveDamage: "Dano base causado pelos ataques do seu herói antes de outros modificadores.",
  letalidade: "Aumenta o dano final dos seus ataques. Cada ponto de Letalidade aumenta o dano em 1.25.",
  vigor: "Aumenta a vida máxima do seu herói. Cada ponto de Vigor aumenta a vida em 100.",
  resistencia: "Reduz o dano percentual recebido de ataques inimigos.",
  velocidadeAtaque: "Modificador percentual na velocidade com que seu herói ataca. Valores positivos aumentam a frequência de ataques (reduzem o intervalo).",
  attackSpeed: "Tempo em milissegundos entre os ataques do herói (base da classe). Menor é melhor. Modificado pela 'Vel. Ataque'.",
  velocidadeMovimento: "Velocidade com que seu herói se move pelo campo de batalha (base do personagem).",
  range: "Distância máxima em que seu herói pode atacar um alvo.",
  chanceCritica: "Probabilidade de seus ataques causarem dano crítico aumentado.",
  danoCritico: "Percentual de dano extra causado em um acerto crítico (adicionado ao dano base).",
  chanceEsquiva: "Probabilidade de seu herói evitar completamente o dano de um ataque inimigo.",
  chanceDeAcerto: "Chance de acertar o inimigo. Base de 100%. Acima de 100%, ignora uma quantidade equivalente da Esquiva do inimigo.",
  vampirismo: "Percentual do dano causado que é convertido em cura para o seu herói.",
  poderDeCura: "Atributo plano que aumenta a cura realizada. Usado para escalar o poder de habilidades de cura.",
  curaRecebidaBonus: "Aumenta a cura que você recebe de todas as fontes em um percentual.",
};


const StatsDetailView: React.FC<StatsDetailViewProps> = ({ 
  baseStats, 
  finalStats, 
  onShowSimpleTooltip, 
  onHideSimpleTooltip 
}) => {
  return (
    <div className="p-4 bg-brand-surface rounded-lg shadow-inner text-text-light space-y-4">
      {STATS_GROUPS.map(group => (
        <div key={group.title}>
          <h3 className="text-md font-semibold text-brand-primary mb-2 border-b border-brand-card pb-1">{group.title}</h3>
          <div className="space-y-1 pt-1">
            {group.stats.map(config => {
              const finalValue = finalStats[config.key as keyof typeof finalStats] as number | undefined;

              if (finalValue === undefined || finalValue === null) {
                return null; 
              }

              let baseValueForBonusCalc: number | undefined;
              if (config.isBaseStat) {
                  baseValueForBonusCalc = baseStats[config.key as keyof BaseStats] as number | undefined;
              }

              const bonus = (config.isBaseStat && baseValueForBonusCalc !== undefined && finalValue !== undefined) 
                              ? finalValue - baseValueForBonusCalc 
                              : 0;

              let displayValue = config.format ? config.format(finalValue) : finalValue.toFixed(0);
              if (config.prefix) displayValue = config.prefix + displayValue;
              if (config.isPercentage) displayValue += '%';
              
              let bonusDisplay = "";
              if (bonus !== 0 && config.isBaseStat) {
                  const bonusPrecision = (config.key === 'velocidadeMovimento') ? 1 : 0;
                  bonusDisplay = ` (${(baseValueForBonusCalc?.toFixed(bonusPrecision) || '0')}${config.isPercentage ? '%' : ''} <span class="text-green-400">${bonus > 0 ? '+' : ''}${bonus.toFixed(bonusPrecision)}${config.isPercentage ? '%' : ''}</span>)`;
              }

              const description = STATUS_DESCRIPTIONS[config.key as keyof typeof STATUS_DESCRIPTIONS] || "";

              return (
                <div key={config.key} className="flex justify-between items-center text-sm">
                  <span 
                    className="font-medium text-brand-secondary cursor-help"
                    onMouseEnter={(e) => description && onShowSimpleTooltip(description, e)}
                    onMouseLeave={onHideSimpleTooltip}
                  >
                    {config.name}:
                  </span>
                  <span className="font-semibold" dangerouslySetInnerHTML={{ __html: `${displayValue}${bonusDisplay}` }}>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsDetailView;
