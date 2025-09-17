

import React from 'react';
import type { TutorialProgress } from '../../types';

export type NavItemKey = 'Mercado' | 'Forjar' | 'Batalhar' | 'Herói'; 

interface NavItem {
  key: NavItemKey;
  label: string;
  icon: string; // Emoji or SVG path
}

const NAV_ITEMS: NavItem[] = [
  { key: 'Mercado', label: 'Mercado', icon: '🛍️' },
  { key: 'Forjar', label: 'Forjar', icon: '🧩' },
  { key: 'Batalhar', label: 'Batalhar', icon: '⚔️' },
  { key: 'Herói', label: 'Herói', icon: '👑' },
];

interface BottomNavBarProps {
  activeItem: NavItemKey;
  onNavChange: (itemKey: NavItemKey) => void;
  forgeNotificationCount?: number; 
  bestiaryNotificationCount?: number;
  tutorialProgress: TutorialProgress;
  activeTutorialStep: keyof TutorialProgress | null;
  tutorialSubStep: number;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ 
    activeItem, 
    onNavChange, 
    forgeNotificationCount, 
    bestiaryNotificationCount, 
    tutorialProgress, 
    activeTutorialStep,
    tutorialSubStep
}) => {
  return (
    <div className="bg-brand-card flex justify-around items-center p-1 shadow-inner border-t-2 border-brand-surface">
      {NAV_ITEMS.map((item) => {
        const isActive = item.key === activeItem;
        
        let notificationCount = 0;
        if (item.key === 'Forjar') {
            notificationCount = forgeNotificationCount || 0;
        } else if (item.key === 'Batalhar') {
            notificationCount = bestiaryNotificationCount || 0;
        }

        const isLocked = (item.key === 'Forjar' && !tutorialProgress.saw_forge_unlock && activeTutorialStep !== 'saw_forge_unlock') ||
                         (item.key === 'Herói' && !tutorialProgress.saw_hero_unlock && activeTutorialStep !== 'saw_hero_unlock') ||
                         (item.key === 'Mercado' && !tutorialProgress.saw_market_unlock && activeTutorialStep !== 'saw_market_unlock');

        // NEW: Logic to highlight the next step in the tutorial
        const isTutorialHighlighted = !isActive && !isLocked && (
            (activeTutorialStep === 'saw_welcome_and_battle' && tutorialSubStep === 1 && item.key === 'Batalhar') ||
            (activeTutorialStep === 'saw_forge_unlock' && tutorialSubStep === 1 && item.key === 'Forjar') ||
            (activeTutorialStep === 'saw_hero_unlock' && tutorialSubStep === 1 && item.key === 'Herói') ||
            (activeTutorialStep === 'saw_bestiary_unlock' && tutorialSubStep === 1 && item.key === 'Batalhar') ||
            (activeTutorialStep === 'saw_market_unlock' && tutorialSubStep === 1 && item.key === 'Mercado')
        );

        return (
          <button
            id={`nav-${item.key}`}
            key={item.key}
            onClick={() => onNavChange(item.key)}
            disabled={isLocked}
            className={`relative flex flex-col items-center justify-center p-2 rounded-md transition-all duration-150 w-1/4
                        ${isActive 
                            ? 'bg-brand-accent text-brand-accent-text' 
                            : isLocked 
                                ? 'bg-brand-card-locked text-text-muted'
                                : isTutorialHighlighted
                                    ? 'bg-brand-surface text-brand-primary animate-pulse border-2 border-brand-accent'
                                    : 'text-brand-secondary hover:bg-brand-surface'
                        }
                        ${isLocked ? 'cursor-not-allowed' : ''}`}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className={`text-2xl ${isActive ? '' : 'opacity-70'}`}>{isLocked ? '🔒' : item.icon}</span>
            <span className={`text-[10px] sm:text-xs font-medium mt-0.5 ${isActive ? 'font-semibold' : ''}`}>{item.label}</span>
            
            {notificationCount > 0 && !isLocked && (
              <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 bg-red-500 text-white text-[9px] sm:text-[10px] font-bold w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full flex items-center justify-center border-2 border-brand-card">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default BottomNavBar;