
import React, { useState, useMemo } from 'react';
import { GameState, BIOMES as ALL_BIOMES, CLASSES as ALL_CLASSES, DROPPABLE_WEAPONS, FORGE_COSTS_BY_TIER } from '../gameData';
import type { PlayerData, BiomeData, ClassDataMap, EquippedItems, CombatReportData, EnemyTemplate, Biome as BiomeType, PlayerFragments, TutorialProgress, AllyTeamMember, BattleTeam, PendingLoot, ModalType, ModalPropsMap, ColiseumRanking } from '../types';
import { generateRandomEquipmentForClass } from '../components/Game/entityUtils';
import { supabase } from '../lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';

const TRAINING_ARENA_BIOME: BiomeType = {
    name: "Arena de Treino",
    description: "Um lugar para testar suas habilidades contra alvos imóveis com vida massiva e dano mínimo.",
    color: '#A9A9A9',
    mapIconUrl: 'https://image.pollinations.ai/prompt/top%20down%20game%20map,%20training%20arena%20with%20dummies,%20cartoon%20style,%20simple?width=100&height=100&seed=150',
    boss: { name: "Boneco de Treino Mestre", emoji: "🤺", baseHp: 1500, baseDamage: 1, isBoss: true, size: 30, velocidadeMovimento: 0, range: 40, attackSpeed: 2000, baseStats: { resistencia: 30 }},
    enemies: [{ name: 'Boneco de Treino', emoji: '🤺', baseHp: 1500, baseDamage: 1, range: 40, attackSpeed: 2000, velocidadeMovimento: 0, baseStats: { resistencia: 30 } }],
    scenery: ['rock', 'rock', 'rock', 'rock']
};

interface UseGameFlowProps {
    playerData: PlayerData;
    session: Session | null;
    setPlayerData: React.Dispatch<React.SetStateAction<PlayerData>>;
    openModal: <T extends ModalType>(type: T, props: ModalPropsMap[T]) => void;
    // FIX: Add closeModal to props to handle closing modals from this hook.
    closeModal: () => void;
    activeTutorialStep: keyof TutorialProgress | null;
    tutorialSubStep: number;
    completeTutorialStep: (step: keyof TutorialProgress) => void;
    setActiveTutorialStep: React.Dispatch<React.SetStateAction<keyof TutorialProgress | null>>;
    setTutorialSubStep: React.Dispatch<React.SetStateAction<number>>;
}

export const determineMainHeroClass = (playerData: PlayerData, classes: ClassDataMap): keyof ClassDataMap => {
    const equippedWeapon = playerData.inventory.equipped.weapon;
    if (equippedWeapon?.equipsToClass) return equippedWeapon.equipsToClass as keyof ClassDataMap;
    if (equippedWeapon) {
        const map: { [key: string]: keyof ClassDataMap | undefined } = {
            'bow': 'ARQUEIRO', 'sword': 'GUERREIRO', 'axe': 'GUERREIRO',
            'staff': 'MAGO', 'dagger': 'ASSASSINO', 'shield': 'GUARDIÃO',
            'hammer': 'PALADINO_CORROMPIDO', 'lute': 'BARDO'
        };
        return map[equippedWeapon.type] || 'AVENTUREIRO';
    }
    return 'AVENTUREIRO';
};

export const useGameFlow = ({
    playerData, session, setPlayerData, openModal, closeModal,
    activeTutorialStep, tutorialSubStep, completeTutorialStep,
    setActiveTutorialStep, setTutorialSubStep,
}: UseGameFlowProps) => {
    const [gameState, setGameState] = useState<GameState>(GameState.MENU);
    const [currentBattleBiomeKey, setCurrentBattleBiomeKey] = useState<string | null>(null);
    const [currentTeam, setCurrentTeam] = useState<BattleTeam | null>(null);
    const [currentEnemies, setCurrentEnemies] = useState<EnemyTemplate[]>([]);
    const [opponentTeam, setOpponentTeam] = useState<BattleTeam | null>(null);
    const [currentPvpMode, setCurrentPvpMode] = useState<'1v1' | '2v2' | '3v3' | null>(null);
    const [opponentId, setOpponentId] = useState<string | null>(null);
    const [currentThreatLevel, setCurrentThreatLevel] = useState(1);


    const biomesForGame: BiomeData = useMemo(() => {
        if (currentBattleBiomeKey === 'TREINO' || currentPvpMode) {
            return { ...ALL_BIOMES, TREINO: TRAINING_ARENA_BIOME, COLISEU: { ...TRAINING_ARENA_BIOME, name: "Coliseu" } };
        }
        return ALL_BIOMES;
    }, [currentBattleBiomeKey, currentPvpMode]);

    const generateEnemiesForExploration = (biomeKey: string, level: number): EnemyTemplate[] => {
        const biome = ALL_BIOMES[biomeKey];
        if (level > 0 && level % 10 === 0) return [biome.boss];
        
        const numEnemies = Math.min(8, 3 + Math.floor(level / 2));
        return Array.from({ length: numEnemies }, () => biome.enemies[Math.floor(Math.random() * biome.enemies.length)]);
    };

    const handleStartExploration = (biomeKey: string) => {
        if (activeTutorialStep === 'saw_welcome_and_battle' && tutorialSubStep === 3) {
            completeTutorialStep('saw_welcome_and_battle');
        }

        const threatLevel = playerData.progress[biomeKey] || 1;
        const enemiesForBattle = generateEnemiesForExploration(biomeKey, threatLevel);
        setCurrentEnemies(enemiesForBattle);

        const mainHeroClassKey = determineMainHeroClass(playerData, ALL_CLASSES);
        const availableAllyKeys = Object.keys(ALL_CLASSES).filter(k => k !== mainHeroClassKey && k !== 'AVENTUREIRO') as (keyof ClassDataMap)[];
        const selectedAllies: AllyTeamMember[] = [];
        for (let i = 0; i < 2 && availableAllyKeys.length > 0; i++) {
            const idx = Math.floor(Math.random() * availableAllyKeys.length);
            const allyKey = availableAllyKeys.splice(idx, 1)[0];
            selectedAllies.push({ classKey: allyKey, equipment: generateRandomEquipmentForClass(allyKey) });
        }

        setCurrentTeam({ main: { classKey: mainHeroClassKey, equipment: playerData.inventory.equipped }, allies: selectedAllies });
        setCurrentThreatLevel(threatLevel);
        setCurrentBattleBiomeKey(biomeKey);
        setGameState(GameState.PLACEMENT);
    };
    
    const handleStartTraining = (enemyCount: number) => {
        const biomeKey = 'TREINO';
        setCurrentEnemies(Array(enemyCount).fill(TRAINING_ARENA_BIOME.enemies[0]));
        const mainHeroClassKey = determineMainHeroClass(playerData, ALL_CLASSES);
        setCurrentTeam({ main: { classKey: mainHeroClassKey, equipment: playerData.inventory.equipped }, allies: [] });
        setCurrentThreatLevel(1);
        setCurrentBattleBiomeKey(biomeKey);
        setGameState(GameState.PLACEMENT);
    };

    const handleStartPvpBattle = async (mode: '1v1' | '2v2' | '3v3') => {
        if (!session?.user) return;
        
        openModal('APP_MESSAGE', { message: 'Procurando um oponente...'});
    
        // 1. Generate Player's Team
        const numAllies = mode === '1v1' ? 0 : mode === '2v2' ? 1 : 2;
        const mainHeroClassKey = determineMainHeroClass(playerData, ALL_CLASSES);
        const availableAllyKeys = Object.keys(ALL_CLASSES).filter(k => k !== mainHeroClassKey && k !== 'AVENTUREIRO') as (keyof ClassDataMap)[];
        const playerAllies: AllyTeamMember[] = [];
        for (let i = 0; i < numAllies && availableAllyKeys.length > 0; i++) {
            const idx = Math.floor(Math.random() * availableAllyKeys.length);
            const allyKey = availableAllyKeys.splice(idx, 1)[0];
            playerAllies.push({ classKey: allyKey, equipment: generateRandomEquipmentForClass(allyKey) });
        }
        const playerTeam: BattleTeam = { main: { classKey: mainHeroClassKey, equipment: playerData.inventory.equipped }, allies: playerAllies };
    
        // 2. Find Opponent
        try {
            const rankKey = `rank_${mode}`;
            const { data: playerRankData, error: playerRankError } = await supabase.from('coliseum_rankings').select(rankKey).eq('player_id', session.user.id).single();
            if (playerRankError && playerRankError.code !== 'PGRST116') throw playerRankError;
            // FIX: Explicitly cast the fetched rank to a number to satisfy TypeScript's strict type checking for arithmetic operations.
            const playerRank = ((playerRankData as Partial<ColiseumRanking>)?.[rankKey as keyof ColiseumRanking] ?? 1000) as number;
    
            const { data: opponentsData, error: opponentError } = await supabase
                .from('coliseum_rankings')
                .select('player_id, main_hero_data')
                .not('player_id', 'eq', session.user.id)
                .not('main_hero_data', 'is', null)
                .lte(rankKey, playerRank + 150)
                .gte(rankKey, playerRank - 150)
                .limit(10);
    
            if (opponentError) throw opponentError;
            
            let opponents = opponentsData;

            if (!opponents || opponents.length === 0) {
                // If no opponents, generate bots after a small delay to simulate searching
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                opponents = [];
                const availableClasses = Object.keys(ALL_CLASSES).filter(k => k !== 'AVENTUREIRO') as (keyof ClassDataMap)[];
                
                for (let i = 0; i < 5; i++) {
                    const randomClassKey = availableClasses[Math.floor(Math.random() * availableClasses.length)];
                    opponents.push({
                        player_id: `bot_${i}_${Date.now()}`,
                        main_hero_data: {
                            classKey: randomClassKey,
                            equipment: generateRandomEquipmentForClass(randomClassKey)
                        }
                    });
                }
            }
            
            const opponent = opponents[Math.floor(Math.random() * opponents.length)];
            const opponentMainHeroData = opponent.main_hero_data as { classKey: keyof ClassDataMap, equipment: EquippedItems };
            
            // 3. Generate Opponent's Team
            const opponentAvailableAllyKeys = Object.keys(ALL_CLASSES).filter(k => k !== opponentMainHeroData.classKey && k !== 'AVENTUREIRO') as (keyof ClassDataMap)[];
            const opponentAllies: AllyTeamMember[] = [];
            for (let i = 0; i < numAllies && opponentAvailableAllyKeys.length > 0; i++) {
                const idx = Math.floor(Math.random() * opponentAvailableAllyKeys.length);
                const allyKey = opponentAvailableAllyKeys.splice(idx, 1)[0];
                opponentAllies.push({ classKey: allyKey, equipment: generateRandomEquipmentForClass(allyKey) });
            }
            const generatedOpponentTeam: BattleTeam = { main: opponentMainHeroData, allies: opponentAllies };
    
            // 4. Start Battle
            const randomThreatLevel = Math.floor(Math.random() * 300) + 1;
            setOpponentId(opponent.player_id);
            setCurrentPvpMode(mode);
            setCurrentTeam(playerTeam);
            setOpponentTeam(generatedOpponentTeam);
            setCurrentBattleBiomeKey('COLISEU');
            setCurrentEnemies([]); // Not used in PvP
            setCurrentThreatLevel(randomThreatLevel);
            setGameState(GameState.PLACEMENT);
            closeModal(); // Close the "searching" modal
            openModal('APP_MESSAGE', { message: `Evento Aleatório do Coliseu!\nNível de Ameaça da Batalha: ${randomThreatLevel}` });

        } catch (error) {
            console.error("Error starting PvP battle:", error);
            openModal('APP_MESSAGE', { message: 'Erro ao iniciar batalha PvP.' });
        }
    };

    const handleGameEnd = async (playerWon: boolean, biomeKey: string, isBossLevel: boolean, report: CombatReportData) => {
        if (currentPvpMode && opponentId && session?.user.id) {
            const rankKey = `rank_${currentPvpMode}`;
            let rankChange = playerWon ? 20 : -15;
    
            try {
                const { data: playerRanking, error: playerRankError } = await supabase
                    .from('coliseum_rankings')
                    .select(rankKey)
                    .eq('player_id', session.user.id)
                    .single();
                
                if (playerRankError && playerRankError.code !== 'PGRST116') throw playerRankError;
                
                // FIX: Explicitly cast the fetched rank to a number for arithmetic operations.
                const playerCurrentRank = ((playerRanking as Partial<ColiseumRanking>)?.[rankKey as keyof ColiseumRanking] ?? 1000) as number;
                const playerNewRank = Math.max(0, playerCurrentRank + rankChange);
                
                const { error: playerUpdateError } = await supabase
                    .from('coliseum_rankings')
                    .update({ [rankKey]: playerNewRank })
                    .eq('player_id', session.user.id);
                
                if (playerUpdateError) throw playerUpdateError;
    
                if (!opponentId.startsWith('bot_')) {
                    const { data: opponentRanking, error: opponentRankError } = await supabase
                        .from('coliseum_rankings')
                        .select(rankKey)
                        .eq('player_id', opponentId)
                        .single();
    
                    if (opponentRankError && opponentRankError.code !== 'PGRST116') {
                        console.error("Error fetching opponent rank:", opponentRankError);
                    } else if (opponentRanking) {
                        // FIX: Explicitly cast the opponent's rank to a number before performing arithmetic.
                        const opponentCurrentRank = ((opponentRanking as Partial<ColiseumRanking>)?.[rankKey as keyof ColiseumRanking] ?? 1000) as number;
                        const opponentNewRank = Math.max(0, opponentCurrentRank - rankChange);
    
                        const { error: opponentUpdateError } = await supabase
                            .from('coliseum_rankings')
                            .update({ [rankKey]: opponentNewRank })
                            .eq('player_id', opponentId);
    
                        if (opponentUpdateError) console.error("Error updating opponent rank:", opponentUpdateError);
                    }
                }
            } catch (error) {
                 console.error("Error updating ranks:", error);
                 rankChange = 0;
            } finally {
                openModal('POST_PVP_BATTLE', {
                    report,
                    playerWon,
                    rankChange
                });
            }
            return;
        }

        if (biomeKey === 'TREINO') {
            openModal('APP_MESSAGE', { message: "Sessão de treino concluída!" });
            returnToMenu();
            return;
        }
    
        const wasFirstWin = playerWon && !playerData.hasHadFirstWin;
        let awardedLoot: PendingLoot | null = null;
    
        if (playerWon) {
            const currentLevel = playerData.progress[biomeKey] || 1;
            const awardedCoins = 10 + (10 * currentLevel);
            const awardedFragments: PlayerFragments = {};
    
            if (wasFirstWin) {
                awardedFragments["Espada Velha"] = FORGE_COSTS_BY_TIER[1];
            }
            
            const numBundles = 1 + Math.floor(Math.random() * 2) + (isBossLevel ? 2 : 0);
            const potentialDrops = isBossLevel ? DROPPABLE_WEAPONS : DROPPABLE_WEAPONS.filter(i => i.tier !== 4);
            
            for (let i = 0; i < numBundles; i++) {
                if (potentialDrops.length === 0) continue;
                const item = potentialDrops[Math.floor(Math.random() * potentialDrops.length)];
                if (!item) continue;
                const quantity = 1 + Math.floor(currentLevel / 15) + (isBossLevel ? 2 : 0);
                awardedFragments[item.name] = (awardedFragments[item.name] || 0) + quantity;
            }
            
            awardedLoot = { fragments: awardedFragments, coins: awardedCoins };
        }
    
        setPlayerData(prev => {
            const newBestiary = { ...prev.bestiary };
            for (const [enemyName, killData] of Object.entries(report.enemiesKilled)) {
                newBestiary[enemyName] = { 
                    kills: (newBestiary[enemyName]?.kills || 0) + killData.count, 
                    claimedTier: newBestiary[enemyName]?.claimedTier || 0
                };
            }
    
            if (playerWon && awardedLoot) {
                const currentLevel = prev.progress[biomeKey] || 1;
                const newFragments = { ...prev.fragments };
                for (const itemName in awardedLoot.fragments) {
                    newFragments[itemName] = (newFragments[itemName] || 0) + awardedLoot.fragments[itemName];
                }
                return {
                    ...prev,
                    bestiary: newBestiary,
                    progress: { ...prev.progress, [biomeKey]: currentLevel + 1 },
                    fragments: newFragments,
                    coins: prev.coins + (awardedLoot.coins || 0),
                    hasHadFirstWin: prev.hasHadFirstWin || wasFirstWin,
                };
            }
            
            return { ...prev, bestiary: newBestiary };
        });
    
        if (playerWon && awardedLoot) {
            setGameState(GameState.POST_BATTLE_REWARDS);
            if (wasFirstWin) {
                setActiveTutorialStep('saw_post_battle_loot');
                setTutorialSubStep(0);
            }
            openModal('POST_BATTLE_LOOT', { loot: awardedLoot, report, biomeKey });
        } else {
            setGameState(GameState.LEVEL_LOST);
            openModal('DEFEAT_SCREEN', { biomeKey, report });
        }
    };

    const returnToMenu = () => {
        if (activeTutorialStep === 'saw_post_battle_loot') {
            completeTutorialStep('saw_post_battle_loot');
        }
        setGameState(GameState.MENU);
        setCurrentBattleBiomeKey(null);
        setCurrentTeam(null);
        setCurrentEnemies([]);
        setOpponentTeam(null);
        setCurrentPvpMode(null);
        setOpponentId(null);
    };

    const returnToColiseum = () => {
        localStorage.setItem('returnTarget', 'coliseum');
        returnToMenu();
    };

    const startNextLevel = (biomeKey: string) => {
        setGameState(GameState.MENU);
        setTimeout(() => handleStartExploration(biomeKey), 0);
    };

    return {
        gameState, setGameState,
        currentBattleBiomeKey, currentTeam, currentEnemies, opponentTeam,
        currentThreatLevel,
        biomesForGame,
        handleStartExploration, handleStartTraining, handleStartPvpBattle, handleGameEnd,
        returnToMenu, returnToColiseum, startNextLevel,
    };
};
