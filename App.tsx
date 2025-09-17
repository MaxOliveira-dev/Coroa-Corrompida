
import React, { useEffect, useMemo } from 'react';
import { useAuth } from './hooks/useAuth';
import { usePlayerData } from './hooks/usePlayerData';
import { useTutorial } from './hooks/useTutorial';
import { useGameFlow } from './hooks/useGameFlow';
import { usePlayerActions } from './hooks/usePlayerActions';
import { useModal } from './hooks/useModal';

import MainMenu from './components/MainMenu/MainMenu';
import GameContainer from './components/Game/GameContainer';
import Auth from './components/Auth';
import ModalManager from './components/ModalManager';
import TutorialOverlay from './components/MainMenu/TutorialOverlay';

import { BIOMES as ALL_BIOMES, CLASSES as ALL_CLASSES, DROPPABLE_WEAPONS, GameState, MARKET_ITEMS, FORGE_COSTS_BY_TIER, BESTIARY_QUESTS } from './gameData';
import type { TutorialProgress } from './types';

const App: React.FC = () => {
    // Modal Management
    const { modal, openModal, closeModal } = useModal();
    
    // Auth and Data Loading
    const { session, loading: authLoading, handleSignOut } = useAuth();
    const { playerData, setPlayerData, loading: dataLoading } = usePlayerData(session);
    
    // Tutorial State & Logic
    const {
        activeTutorialStep,
        tutorialSubStep,
        completeTutorialStep,
        advanceTutorialSubStep,
        setActiveTutorialStep,
        setTutorialSubStep,
    } = useTutorial(playerData, setPlayerData);

    // FIX: Moved useGameFlow hook before the useEffect that depends on `gameState`.
    // Game State and Flow Logic
    const {
        gameState,
        currentBattleBiomeKey,
        currentTeam,
        currentEnemies,
        opponentTeam,
        currentThreatLevel, // Deconstructed new state
        biomesForGame,
        handleStartExploration,
        handleStartTraining,
        handleStartPvpBattle,
        handleGameEnd,
        returnToMenu,
        returnToColiseum, // Deconstructed new function
        startNextLevel,
    } = useGameFlow({
        playerData,
        session,
        setPlayerData,
        openModal,
        // FIX: Pass `closeModal` to the `useGameFlow` hook to allow it to close modals.
        closeModal,
        activeTutorialStep,
        tutorialSubStep,
        completeTutorialStep,
        setActiveTutorialStep,
        setTutorialSubStep,
    });

    // This effect will now control starting tutorials
    useEffect(() => {
        if (gameState !== GameState.MENU || !playerData || playerData.name === "Rei Bárbaro") return;

        const { tutorial_progress, fragments, bestiary, coins } = playerData;

        // Determine if any item is forgeable
        const isItemForgeable = DROPPABLE_WEAPONS.some(item => {
            if (!item.tier) return false;
            const required = FORGE_COSTS_BY_TIER[item.tier];
            const current = fragments[item.name] || 0;
            return current >= required;
        });

        // Determine if any bestiary reward is claimable
        const isBestiaryClaimable = Object.keys(bestiary).some(enemyName => {
            const entry = bestiary[enemyName];
            const quest = BESTIARY_QUESTS[enemyName];
            if (!entry || !quest) return false;
            const tier = quest.tiers[entry.claimedTier];
            return tier && entry.kills >= tier.required;
        });
        
        const firstMarketItemCost = MARKET_ITEMS[0]?.purchaseOptions[0]?.cost || 1000;

        let nextStep: keyof TutorialProgress | null = null;
        if (!tutorial_progress.saw_welcome_and_battle) {
            nextStep = 'saw_welcome_and_battle';
        } else if (tutorial_progress.saw_post_battle_loot && isItemForgeable && !tutorial_progress.saw_forge_unlock) {
            nextStep = 'saw_forge_unlock';
        } else if (tutorial_progress.saw_forge_unlock && !tutorial_progress.saw_hero_unlock) {
            nextStep = 'saw_hero_unlock';
        } else if (isBestiaryClaimable && !tutorial_progress.saw_bestiary_unlock) {
            nextStep = 'saw_bestiary_unlock';
        } else if (coins >= firstMarketItemCost && !tutorial_progress.saw_market_unlock) {
            nextStep = 'saw_market_unlock';
        }
        
        if (activeTutorialStep !== nextStep) {
            setActiveTutorialStep(nextStep);
            setTutorialSubStep(0); // Reset sub-step when the main step changes
        }

    }, [gameState, playerData, activeTutorialStep, setActiveTutorialStep, setTutorialSubStep]);
    
    // Player Actions in Menu
    const {
        handleUpdatePlayerName,
        handleEquipFromBackpack,
        handleUnequipItem,
        handleForgeItem,
        handleForgeAllItems,
        handleClaimBestiaryReward,
        handlePurchaseMarketItem,
    } = usePlayerActions({
        playerData,
        setPlayerData,
        openModal,
        activeTutorialStep,
        tutorialSubStep,
        advanceTutorialSubStep,
        setActiveTutorialStep,
        setTutorialSubStep,
    });

    const forgeableItemsCount = useMemo(() => {
        return DROPPABLE_WEAPONS.reduce((count, item) => {
          if (item.tier) {
            const requiredFragments = FORGE_COSTS_BY_TIER[item.tier];
            const currentFragments = playerData.fragments[item.name] || 0;
            if (currentFragments >= requiredFragments) {
              return count + 1;
            }
          }
          return count;
        }, 0);
    }, [playerData.fragments]);

    const bestiaryRewardsCount = useMemo(() => {
        let count = 0;
        for (const enemyName in playerData.bestiary) {
            const questData = BESTIARY_QUESTS[enemyName];
            if (!questData) continue;
            const playerEntry = playerData.bestiary[enemyName];
            const currentTierIndex = playerEntry.claimedTier;
            const questTier = questData.tiers[currentTierIndex];
            if (questTier && playerEntry.kills >= questTier.required) {
                count++;
            }
        }
        return count;
    }, [playerData.bestiary]);
    
    const loading = authLoading || dataLoading;
    
    // --- RENDER LOGIC ---
    if (loading) {
        return (
            <div className="w-screen h-screen flex justify-center items-center bg-brand-background">
                <p className="text-text-light text-xl animate-pulse">Carregando Jogo...</p>
            </div>
        );
    }
    
    if (!session) {
        return <Auth />;
    }

  return (
    <>
      <ModalManager
        modal={modal}
        closeModal={closeModal}
        playerData={playerData}
        setPlayerData={setPlayerData}
        returnToMenu={returnToMenu}
        returnToColiseum={returnToColiseum} // Passed new function
        startNextLevel={startNextLevel}
        openModal={openModal}
        activeTutorialStep={activeTutorialStep}
        tutorialSubStep={tutorialSubStep}
        advanceTutorialSubStep={advanceTutorialSubStep}
      />

      <TutorialOverlay
        step={activeTutorialStep}
        subStep={tutorialSubStep}
        onNext={advanceTutorialSubStep}
        onComplete={completeTutorialStep}
        bestiaryClaimableCount={bestiaryRewardsCount}
        forgeableItemCount={forgeableItemsCount}
        onSetNav={() => {}} 
      />

      {gameState === GameState.MENU && (
        <div className="w-screen h-screen flex justify-center items-center p-4 bg-brand-background">
            <MainMenu
              playerData={playerData}
              userId={session.user.id}
              biomes={ALL_BIOMES}
              classes={ALL_CLASSES}
              droppableWeapons={DROPPABLE_WEAPONS}
              onUpdatePlayerName={handleUpdatePlayerName}
              onEquipFromBackpack={handleEquipFromBackpack}
              onUnequipItem={handleUnequipItem}
              onStartGame={handleStartExploration}
              onStartTraining={handleStartTraining}
              onStartPvpBattle={handleStartPvpBattle}
              onForgeItem={handleForgeItem}
              onForgeAllItems={handleForgeAllItems}
              onClaimBestiaryReward={handleClaimBestiaryReward}
              marketItems={MARKET_ITEMS}
              onPurchaseMarketItem={handlePurchaseMarketItem}
              onSignOut={handleSignOut}
              activeTutorialStep={activeTutorialStep}
              tutorialSubStep={tutorialSubStep}
              onCompleteTutorialStep={completeTutorialStep}
              onAdvanceTutorialSubStep={advanceTutorialSubStep}
            />
        </div>
      )}

      {(gameState === GameState.PLACEMENT || gameState === GameState.BATTLE) && currentBattleBiomeKey && currentTeam && (
        <div className="w-screen h-screen">
          <GameContainer
            playerData={playerData}
            classes={ALL_CLASSES}
            biomes={biomesForGame}
            currentBattleBiomeKey={currentBattleBiomeKey}
            currentThreatLevel={currentThreatLevel}
            onGameEnd={handleGameEnd}
            initialGameState={gameState}
            team={currentTeam}
            opponentTeam={opponentTeam}
            enemies={currentEnemies}
            onReturnToMenu={returnToMenu}
          />
        </div>
      )}
    </>
  );
};

export default App;
