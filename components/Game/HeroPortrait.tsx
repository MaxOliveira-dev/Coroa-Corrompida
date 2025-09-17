import React from 'react';
import type { HeroEntity } from './entities/HeroEntity';

const HeroPortrait: React.FC<{ heroData: HeroEntity }> = ({ heroData }) => {
  if (!heroData) return null;

  const { combatStats, currentHp, shieldHp, furia, maxFuria, corruption, maxCorruption } = heroData;
  const maxHp = combatStats.maxHp;

  const healthPercentage = maxHp > 0 ? (currentHp / maxHp) * 100 : 0;
  const shieldPercentage = maxHp > 0 ? (shieldHp / maxHp) * 100 : 0;

  const classIcon = heroData.classDetails?.abilities[0]?.icon || '👑';

  let resourcePercentage = 0;
  let resourceColor = '';
  const hasResource = (furia !== undefined && maxFuria !== undefined && maxFuria > 0) || (corruption !== undefined && maxCorruption !== undefined && maxCorruption > 0);

  if (furia !== undefined && maxFuria !== undefined && maxFuria > 0) {
    resourcePercentage = (furia / maxFuria) * 100;
    resourceColor = '#DC143C'; // Crimson Red for Fury
  } else if (corruption !== undefined && maxCorruption !== undefined && maxCorruption > 0) {
    resourcePercentage = (corruption / maxCorruption) * 100;
    resourceColor = '#8E44AD'; // Purple for Corruption
  }

  return (
    <div className="absolute bottom-24 left-4 flex flex-col items-center space-y-1 z-30 pointer-events-none">
      {/* Circular Icon with Border */}
      <div className="relative w-20 h-20 bg-brand-surface rounded-full border-4 border-brand-card shadow-lg flex items-center justify-center">
        <span className="text-4xl drop-shadow-lg">{classIcon}</span>
      </div>

      {/* Health Bar */}
      <div className="relative w-28 h-5 bg-health-bar-bg rounded-full border-2 border-black/50 overflow-hidden shadow-md">
        {/* Health Bar Fill */}
        <div
          className="absolute top-0 left-0 h-full bg-health-bar-hero transition-all duration-150 ease-linear"
          style={{ width: `${healthPercentage}%` }}
        />
        {/* Shield Bar Overlay */}
        <div
          className="absolute top-0 left-0 h-full bg-blue-400/80 transition-all duration-150 ease-linear"
          style={{ width: `${shieldPercentage}%` }}
        />
        {/* Health Text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-white" style={{ textShadow: '1px 1px 2px #000' }}>
            {`${Math.ceil(currentHp)}`}
          </span>
        </div>
      </div>

      {/* Optional Resource Bar */}
      {hasResource && (
        <div className="relative w-24 h-3 bg-health-bar-bg rounded-full border border-black/50 overflow-hidden shadow-sm">
          <div
            className="h-full rounded-full transition-all duration-150 ease-linear"
            style={{ width: `${resourcePercentage}%`, backgroundColor: resourceColor }}
          />
        </div>
      )}
    </div>
  );
};

export default HeroPortrait;