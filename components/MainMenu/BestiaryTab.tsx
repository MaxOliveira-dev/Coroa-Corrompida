

import React, { useState, useMemo } from 'react';
import type { PlayerData, BiomeData, EnemyTemplate } from '../../types';
import { BESTIARY_QUESTS } from '../../gameData';

interface BestiaryTabProps {
  playerData: PlayerData;
  biomesData: BiomeData;
  bestiaryQuests: typeof BESTIARY_QUESTS;
  onClaimReward: (enemyName: string) => void;
  onShowEnemyTooltip: (enemy: EnemyTemplate, event: React.MouseEvent) => void;
  onHideEnemyTooltip: () => void;
}

const EnemyCard: React.FC<{
  enemy: EnemyTemplate;
  playerData: PlayerData;
  onClaimReward: (enemyName: string) => void;
  onShowEnemyTooltip: (enemy: EnemyTemplate, event: React.MouseEvent) => void;
  onHideEnemyTooltip: () => void;
}> = ({ enemy, playerData, onClaimReward, onShowEnemyTooltip, onHideEnemyTooltip }) => {
  const playerEntry = playerData.bestiary[enemy.name];
  const questData = BESTIARY_QUESTS[enemy.name];
  
  if (!questData) {
    return null; // Don't render a card if there's no quest data for this enemy
  }

  const currentKills = playerEntry?.kills || 0;
  const currentTierIndex = playerEntry?.claimedTier || 0;
  const questTier = questData.tiers[currentTierIndex];
  
  if (!questTier) {
    // All quests for this enemy are completed
    return (
      <div className="bg-brand-surface p-3 rounded-lg shadow-md flex flex-col items-center border border-brand-card-locked opacity-70">
        <div className="flex items-center w-full mb-3">
          <span 
            className="text-4xl mr-3 cursor-help"
            onMouseEnter={(e) => onShowEnemyTooltip(enemy, e)}
            onMouseLeave={onHideEnemyTooltip}
          >{enemy.emoji}</span>
          <div className="flex-grow">
            <h3 className="text-md font-semibold text-text-muted">{enemy.name}</h3>
          </div>
        </div>
        <p className="text-sm font-semibold text-green-400">Todas as missões concluídas!</p>
      </div>
    );
  }

  const requiredKills = questTier.required;
  const reward = questTier.reward;
  const canClaim = currentKills >= requiredKills;
  const progressPercent = Math.min(100, (currentKills / requiredKills) * 100);

  return (
    <div className="bg-brand-surface p-3 rounded-lg shadow-md flex flex-col items-center border border-brand-card">
      <div className="flex items-center w-full mb-2">
        <span 
          className="text-4xl mr-3 cursor-help"
          onMouseEnter={(e) => onShowEnemyTooltip(enemy, e)}
          onMouseLeave={onHideEnemyTooltip}
        >
          {enemy.emoji}
        </span>
        <div className="flex-grow">
          <h3 className="text-md font-semibold text-text-light">{enemy.name}</h3>
          <p className="text-xs text-brand-secondary">Recompensa: {reward} 💰</p>
        </div>
      </div>
      
      <div className="w-full mb-2">
        <p className="text-xs text-text-muted text-center mb-1">
          Abates: {currentKills} / {requiredKills}
        </p>
        <div className="w-full bg-progress-bar-bg rounded-full h-2.5 overflow-hidden border border-brand-card-locked">
          <div
            className={`h-full rounded-full transition-all duration-300 bg-brand-primary`}
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      <button
        id={`claim-reward-${enemy.name}`}
        onClick={() => onClaimReward(enemy.name)}
        disabled={!canClaim}
        className={`w-full mt-auto py-2 px-4 rounded-md text-sm font-semibold transition-colors duration-150
                    ${canClaim
                      ? 'bg-brand-accent text-brand-accent-text hover:bg-accent-hover shadow-button-default'
                      : 'bg-brand-card-locked text-text-muted cursor-not-allowed'
                    }`}
      >
        {canClaim ? 'Resgatar' : 'Em Progresso'}
      </button>
    </div>
  );
};


const BestiaryTab: React.FC<BestiaryTabProps> = ({
  playerData,
  biomesData,
  onClaimReward,
  onShowEnemyTooltip,
  onHideEnemyTooltip,
}) => {
  const [selectedBiomeKey, setSelectedBiomeKey] = useState<string>('Todos');

  const biomeFilters = useMemo(() => [
    { key: 'Todos', label: 'Todos' },
    ...Object.keys(biomesData).map(key => ({ key, label: biomesData[key].name }))
  ], [biomesData]);

  const filteredBiomeOrder = useMemo(() => {
    if (selectedBiomeKey === 'Todos') {
      return Object.keys(biomesData);
    }
    return [selectedBiomeKey];
  }, [biomesData, selectedBiomeKey]);


  return (
    <div className="p-4 flex flex-col h-full bg-brand-background">
      <h2 className="text-xl font-semibold text-text-light mb-4 text-center shrink-0">Bestiário de Caça</h2>
      
      {/* Biome Filters */}
      <div className="flex justify-center gap-2 mb-4 shrink-0 flex-wrap">
        {biomeFilters.map(filter => {
            const isActive = selectedBiomeKey === filter.key;
            return (
                <button
                    key={filter.key}
                    onClick={() => setSelectedBiomeKey(filter.key)}
                    className={`px-3 py-1.5 text-xs sm:px-4 sm:text-sm font-semibold rounded-full transition-colors duration-150 focus:outline-none
                        ${isActive
                            ? 'bg-brand-accent text-brand-accent-text shadow-md'
                            : 'bg-brand-surface text-text-muted hover:bg-brand-card hover:text-text-light'
                        }`}
                >
                    {filter.label}
                </button>
            )
        })}
      </div>
      
      <div className="flex-grow overflow-y-auto custom-scrollbar -mr-2 pr-2 space-y-6">
        {filteredBiomeOrder.length > 0 ? filteredBiomeOrder.map(biomeKey => {
          const biome = biomesData[biomeKey];
          const allEnemiesInBiome = [...biome.enemies, biome.boss];

          return (
            <div key={biomeKey}>
              <h3 className="text-lg font-semibold text-brand-primary mb-3 sticky top-0 bg-brand-background py-1 z-10">{biome.name}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {allEnemiesInBiome.map(enemy => (
                  <EnemyCard 
                    key={enemy.name} 
                    enemy={enemy} 
                    playerData={playerData} 
                    onClaimReward={onClaimReward} 
                    onShowEnemyTooltip={onShowEnemyTooltip} 
                    onHideEnemyTooltip={onHideEnemyTooltip} 
                  />
                ))}
              </div>
            </div>
          );
        }) : (
            <p className="text-center text-text-muted py-10">
                Nenhum bioma encontrado.
            </p>
        )}
      </div>
    </div>
  );
};

export default BestiaryTab;