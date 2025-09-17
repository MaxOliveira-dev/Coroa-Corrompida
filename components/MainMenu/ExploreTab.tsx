

import React from 'react';
import type { BiomeData, PlayerProgress, Biome as BiomeType } from '../../types';

interface ExploreBiomeCardProps {
  biomeKey: string;
  biome: BiomeType;
  playerProgressLevel: number;
  onStartGame: (biomeKey: string) => void;
}

const ExploreBiomeCard: React.FC<ExploreBiomeCardProps> = ({ biomeKey, biome, playerProgressLevel, onStartGame }) => {
  const iconUrl = biome.mapIconUrl || `https://placehold.co/400x150/${biome.color.substring(1)}/FFFFFF?text=${biome.name}`;

  return (
    <div
      id={`explore-card-${biomeKey}`}
      className="relative bg-brand-card rounded-xl overflow-hidden shadow-lg border-2 border-transparent 
                 transition-all duration-300 ease-in-out transform hover:scale-[1.02] hover:border-brand-accent group"
    >
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
        style={{ backgroundImage: `url('${iconUrl}')` }}
      />
      
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

      {/* Content */}
      <div className="relative p-4 flex flex-col justify-between h-40 text-white">
        {/* Top Section */}
        <div>
          <h3 className="text-2xl font-bold" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.7)' }}>{biome.name}</h3>
          <p className="text-sm font-semibold text-brand-secondary" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>Ameaça Nível: {playerProgressLevel}</p>
        </div>

        {/* Bottom Section */}
        <div className="flex justify-between items-end">
          <div className="flex items-center bg-black/50 p-2 rounded-lg">
            <span className="text-3xl mr-2">{biome.boss.emoji}</span>
            <div>
              <p className="text-xs text-red-400 font-semibold">CHEFE</p>
              <p className="text-sm font-bold">{biome.boss.name}</p>
            </div>
          </div>
          <button
            onClick={() => onStartGame(biomeKey)}
            className="bg-brand-accent text-brand-accent-text font-bold py-2 px-5 rounded-lg shadow-lg
                       transition-all duration-200 transform 
                       hover:bg-accent-hover hover:scale-105 active:scale-95"
          >
            Explorar
          </button>
        </div>
      </div>
    </div>
  );
};


interface ExploreTabProps {
  biomes: BiomeData;
  playerProgress: PlayerProgress;
  onStartGame: (biomeKey: string) => void;
}

const ExploreTab: React.FC<ExploreTabProps> = ({ biomes, playerProgress, onStartGame }) => {
  const biomeKeys = Object.keys(biomes);

  return (
    <div id="explore-content" className="flex-grow p-4 pt-12 overflow-y-auto bg-explore-content-bg custom-scrollbar space-y-4">
      {/* The parent BattleTab provides the "Voltar" button, so we add padding-top to avoid overlap */}
      {biomeKeys.map((key) => (
        <ExploreBiomeCard
          key={key}
          biomeKey={key}
          biome={biomes[key]}
          playerProgressLevel={playerProgress[key as keyof PlayerProgress] || 1}
          onStartGame={onStartGame}
        />
      ))}
    </div>
  );
};

export default ExploreTab;