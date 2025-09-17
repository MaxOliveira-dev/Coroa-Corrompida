import React, { useState } from 'react';
import type { BaseStats, ClassData, ClassDataMap, EquippedItems, Item, EnemyTemplate, CombatStats } from '../../types';
import { calculateFinalStatsForEntity } from '../Game/entityUtils';
import HeroDisplay from '../MainMenu/HeroDisplay';
import EquipmentSlot from '../MainMenu/EquipmentSlot';
import Tooltip from '../Tooltip/Tooltip';

interface PreBattleHeroDetailsModalProps {
  heroClass: ClassData;
  baseStats: BaseStats;
  equippedItems: EquippedItems | undefined;
  threatLevel: number;
  onClose: () => void;
  classes: ClassDataMap;
  enemyTemplate?: EnemyTemplate;
}

interface StatDisplayConfig {
  key: keyof CombatStats;
  name: string;
  format?: (value: number) => string;
  prefix?: string;
  suffix?: string;
}

const STATS_GROUPS: { title: string; stats: StatDisplayConfig[] }[] = [
    {
        title: "Atributos de Combate",
        stats: [
            { key: 'maxHp', name: 'HP Total', format: (v) => v.toFixed(0) },
            { key: 'effectiveDamage', name: 'Dano', format: (v) => v.toFixed(0) },
            { key: 'attackIntervalMs', name: 'Intervalo Ataque', suffix: 'ms' },
            { key: 'range', name: 'Alcance' },
            { key: 'velocidadeMovimento', name: 'Vel. Movimento', format: (v) => v.toFixed(1) },
        ]
    },
    {
        title: "Atributos Ofensivos",
        stats: [
            { key: 'letalidade', name: 'Letalidade' },
            { key: 'velocidadeAtaque', name: 'Vel. Ataque Bônus', suffix: '%' },
            { key: 'chanceCritica', name: 'Chance Crítica', suffix: '%' },
            { key: 'chanceDeAcerto', name: 'Chance de Acerto', suffix: '%' },
            { key: 'danoCritico', name: 'Dano Crítico', prefix: '+', suffix: '%' },
        ]
    },
    {
        title: "Atributos Defensivos & Utilidade",
        stats: [
            { key: 'vigor', name: 'Vigor' },
            { key: 'resistencia', name: 'Resistência', suffix: '%' },
            { key: 'chanceEsquiva', name: 'Esquiva', suffix: '%' },
            { key: 'vampirismo', name: 'Vampirismo', suffix: '%' },
            { key: 'poderDeCura', name: 'Poder de Cura' },
            { key: 'curaRecebidaBonus', name: 'Cura Recebida Bônus', suffix: '%' },
        ]
    }
];


const PreBattleHeroDetailsModal: React.FC<PreBattleHeroDetailsModalProps> = ({
  heroClass,
  baseStats,
  equippedItems,
  threatLevel,
  onClose,
  classes,
  enemyTemplate
}) => {
  const finalStats = calculateFinalStatsForEntity(
    baseStats,
    enemyTemplate ? undefined : heroClass,
    enemyTemplate,
    1,
    equippedItems,
    [],
    [],
    threatLevel
  );

  // Augment stats with weapon name for display component
  const displayStats = {
      ...finalStats,
      weaponName: equippedItems?.weapon?.name,
  };

  const [tooltipItem, setTooltipItem] = useState<Item | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState<boolean>(false);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number, y: number }>({ x: 0, y: 0 });

  const handleShowTooltip = (item: Item, event: React.MouseEvent) => {
    setTooltipItem(item);
    setTooltipPosition({ x: event.clientX, y: event.clientY });
    setTooltipVisible(true);
  };

  const handleHideTooltip = () => {
    setTooltipVisible(false);
  };

  const isEnemy = !!enemyTemplate;

  return (
    <>
      <Tooltip
        item={tooltipItem}
        visible={tooltipVisible}
        position={tooltipPosition}
        classes={classes}
        threatLevel={threatLevel}
      />
      <div
        className="fixed inset-0 bg-modal-overlay-bg flex justify-center items-center z-50 p-4 font-fredoka"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="hero-details-title"
      >
        <div
          className="modal-content bg-modal-content-bg text-text-light p-5 border-4 border-border-game rounded-lg shadow-xl w-full max-w-2xl flex flex-col gap-4 max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center">
            <h2 id="hero-details-title" className="text-2xl text-brand-accent font-semibold">
              Detalhes d{isEnemy ? 'o Inimigo' : 'o Herói'}
            </h2>
            <button onClick={onClose} className="text-text-muted hover:text-text-light text-3xl font-bold" aria-label="Fechar detalhes">
              &times;
            </button>
          </div>

          <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 flex flex-col md:flex-row gap-6">
            {/* Left Column */}
            <div className="flex-shrink-0 flex flex-col items-center p-4 bg-hero-area-bg rounded-lg self-start">
              {isEnemy ? (
                <span className="text-8xl my-8">{enemyTemplate.emoji}</span>
              ) : (
                <HeroDisplay heroClassData={displayStats} />
              )}
              <h3 className="text-xl font-bold text-gray-700 mt-2">{finalStats.name}</h3>
              <div className="flex justify-center items-center space-x-4 mt-2">
                <div className="flex items-center text-red-500">
                  <span className="text-lg mr-1">❤️</span>
                  <span className="font-bold text-sm text-gray-700">{finalStats.maxHp.toFixed(0)}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <span className="text-lg mr-1">⚔️</span>
                  <span className="font-bold text-sm text-gray-700">{finalStats.effectiveDamage.toFixed(0)}</span>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="flex-grow">
              {!isEnemy && (
                <>
                  <h4 className="text-lg font-semibold text-brand-primary mb-2">Equipamentos</h4>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <EquipmentSlot id="modal-weapon" slotType="weapon" item={equippedItems?.weapon || null} ariaLabel="Arma" onShowTooltip={handleShowTooltip} onHideTooltip={handleHideTooltip} />
                    <EquipmentSlot id="modal-armor" slotType="armor" item={equippedItems?.armor || null} ariaLabel="Armadura" onShowTooltip={handleShowTooltip} onHideTooltip={handleHideTooltip} />
                    {/* FIX: Changed slotType from "ring" to "insignia" and updated item access and aria-label to match the correct type. */}
                    <EquipmentSlot id="modal-insignia" slotType="insignia" item={equippedItems?.insignia || null} ariaLabel="Insígnia" onShowTooltip={handleShowTooltip} onHideTooltip={handleHideTooltip} />
                    <EquipmentSlot id="modal-enchantment" slotType="enchantment" item={equippedItems?.enchantment || null} ariaLabel="Encantamento" onShowTooltip={handleShowTooltip} onHideTooltip={handleHideTooltip} />
                  </div>
                </>
              )}

              <h4 className="text-lg font-semibold text-brand-primary mt-4 mb-2">Atributos em Batalha</h4>
              <div className="text-sm space-y-4 bg-brand-surface p-3 rounded-lg">
                {STATS_GROUPS.map(group => (
                    <div key={group.title}>
                        <h3 className="text-md font-semibold text-brand-primary mb-2 border-b border-brand-card pb-1">{group.title}</h3>
                        <div className="space-y-1 pt-1">
                            {group.stats.map(config => {
                                const value = finalStats[config.key as keyof typeof finalStats] as number | undefined;
                                if (value === undefined || value === null || (typeof value === 'number' && isNaN(value))) {
                                    return null;
                                }

                                let displayValue = config.format ? config.format(value) : value.toFixed(0);

                                return (
                                    <div key={config.key} className="flex justify-between items-center py-0.5">
                                        <span className="font-medium text-brand-secondary">{config.name}:</span>
                                        <span className="font-semibold text-text-light">
                                            {config.prefix || ''}
                                            {displayValue}
                                            {config.suffix || ''}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PreBattleHeroDetailsModal;