
import React from 'react';
import type { Biome as BiomeType } from '../../types';

interface BiomeDetailsProps {
  biomeKey: string;
  biome: BiomeType;
  playerProgressLevel: number;
  onStartGame: (biomeKey: string) => void;
}

const BiomeDetails: React.FC<BiomeDetailsProps> = ({ biome, playerProgressLevel, onStartGame, biomeKey }) => {
  return (
    <>
      <div className="details-header flex justify-center items-center gap-6 w-full text-primary-dark"> {/* Ensure text color for header */}
        <h2 className="m-0 text-2xl font-semibold">{biome.name}</h2>
        <button
          onClick={() => onStartGame(biomeKey)}
          className="m-0 text-base py-2.5 px-5 rounded-lg border-2 border-border-game bg-accent text-accent-text cursor-pointer shadow-button-default active:translate-y-1 active:shadow-button-active hover:bg-accent-hover transition-all duration-100 ease-in-out"
        >
          Explorar
        </button>
      </div>
      <p className="text-sm text-primary-dark">Nível de Ameaça Atual: {playerProgressLevel}</p>
      <p className="text-sm text-center max-w-md text-primary-dark">{biome.description}</p>
      <div className="boss-card flex items-center gap-5 bg-boss-card-bg p-3.5 rounded-lg border-2 border-border-game w-full max-w-sm text-primary-dark"> {/* Ensure text color for boss card */}
        <div className="item-icon text-5xl" aria-hidden="true">{biome.boss.emoji}</div>
        <div className="boss-info text-left">
          <h4 className="m-0 mb-2.5 text-md font-semibold">Chefe: {biome.boss.name}</h4>
          <p className="text-xs m-0">HP: ??? | Dano: ??? (Detalhes revelados no jogo)</p>
        </div>
      </div>
    </>
  );
};

export default BiomeDetails;