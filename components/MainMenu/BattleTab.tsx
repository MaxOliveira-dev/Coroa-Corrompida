import React, { useState } from 'react';
import type { PlayerData, BiomeData, PlayerProgress, EnemyTemplate, TutorialProgress, ClassDataMap } from '../../types';
import ExploreTab from './ExploreTab';
import BestiaryTab from './BestiaryTab';
import ColiseumView from './ColiseumView';
import { BESTIARY_QUESTS } from '../../gameData';

interface BattleTabProps {
  biomes: BiomeData;
  playerProgress: PlayerProgress;
  onStartGame: (biomeKey: string) => void;
  onStartTraining: (enemyCount: number) => void;
  onStartPvpBattle: (mode: '1v1' | '2v2' | '3v3') => void;
  // Props for Bestiary
  playerData: PlayerData;
  onClaimBestiaryReward: (enemyName: string) => void;
  onShowEnemyTooltip: (enemy: EnemyTemplate, event: React.MouseEvent) => void;
  onHideEnemyTooltip: () => void;
  // Props for tooltip on icon
  onShowSimpleTooltip: (text: string, event: React.MouseEvent) => void;
  onHideSimpleTooltip: () => void;
  // Tutorial Props
  onAdvanceTutorialSubStep: () => void;
  activeTutorialStep: keyof TutorialProgress | null;
  tutorialSubStep: number;
  // For Coliseum
  userId: string;
  classes: ClassDataMap;
}

const GameModeCard: React.FC<{
  id: string;
  icon: string;
  title: string;
  description: string;
  onClick?: () => void;
  disabled?: boolean;
}> = ({ id, icon, title, description, onClick, disabled = false }) => {
  const cardClasses = `
    bg-brand-surface p-4 rounded-lg shadow-md flex items-center space-x-4 border-2 border-brand-card
    transition-all duration-200 ease-in-out
    ${disabled
      ? 'opacity-50 cursor-not-allowed'
      : 'cursor-pointer hover:bg-brand-card hover:border-brand-primary hover:scale-105'
    }
  `;

  return (
    <div id={id} className="relative">
      <div className={cardClasses} onClick={!disabled ? onClick : undefined}>
        <span className="text-5xl">{icon}</span>
        <div className="flex-grow">
          <h3 className="text-lg font-bold text-text-light">{title}</h3>
          <p className="text-sm text-brand-secondary">{description}</p>
        </div>
      </div>
      {disabled && (
        <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-lg">
          Em Breve
        </div>
      )}
    </div>
  );
};

const TrainingSetupView: React.FC<{
  onStartTraining: (enemyCount: number) => void;
  onBack: () => void;
}> = ({ onStartTraining, onBack }) => {
  const [enemyCount, setEnemyCount] = useState(1);

  const handleIncrement = () => {
    setEnemyCount(prev => Math.min(5, prev + 1));
  };

  const handleDecrement = () => {
    setEnemyCount(prev => Math.max(1, prev - 1));
  };

  return (
    <div className="p-4 flex flex-col h-full bg-brand-background items-center justify-center text-center">
      <h2 className="text-2xl font-semibold text-text-light mb-6">Modo Treino</h2>
      <p className="text-brand-secondary mb-8">Selecione quantos inimigos você quer enfrentar.</p>
      
      <div className="flex items-center justify-center space-x-6 mb-10">
        <button 
          onClick={handleDecrement} 
          disabled={enemyCount <= 1}
          className="w-12 h-12 text-3xl font-bold bg-brand-card rounded-full disabled:opacity-50 transition-colors hover:bg-brand-surface focus:outline-none focus:ring-2 focus:ring-brand-primary"
          aria-label="Diminuir número de inimigos"
        >
          -
        </button>
        <div className="flex items-center text-6xl">
          <span className="font-bold text-brand-primary w-12 text-center" aria-live="polite">{enemyCount}</span>
          <span className="ml-4" aria-hidden="true">🤺</span>
        </div>
        <button 
          onClick={handleIncrement} 
          disabled={enemyCount >= 5}
          className="w-12 h-12 text-3xl font-bold bg-brand-card rounded-full disabled:opacity-50 transition-colors hover:bg-brand-surface focus:outline-none focus:ring-2 focus:ring-brand-primary"
          aria-label="Aumentar número de inimigos"
        >
          +
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
            onClick={onBack}
            className="w-56 text-lg py-3 px-6 rounded-lg border-2 border-border-game bg-brand-card text-text-light cursor-pointer shadow-md active:translate-y-1 hover:bg-brand-surface transition-all duration-100 ease-in-out"
        >
            Voltar
        </button>
        <button
            onClick={() => onStartTraining(enemyCount)}
            className="w-56 text-lg py-3 px-6 rounded-lg border-2 border-border-game bg-accent text-accent-text cursor-pointer shadow-button-default active:translate-y-1 active:shadow-button-active hover:bg-accent-hover transition-all duration-100 ease-in-out"
        >
            Iniciar Treino
        </button>
      </div>
    </div>
  );
};


const BattleTab: React.FC<BattleTabProps> = ({
  biomes,
  playerProgress,
  onStartGame,
  onStartTraining,
  onStartPvpBattle,
  playerData,
  onClaimBestiaryReward,
  onShowEnemyTooltip,
  onHideEnemyTooltip,
  onShowSimpleTooltip,
  onHideSimpleTooltip,
  onAdvanceTutorialSubStep,
  activeTutorialStep,
  tutorialSubStep,
  userId,
  classes,
}) => {
  const [activeMode, setActiveMode] = useState<'selection' | 'explore' | 'bestiary' | 'training_setup' | 'coliseum'>(() => {
    const target = localStorage.getItem('returnTarget');
    if (target === 'coliseum') {
        localStorage.removeItem('returnTarget'); // Consume the value
        return 'coliseum';
    }
    return 'selection';
  });

  const handleModeChange = (mode: typeof activeMode) => {
    setActiveMode(mode);
    // Tutorial hooks
    if (activeTutorialStep === 'saw_welcome_and_battle' && tutorialSubStep === 2 && mode === 'explore') {
        onAdvanceTutorialSubStep();
    }
    if (activeTutorialStep === 'saw_bestiary_unlock') {
        if (tutorialSubStep === 2 && mode === 'explore') {
            onAdvanceTutorialSubStep();
        } else if (tutorialSubStep === 3 && mode === 'bestiary') {
            onAdvanceTutorialSubStep();
        }
    }
  };


  if (activeMode === 'explore') {
    return (
      <div className="relative h-full flex flex-col">
        <div className="absolute top-2 right-2 z-10">
          <button
            id="bestiary-button"
            onClick={() => handleModeChange('bestiary')}
            className="bg-brand-accent text-brand-accent-text hover:bg-accent-hover p-2 rounded-full text-2xl font-semibold shadow-lg transition-transform hover:scale-110"
            onMouseEnter={(e) => onShowSimpleTooltip("Acessar Bestiário", e)}
            onMouseLeave={onHideSimpleTooltip}
            aria-label="Acessar Bestiário"
          >
            🐾
          </button>
        </div>
        <button
          onClick={() => setActiveMode('selection')}
          className="absolute top-2 left-2 z-10 bg-brand-card hover:bg-brand-surface text-text-light px-3 py-1 rounded-full text-sm font-semibold"
        >
          &larr; Voltar
        </button>
        <ExploreTab
          biomes={biomes}
          playerProgress={playerProgress}
          onStartGame={onStartGame}
        />
      </div>
    );
  }
  
  if (activeMode === 'bestiary') {
      return (
        <div className="relative h-full flex flex-col">
            <button
                onClick={() => setActiveMode('explore')}
                className="absolute top-2 left-2 z-20 bg-brand-card hover:bg-brand-surface text-text-light px-3 py-1 rounded-full text-sm font-semibold"
            >
                &larr; Voltar
            </button>
            <BestiaryTab
                playerData={playerData}
                biomesData={biomes}
                bestiaryQuests={BESTIARY_QUESTS}
                onClaimReward={onClaimBestiaryReward}
                onShowEnemyTooltip={onShowEnemyTooltip}
                onHideEnemyTooltip={onHideEnemyTooltip}
            />
        </div>
      )
  }

  if (activeMode === 'training_setup') {
    return (
      <TrainingSetupView 
        onStartTraining={onStartTraining} 
        onBack={() => setActiveMode('selection')} 
      />
    );
  }

  if (activeMode === 'coliseum') {
    return (
        <ColiseumView
            playerData={playerData}
            userId={userId}
            classes={classes}
            onStartPvpBattle={onStartPvpBattle}
            onBack={() => setActiveMode('selection')}
        />
    );
  }

  return (
    <div className="p-4 flex flex-col h-full bg-brand-background">
      <h2 className="text-xl font-semibold text-text-light mb-6 text-center shrink-0">Modos de Jogo</h2>
      <div className="flex-grow overflow-y-auto custom-scrollbar -mr-2 pr-2">
        <div className="space-y-4 p-3">
          <GameModeCard
            id="gamemode-explorar"
            icon="🗺️"
            title="Explorar Biomas"
            description="Aventure-se por diferentes terras e derrote chefes para coletar recompensas."
            onClick={() => handleModeChange('explore')}
          />
           <GameModeCard
            id="gamemode-coliseu"
            icon="🏟️"
            title="Coliseu"
            description="Enfrente outros jogadores em batalhas JxJ e suba no ranking."
            onClick={() => handleModeChange('coliseum')}
            disabled={false}
          />
          <GameModeCard
            id="gamemode-treino"
            icon="🤺"
            title="Modo Treino"
            description="Aperfeiçoe suas estratégias contra alvos com vida infinita e dano mínimo."
            onClick={() => setActiveMode('training_setup')}
          />
          <GameModeCard
            id="gamemode-torre"
            icon="🗼"
            title="Torre da Sobrevivência"
            description="Suba andares de uma torre infinita enfrentando ondas de inimigos."
            disabled
          />
        </div>
      </div>
    </div>
  );
};

export default BattleTab;