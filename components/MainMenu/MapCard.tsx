
import React from 'react';
import type { Biome as BiomeType } from '../../types';

interface MapCardProps {
  biomeKey: string;
  biome: BiomeType & { mapIconUrl?: string }; // Add mapIconUrl to BiomeType if not already there
  isActive: boolean;
  onClick: () => void;
}

const MapCard: React.FC<MapCardProps> = ({ biome, isActive, onClick, biomeKey }) => {
  const iconUrl = biome.mapIconUrl || `https://placehold.co/100x100/${biome.color.substring(1)}/FFFFFF?text=${biome.name.substring(0,1)}`;

  return (
    <div
      id={`map-${biomeKey}`}
      className={`map-card bg-container-bg text-primary-dark border-2 border-border-game rounded-lg p-5 w-48 text-center cursor-pointer transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-map-card-hover hover:border-accent ${
        isActive ? 'border-accent scale-105 shadow-map-card-active transform' : 'hover:border-accent' 
      }`}
      onClick={onClick}
      role="button"
      aria-pressed={isActive}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      <h3 className="m-0 mb-2.5 text-lg font-semibold">{biome.name}</h3>
      <div 
        className="item-icon w-[100px] h-[100px] bg-contain bg-no-repeat bg-center mx-auto"
        style={{ backgroundImage: `url('${iconUrl}')` }}
        role="img"
        aria-label={biome.name}
      ></div>
    </div>
  );
};

export default MapCard;