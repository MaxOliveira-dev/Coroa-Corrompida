import React from 'react';
import type { CombatStats } from '../../types';
import HeroPortraitDisplay from '../Game/HeroPortraitDisplay';

interface HeroDisplayProps {
  heroClassData: CombatStats & { weaponName?: string; weaponRepresentation?: string };
}

const HeroDisplay: React.FC<HeroDisplayProps> = ({ heroClassData }) => {
  return (
    <div className="hero-display flex flex-col justify-center items-center py-1">
      <HeroPortraitDisplay
        heroClassData={heroClassData}
        width={120}
        height={140}
        baseSize={55}
      />
    </div>
  );
};

export default HeroDisplay;