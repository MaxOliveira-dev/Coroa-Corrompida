import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Application } from 'pixi.js'; // Import PixiJS
import type { PlayerData, ClassDataMap, BiomeData, BaseStats, ClassData, EnemyTemplate, Item as ItemType, Point, PlacementSlot as PlacementSlotType, Biome as BiomeType, EquippedItems, Ability as AbilityType, ActiveBuffDebuff, ActiveBuffDebuffEffect, CombatReportData, EnemyKillCount, ActiveArea, RealTimeStat, BattleTeam, AllyTeamMember } from '../../types';
import { GameState, CLASSES as ALL_CLASSES_DATA, PLAYER_DATA as DEFAULT_PLAYER_DATA } from '../../gameData'; // Added DEFAULT_PLAYER_DATA
import AbilityBar from './AbilityBar';
import { VisualEffectsManager } from './VisualEffectsManager'; 
import HeroPortrait from './HeroPortrait';
import PreBattleHeroDetailsModal from '../Modal/PreBattleHeroDetailsModal';
import { GRID_SIZE, MIN_PLACEMENT_DIST_TO_ENEMY } from './gameConstants';
import { drawRoundedRect, drawTree, drawRock, drawRiver, drawPineTree, drawPuddle, drawFlower } from './drawingUtils';
import type { SceneryElement, TreeSceneryElement, RockSceneryElement, RiverSceneryElement, PineTreeSceneryElement, PuddleSceneryElement, FlowerSceneryElement } from './sceneryTypes';
import type { CombatCapable, UpdateResult, EventDispatcher, GameEvent, GameEventType } from './entityInterfaces';
import { resetEntityIdCounter, calculateFinalStatsForEntity, isTargetInCone, distanceToTarget, getMultiShotTargets, getEntityId } from './entityUtils'; // Added isTargetInCone, distanceToTarget
import * as vfx from './vfx';
import { vfxHandlers } from './vfx/vfxHandlers'; // New import for VFX handlers

import { Character } from './entities/Character'; 
import { HeroEntity } from './entities/HeroEntity';
import { EnemyEntity } from './entities/EnemyEntity';
import { Projectile } from './entities/Projectile'; 
import { DamageNumber, NotificationText } from './entities/DamageNumber';
import { DeathEffect } from './entities/DeathEffect';
import { SkeletonAlly, LivingTreeAlly } from './entities/SkeletonAlly';
import RealTimeStatsPanel from './RealTimeStatsPanel';

interface GameContainerProps {
  playerData: PlayerData;
  classes: ClassDataMap;
  biomes: BiomeData;
  currentBattleBiomeKey: string;
  currentThreatLevel: number;
  onGameEnd: (playerWon: boolean, biomeKey: string, isBossLevel: boolean, report: CombatReportData) => void;
  initialGameState: GameState;
  team: BattleTeam;
  opponentTeam?: BattleTeam | null;
  enemies: EnemyTemplate[];
  onReturnToMenu: () => void;
}

const defaultEmptyBaseStats: BaseStats = { // Used for enemies if their template lacks base stats
    letalidade: 0, vigor: 0, resistencia: 0, 
    velocidadeAtaque: 0, velocidadeMovimento: 1, 
    chanceCritica: 0, danoCritico: 50, // Default danoCritico to 50%
    // FIX: Added missing 'chanceEsquiva' property to conform to the BaseStats type.
    chanceEsquiva: 0,
    // FIX: Added missing 'chanceDeAcerto' property to conform to the BaseStats type.
    chanceDeAcerto: 100,
    vampirismo: 0, poderDeCura: 0, curaRecebidaBonus: 0
};

interface RainParticle {
    x: number;
    y: number;
    length: number;
    speed: number;
    opacity: number;
}

const INSPECT_ICON_SIZE = 36;
const INSPECT_ICON_OFFSET_Y = -45;

const GameContainer: React.FC<GameContainerProps> = ({
  playerData, classes, biomes, currentBattleBiomeKey,
  currentThreatLevel,
  onGameEnd, initialGameState, team, opponentTeam, enemies, onReturnToMenu
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pixiCanvasRef = useRef<HTMLCanvasElement>(null); 
  const pixiAppRef = useRef<Application | null>(null); 
  const visualEffectsManagerRef = useRef<VisualEffectsManager | null>(null);
  const backgroundCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const animationFrameId = useRef<number | undefined>(undefined);
  const hasEndedLevel = useRef(false);
  const lastFrameTimeRef = useRef<number>(0);

  // --- State managed by React (for UI rendering) ---
  const [internalGameState, setInternalGameState] = useState<GameState>(initialGameState);
  const [message, setMessage] = useState<string | null>(null);
  const [mainHeroAbilities, setMainHeroAbilities] = useState<AbilityType[]>([]);
  const [mainHeroAbilityCooldowns, setMainHeroAbilityCooldowns] = useState<{ [abilityId: string]: number }>({});
  const [mainHeroForPortrait, setMainHeroForPortrait] = useState<HeroEntity | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [hoveredSlotId, setHoveredSlotId] = useState<string | null>(null);

  const [selectedEntityForInspection, setSelectedEntityForInspection] = useState<CombatCapable | null>(null);
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [showRealTimeStats, setShowRealTimeStats] = useState(false);
  const [realTimeStatsData, setRealTimeStatsData] = useState<RealTimeStat[]>([]);


  // --- Game state managed by Refs (for performance, avoids re-renders) ---
  const heroesRef = useRef<HeroEntity[]>([]);
  const enemiesRef = useRef<(EnemyEntity | HeroEntity)[]>([]);
  const playerAlliesRef = useRef<(SkeletonAlly | LivingTreeAlly)[]>([]);
  const opponentAlliesRef = useRef<(SkeletonAlly | LivingTreeAlly)[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const damageNumbersRef = useRef<DamageNumber[]>([]);
  const notificationTextsRef = useRef<NotificationText[]>([]);
  const effectsRef = useRef<DeathEffect[]>([]);
  const activeAreasRef = useRef<ActiveArea[]>([]);
  const areaIndicatorsRef = useRef<{x: number, y: number, radius: number, remainingMs: number, initialMs: number}[]>([]);
  const delayedActionsRef = useRef<{ executeAt: number; action: () => UpdateResult[] }[]>([]);
  const eventQueueRef = useRef<GameEvent[]>([]); // NEW: Event Queue
  const placementSlotsRef = useRef<PlacementSlotType[]>([]);
  const sceneryElementsRef = useRef<SceneryElement[]>([]);
  const rainParticlesRef = useRef<RainParticle[]>([]);
  const initialHeroesRef = useRef<HeroEntity[]>([]);
  const killedEnemiesRef = useRef<EnemyKillCount>({});
  const draggedHeroRef = useRef<{ hero: HeroEntity; originalX: number; originalY: number } | null>(null);
  const mainHeroClassKeyRef = useRef<keyof ClassDataMap>('AVENTUREIRO');
  const highlightedSlotRef = useRef<{ id: string; valid: boolean } | null>(null);
  const battleStartTimeRef = useRef<number>(0);
  const lastStatsUpdateTimeRef = useRef<number>(0);


  const currentBiome = biomes[currentBattleBiomeKey];
  

    // --- NEW: Event Dispatcher Implementation ---
    const dispatchEvent = useCallback((type: GameEventType, payload: any) => {
        eventQueueRef.current.push({ type, payload });
    }, []);

    const dispatcherRef = useRef<EventDispatcher>({
        dispatchEvent,
        addDelayedAction: (delayMs, action) => {
            delayedActionsRef.current.push({ executeAt: Date.now() + delayMs, action });
        }
    });
    
    useEffect(() => {
        const handleResize = () => {
            setCanvasSize({ width: window.innerWidth, height: window.innerHeight });
        };
        window.addEventListener('resize', handleResize);
        handleResize(); // Initial size
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (pixiCanvasRef.current && !pixiAppRef.current) {
            // FIX: Prevent Pixi from initializing with zero dimensions, which causes an error.
            if (canvasSize.width === 0 || canvasSize.height === 0) {
                return; // Wait for valid canvas dimensions
            }
            const app = new Application({
                view: pixiCanvasRef.current,
                width: canvasSize.width,
                height: canvasSize.height,
                backgroundColor: 0x000000, 
                backgroundAlpha: 0, 
                antialias: true,
                autoStart: false, 
            });
            pixiAppRef.current = app;
            visualEffectsManagerRef.current = new VisualEffectsManager(app.stage);
        } else if (pixiAppRef.current) {
            pixiAppRef.current.renderer.resize(canvasSize.width, canvasSize.height);
        }

        return () => {
            if (pixiAppRef.current && !pixiCanvasRef.current) {
                pixiAppRef.current?.destroy(false, { children: true, texture: true }); 
                pixiAppRef.current = null;
                visualEffectsManagerRef.current = null;
            }
        };
    }, [canvasSize]);


    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [message]);

  const setupLevel: () => void = useCallback(() => {
    hasEndedLevel.current = false;
    resetEntityIdCounter(); 
    killedEnemiesRef.current = {};
    heroesRef.current = [];
    enemiesRef.current = [];
    playerAlliesRef.current = [];
    opponentAlliesRef.current = [];
    activeAreasRef.current = [];
    areaIndicatorsRef.current = [];
    setShowRealTimeStats(false);
    setRealTimeStatsData([]);
    battleStartTimeRef.current = 0;

    const threatLevelForBattle = currentThreatLevel;

    const newPlacementSlots: PlacementSlotType[] = [];
    let slotIdCounter = 0;
    for (let y = GRID_SIZE; y < canvasSize.height - GRID_SIZE; y += GRID_SIZE) {
        for (let x = GRID_SIZE / 2; x < canvasSize.width; x += GRID_SIZE) {
            newPlacementSlots.push({ id: `slot-${slotIdCounter++}`, x: x, y: y, occupied: false });
        }
    }
    placementSlotsRef.current = newPlacementSlots;

    // Player Team Setup (common for both modes)
    const mainHeroClassKey = team.main.classKey;
    mainHeroClassKeyRef.current = mainHeroClassKey;
    const mainHeroClassDefinition = ALL_CLASSES_DATA[mainHeroClassKey];
    setMainHeroAbilities(mainHeroClassDefinition.abilities || []);

    const mainHeroInitialCombatStats = calculateFinalStatsForEntity(
        playerData.baseStats, 
        classes[mainHeroClassKey], 
        undefined, 1, team.main.equipment, [], [], threatLevelForBattle
    );
    heroesRef.current.push(new HeroEntity(
        canvasSize.width / 2, canvasSize.height - GRID_SIZE * 2, 
        mainHeroInitialCombatStats, true,
        playerData.baseStats, classes[mainHeroClassKey], team.main.equipment, threatLevelForBattle, false
    ));

    team.allies.forEach((ally, i) => {
        const allyInitialCombatStats = calculateFinalStatsForEntity(
             { ...DEFAULT_PLAYER_DATA.baseStats }, 
             classes[ally.classKey], 
             undefined, 1, ally.equipment, [], [], threatLevelForBattle
        ); 
        heroesRef.current.push(new HeroEntity(
            canvasSize.width / 2 + (i + 1) * GRID_SIZE * 1.5, canvasSize.height - GRID_SIZE * 2, 
            allyInitialCombatStats, false, 
            { ...DEFAULT_PLAYER_DATA.baseStats }, 
            classes[ally.classKey],
            ally.equipment, threatLevelForBattle, false
        ));
    });

    // Opponent/Enemy Setup
    if (opponentTeam) { // PvP Battle - Strategic Placement
        const newOpponentHeroes: HeroEntity[] = [];
        const opponentAllTeamMembers = [opponentTeam.main, ...opponentTeam.allies];
        const FRONTLINE_CLASSES: (keyof ClassDataMap)[] = ['GUERREIRO', 'GUARDIÃO', 'ASSASSINO', 'PALADINO_CORROMPIDO', 'AVENTUREIRO'];
    
        const opponentFrontliners = opponentAllTeamMembers.filter(member => FRONTLINE_CLASSES.includes(member.classKey));
        const opponentBackliners = opponentAllTeamMembers.filter(member => !FRONTLINE_CLASSES.includes(member.classKey));
        
        const opponentSlots = newPlacementSlots.filter(s => s.y < canvasSize.height / 2);
        const frontSlots = opponentSlots.filter(s => s.y < canvasSize.height * 0.20).sort(() => 0.5 - Math.random());
        const backSlots = opponentSlots.filter(s => s.y >= canvasSize.height * 0.20).sort(() => 0.5 - Math.random());
    
        const placeHero = (member: AllyTeamMember, slots: PlacementSlotType[]) => {
            const slot = slots.find(s => !s.occupied);
            if (slot) {
                const stats = calculateFinalStatsForEntity(
                    { ...DEFAULT_PLAYER_DATA.baseStats },
                    classes[member.classKey],
                    undefined, 1, member.equipment, [], [], threatLevelForBattle
                );
                newOpponentHeroes.push(new HeroEntity(
                    slot.x, slot.y,
                    stats, false, { ...DEFAULT_PLAYER_DATA.baseStats },
                    classes[member.classKey], member.equipment, threatLevelForBattle, true
                ));
                slot.occupied = true;
                return true;
            }
            return false;
        };
        
        opponentFrontliners.forEach(member => {
            if (!placeHero(member, frontSlots)) {
                placeHero(member, backSlots);
            }
        });
    
        opponentBackliners.forEach(member => {
            if (!placeHero(member, backSlots)) {
                placeHero(member, frontSlots);
            }
        });
    
        enemiesRef.current = newOpponentHeroes;
    } else { // PvE Battle
        const newEnemies: EnemyEntity[] = [];
        enemies.forEach((enemyTemplate) => {
            const effectiveThreatLevel = threatLevelForBattle;
            const enemyInitialStats = calculateFinalStatsForEntity(
                { ...defaultEmptyBaseStats, ...(enemyTemplate.baseStats || {}) },
                undefined, enemyTemplate, 1, undefined, [], [], effectiveThreatLevel
            );
            const ex = enemyTemplate.isBoss 
                ? canvasSize.width / 2 
                : 100 + Math.random() * (canvasSize.width - 200);
            const ey = enemyTemplate.isBoss
                ? GRID_SIZE * 3
                : GRID_SIZE * 2 + Math.random() * (canvasSize.height * 0.4);
            newEnemies.push(new EnemyEntity(ex, ey, enemyInitialStats, enemyTemplate, effectiveThreatLevel));
        });
        enemiesRef.current = newEnemies;
    }

    heroesRef.current.forEach(hero => {
        let bestSlot: PlacementSlotType | null = null;
        let minDist = Infinity;
        for (const slot of placementSlotsRef.current) {
            if (!slot.occupied) {
                const dist = Math.hypot(hero.x - slot.x, hero.y - slot.y);
                if (dist < minDist) {
                    minDist = dist;
                    bestSlot = slot;
                }
            }
        }
        if (bestSlot) {
            hero.x = bestSlot.x;
            hero.y = bestSlot.y;
            bestSlot.occupied = true;
        }
    });
    initialHeroesRef.current = [...heroesRef.current];

    // Reset battle-specific flags for all heroes
    heroesRef.current.forEach(hero => {
        hero.hasUsedFirstAbilityThisBattle = false;
    });
    
    // --- Scenery, particles, etc. ---
    const newSceneryElements: SceneryElement[] = [];
    rainParticlesRef.current = [];
    if (currentBattleBiomeKey === 'FLORESTA') {
        const numRaindrops = 200;
        for (let i = 0; i < numRaindrops; i++) {
            rainParticlesRef.current.push({
                x: Math.random() * canvasSize.width * 1.2 - canvasSize.width * 0.1,
                y: Math.random() * canvasSize.height,
                length: Math.random() * 15 + 5,
                speed: Math.random() * 5 + 3,
                opacity: Math.random() * 0.3 + 0.2
            });
        }
    }
    // ... (rest of scenery generation code is unchanged)
    if (currentBattleBiomeKey === 'PANTANO') {
        const numRivers = 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < numRivers; i++) {
            const riverPath: {x: number, y: number}[] = [];
            const numPoints = 4 + Math.floor(Math.random() * 3);
            const yStart = Math.random() * canvasSize.height;
            riverPath.push({ x: -50, y: yStart });
            for(let p = 1; p < numPoints - 1; p++) {
                riverPath.push({
                    x: (canvasSize.width / (numPoints-1)) * p + (Math.random() - 0.5) * 100,
                    y: Math.random() * canvasSize.height
                });
            }
            const yEnd = Math.random() * canvasSize.height;
            riverPath.push({ x: canvasSize.width + 50, y: yEnd });
            newSceneryElements.push({ item: 'river', path: riverPath, width: 40 + Math.random() * 30 });
        }
    }

    const numSceneryObjects = 50; 
    const biomeSceneryTypes = (currentBiome as BiomeType).scenery; 
    const objectSceneryTypes = biomeSceneryTypes.filter(s => s !== 'river'); 

    if (objectSceneryTypes && objectSceneryTypes.length > 0) {
        for (let i = 0; i < numSceneryObjects; i++) {
            const itemTypeName = objectSceneryTypes[Math.floor(Math.random() * objectSceneryTypes.length)];
            const xPos = Math.random() * canvasSize.width;
            const yPos = Math.random() * canvasSize.height; 
            const itemAlpha = 1.0; 
            let itemSize: number;
            if (itemTypeName === 'rock') {
                itemSize = Math.random() * (GRID_SIZE*0.20 - GRID_SIZE*0.10) + GRID_SIZE*0.10;
            } else if (itemTypeName === 'flower') {
                itemSize = Math.random() * 15 + 10;
            } else if (itemTypeName === 'puddle') {
                itemSize = Math.random() * 30 + 20;
            } else { 
                itemSize = Math.random() * 25 + 30; 
            }
            const baseSceneryProps = { x: xPos, y: yPos, size: itemSize, alpha: itemAlpha, biomeName: currentBattleBiomeKey as keyof BiomeData };
            
            switch (itemTypeName) {
                case 'tree': {
                    let cactusData: TreeSceneryElement['cactus'] = undefined;
                    if (currentBattleBiomeKey === 'DESERTO') {
                        const numArms = Math.random() > 0.3 ? (Math.random() > 0.5 ? 2 : 1) : 0;
                        cactusData = { numArms, arm1: numArms >= 1 ? { heightRatio: (0.4 + Math.random() * 0.2), yOffsetRatio: (0.2 + Math.random() * 0.2) } : undefined, arm2: numArms === 2 ? { heightRatio: (0.4 + Math.random() * 0.2), yOffsetRatio: (0.3 + Math.random() * 0.2) } : undefined };
                    }
                    newSceneryElements.push({ ...baseSceneryProps, item: 'tree', foliageWidthMultiplier: (1 + Math.random() * 0.1), cactus: cactusData });
                    break;
                }
                case 'pine_tree': {
                    newSceneryElements.push({ ...baseSceneryProps, item: 'pine_tree' });
                    break;
                }
                case 'puddle': {
                    const puddlePoints: { dx: number; dy: number }[] = [];
                    const numPuddlePoints = 6 + Math.floor(Math.random() * 4);
                    const angleStep = (Math.PI * 2) / numPuddlePoints;
                    const baseRadius = itemSize;
                    for (let j = 0; j < numPuddlePoints; j++) {
                        const randomRadius = baseRadius * (0.8 + Math.random() * 0.4);
                        puddlePoints.push({
                            dx: randomRadius * Math.cos(angleStep * j),
                            dy: randomRadius * Math.sin(angleStep * j) * 0.6, // more elliptical
                        });
                    }
                    newSceneryElements.push({ ...baseSceneryProps, item: 'puddle', points: puddlePoints });
                    break;
                }
                case 'flower': {
                    newSceneryElements.push({
                        ...baseSceneryProps,
                        item: 'flower',
                        flowerType: Math.random() > 0.5 ? 'pink' : 'white'
                    });
                    break;
                }
                case 'rock': {
                    const rockPoints: { dx: number; dy: number }[] = [];
                    const numRockPoints = 5 + Math.floor(Math.random() * 3);
                    const angleStepRock = (Math.PI * 2) / numRockPoints;
                    for (let j = 0; j < numRockPoints; j++) {
                        const angleJitter = (Math.random() - 0.5) * 0.3 * angleStepRock;
                        const finalAngle = angleStepRock * j + angleJitter;
                        const radiusMultiplierX = 0.3 + Math.random() * 0.4;
                        const radiusMultiplierY = 0.3 + Math.random() * 0.4;

                        rockPoints.push({
                            dx: itemSize * radiusMultiplierX * Math.cos(finalAngle),
                            dy: itemSize * radiusMultiplierY * Math.sin(finalAngle) * 0.7,
                        });
                    }
                    newSceneryElements.push({ ...baseSceneryProps, item: 'rock', rockPoints });
                    break;
                }
                default: {
                     break;
                }
            }
        }
    }
    sceneryElementsRef.current = newSceneryElements;
    // --- End of Scenery ---

    projectilesRef.current = [];
    damageNumbersRef.current = [];
    effectsRef.current = [];
    notificationTextsRef.current = [];
    setSelectedEntityForInspection(null);
    setInternalGameState(GameState.PLACEMENT);
    setMessage("Posicione seus heróis!");
    setMainHeroForPortrait(null);
    
    // Pre-render background
    backgroundCanvasRef.current = document.createElement('canvas');
    backgroundCanvasRef.current.width = canvasSize.width;
    backgroundCanvasRef.current.height = canvasSize.height;
    const bgCtx = backgroundCanvasRef.current.getContext('2d');
    if (bgCtx) {
        if (currentBattleBiomeKey === 'FLORESTA') {
            bgCtx.fillStyle = currentBiome.color; // #78B446
            bgCtx.fillRect(0, 0, canvasSize.width, canvasSize.height);
            bgCtx.fillStyle = 'rgba(0,0,0,0.07)';
            for (let i = 0; i < 35; i++) {
                bgCtx.beginPath();
                const patchSize = 80 + Math.random() * 250;
                bgCtx.ellipse(
                    Math.random() * canvasSize.width,
                    Math.random() * canvasSize.height,
                    patchSize,
                    patchSize * (0.5 + Math.random() * 0.5),
                    Math.random() * Math.PI, 0, Math.PI * 2
                );
                bgCtx.fill();
            }
        } else {
            bgCtx.fillStyle = currentBiome.color;
            bgCtx.fillRect(0, 0, canvasSize.width, canvasSize.height);
        }
    }
  }, [playerData, classes, biomes, currentBattleBiomeKey, currentThreatLevel, ALL_CLASSES_DATA, canvasSize, team, opponentTeam, enemies]); 

  useEffect(() => { setupLevel(); }, [setupLevel]); 

    const processUpdateResults = useCallback((updateResults: UpdateResult[]) => {
        const vfxManager = visualEffectsManagerRef.current;
    
        updateResults.forEach(res => {
            if (res.newProjectile) projectilesRef.current.push(res.newProjectile);
            if (res.newDamageNumber) damageNumbersRef.current.push(res.newDamageNumber);
            if (res.newEffect) effectsRef.current.push(res.newEffect);
            if (res.eventToDispatch) eventQueueRef.current.push(res.eventToDispatch);
            if (res.newAreaIndicator) areaIndicatorsRef.current.push(res.newAreaIndicator);
            if (res.newActiveArea) activeAreasRef.current.push(res.newActiveArea);
            
            if (res.newVfx && vfxManager) {
                const handler = vfxHandlers[res.newVfx.type];
                if (handler) {
                    handler(vfxManager, res.newVfx);
                } else {
                    console.warn(`No VFX handler found for type: ${res.newVfx.type}`);
                }
            }
        });
    }, []);

    const triggerAbility = useCallback((entity: CombatCapable, ability: AbilityType) => {
        if (entity.activeDebuffs.some(debuff => debuff.effects.isImmobile)) {
            if (entity.isPlayer) {
                notificationTextsRef.current.push(new NotificationText("Atordoado!", entity.x, entity.y - entity.size, '#FFD700'));
            }
            return;
        }

        if ((entity.abilityCooldowns[ability.id] || 0) > 0) return;

        const allHeroesAndAllies = [...heroesRef.current, ...playerAlliesRef.current];
        const allEnemiesAndAllies = [...enemiesRef.current, ...opponentAlliesRef.current];
        
        // Attempt to use the ability first to see if it's valid (e.g., in range).
        const abilityResults = entity.useAbility(ability, allHeroesAndAllies, allEnemiesAndAllies, dispatcherRef.current);
        
        // If abilityResults is empty for a targeted ability, it means the ability could not be used.
        if (abilityResults.length === 0 && ability.targetType !== 'SELF' && ability.targetType !== 'NONE' && ability.targetType !== 'AOE_AROUND_SELF') {
            if (entity.isPlayer) {
                notificationTextsRef.current.push(new NotificationText("Alvo fora de alcance!", entity.x, entity.y - entity.size, '#ff6347'));
            }
            // Do not set cooldown or dispatch event if the ability failed.
            return; 
        }
        
        // Ability was successful, now dispatch event and set cooldown.
        dispatcherRef.current.dispatchEvent('ABILITY_CAST', { caster: entity, ability });
        entity.abilityCooldowns[ability.id] = ability.cooldownMs;

        processUpdateResults(abilityResults);
    }, [processUpdateResults]);

    const handleActivateAbility = useCallback((abilityId: string) => {
        const mainHero = heroesRef.current.find(h => h.isPlayer);
        if (mainHero && mainHero.isAlive) {
            const ability = mainHero.abilities.find(ab => ab.id === abilityId);
            if (ability) {
                triggerAbility(mainHero, ability);
            }
        }
    }, [triggerAbility]);

    const generateCombatReport = (finalHeroes: HeroEntity[], finalKills: EnemyKillCount): CombatReportData => {
        const report: CombatReportData = { heroStats: {}, enemiesKilled: finalKills };
        initialHeroesRef.current.forEach(initialHero => {
            const finalHeroState = finalHeroes.find(fh => fh.id === initialHero.id) || initialHero;
            report.heroStats[initialHero.combatStats.name] = {
                heroName: initialHero.combatStats.name,
                isDead: !finalHeroState.isAlive,
                damageDealt: finalHeroState.damageDealt,
                healingDone: finalHeroState.healingDone,
                shieldingGranted: finalHeroState.shieldingGranted,
                damageTaken: finalHeroState.damageTaken,
            };
        });
        return report;
    };
    
    const handleDragStart = useCallback((x: number, y: number) => {
        if (internalGameState !== GameState.PLACEMENT) return;
    
        const inspectIconX = selectedEntityForInspection ? selectedEntityForInspection.x : -100;
        const inspectIconY = selectedEntityForInspection ? selectedEntityForInspection.y + INSPECT_ICON_OFFSET_Y : -100;
        if (selectedEntityForInspection && Math.hypot(x - inspectIconX, y - inspectIconY) < INSPECT_ICON_SIZE / 2) {
            setShowInspectionModal(true);
            return;
        }

        const clickedHero = heroesRef.current.find(hero => Math.hypot(x - hero.x, y - hero.y) < hero.size);
        if (clickedHero) {
            draggedHeroRef.current = { hero: clickedHero, originalX: clickedHero.x, originalY: clickedHero.y };
            setSelectedEntityForInspection(clickedHero);
        } else {
            const clickedEntity = [...heroesRef.current, ...enemiesRef.current].find(entity => Math.hypot(x - entity.x, y - entity.y) < entity.size);
            setSelectedEntityForInspection(clickedEntity || null);
        }
    }, [internalGameState, selectedEntityForInspection]);
    
    const handleDragMove = useCallback((x: number, y: number) => {
        if (draggedHeroRef.current) {
            draggedHeroRef.current.hero.x = x;
            draggedHeroRef.current.hero.y = y;
    
            let foundSlot: PlacementSlotType | null = null;
            let minDistance = Infinity;
    
            // Find the CLOSEST valid slot within range
            for (const slot of placementSlotsRef.current) {
                const distance = Math.hypot(x - slot.x, y - slot.y);
                if (distance < GRID_SIZE / 2 && distance < minDistance) {
                    minDistance = distance;
                    foundSlot = slot;
                }
            }
    
            if (foundSlot) {
                const isOccupiedByOther = foundSlot.occupied && (foundSlot.x !== draggedHeroRef.current.originalX || foundSlot.y !== draggedHeroRef.current.originalY);
                let isValidPlacement = !isOccupiedByOther;
                
                if (opponentTeam) { // PvP battle, check for player's half
                    isValidPlacement = isValidPlacement && foundSlot.y > canvasSize.height / 2;
                } else { // PvE battle, check distance to enemies
                    const isTooCloseToEnemy = enemiesRef.current.some(enemy => Math.hypot(foundSlot!.x - enemy.x, foundSlot!.y - enemy.y) <= MIN_PLACEMENT_DIST_TO_ENEMY);
                    isValidPlacement = isValidPlacement && !isTooCloseToEnemy;
                }
                
                highlightedSlotRef.current = { id: foundSlot.id!, valid: isValidPlacement };
            } else {
                highlightedSlotRef.current = null;
            }
        }
    }, [opponentTeam, canvasSize.height]);

    const handleDragEnd = useCallback((x: number, y: number) => {
        const draggedHero = draggedHeroRef.current;
        if (!draggedHero) return;
    
        const moveDistance = Math.hypot(x - draggedHero.originalX, y - draggedHero.originalY);
        // If it was a short drag/click, we keep it selected but don't move unless dropped on a new slot
        if (moveDistance < 5) {
             setSelectedEntityForInspection(draggedHero.hero);
        }
    
        const finalHighlightedSlot = highlightedSlotRef.current;
        const oldSlot = placementSlotsRef.current.find(s => s.x === draggedHero.originalX && s.y === draggedHero.originalY);
    
        if (finalHighlightedSlot && finalHighlightedSlot.valid && oldSlot) {
            const newSlot = placementSlotsRef.current.find(s => s.id === finalHighlightedSlot.id);
            if (newSlot && newSlot.id !== oldSlot.id) {
                // Successfully moved to a new valid slot
                oldSlot.occupied = false;
                newSlot.occupied = true;
                draggedHero.hero.x = newSlot.x;
                draggedHero.hero.y = newSlot.y;
            } else {
                // Dropped back onto the original slot or something went wrong, snap back
                draggedHero.hero.x = draggedHero.originalX;
                draggedHero.hero.y = draggedHero.originalY;
            }
        } else {
            // No valid slot found or old slot couldn't be determined, so snap back
            draggedHero.hero.x = draggedHero.originalX;
            draggedHero.hero.y = draggedHero.originalY;
        }
    
        draggedHeroRef.current = null;
        highlightedSlotRef.current = null;
    }, []);

    const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current!.getBoundingClientRect();
        const x = (event.clientX - rect.left) * (canvasSize.width / rect.width);
        const y = (event.clientY - rect.top) * (canvasSize.height / rect.height);
        handleDragStart(x, y);
    };
    const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current!.getBoundingClientRect();
        const x = (event.clientX - rect.left) * (canvasSize.width / rect.width);
        const y = (event.clientY - rect.top) * (canvasSize.height / rect.height);
        
        if (draggedHeroRef.current) {
            handleDragMove(x, y);
        } else if (internalGameState === GameState.PLACEMENT) {
            let foundSlot = false;
            for (const slot of placementSlotsRef.current) {
                if (!slot.occupied && Math.hypot(x - slot.x, y - slot.y) < GRID_SIZE / 2) {
                    setHoveredSlotId(slot.id || null);
                    foundSlot = true;
                    break;
                }
            }
            if (!foundSlot) {
                setHoveredSlotId(null);
            }
        }
    };
    const handleMouseUp = (event: React.MouseEvent<HTMLCanvasElement>) => {
        if (!draggedHeroRef.current) return;
        const rect = canvasRef.current!.getBoundingClientRect();
        const x = (event.clientX - rect.left) * (canvasSize.width / rect.width);
        const y = (event.clientY - rect.top) * (canvasSize.height / rect.height);
        handleDragEnd(x, y);
    };
    const getTouchCoords = (event: React.TouchEvent<HTMLCanvasElement>): Point => {
        const rect = canvasRef.current!.getBoundingClientRect();
        const touch = event.touches[0] || event.changedTouches[0];
        return { x: (touch.clientX - rect.left) * (canvasSize.width / rect.width), y: (touch.clientY - rect.top) * (canvasSize.height / rect.height) };
    };
    const handleTouchStart = (event: React.TouchEvent<HTMLCanvasElement>) => { const { x, y } = getTouchCoords(event); handleDragStart(x, y); };
    const handleTouchMove = (event: React.TouchEvent<HTMLCanvasElement>) => { if (!draggedHeroRef.current) return; event.preventDefault(); const { x, y } = getTouchCoords(event); handleDragMove(x, y); };
    const handleTouchEnd = (event: React.TouchEvent<HTMLCanvasElement>) => { if (!draggedHeroRef.current) return; const { x, y } = getTouchCoords(event); handleDragEnd(x, y); };
    const handleMouseLeave = () => {
        if (draggedHeroRef.current) {
            handleDragEnd(draggedHeroRef.current.hero.x, draggedHeroRef.current.hero.y);
        }
        setHoveredSlotId(null);
        highlightedSlotRef.current = null;
    }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle hotkeys during the BATTLE state
      if (internalGameState !== GameState.BATTLE) return;

      const hotkeyIndex = ['1', '2', '3', '4'].indexOf(event.key);

      if (hotkeyIndex !== -1) {
        // Prevent default browser behavior for number keys (e.g., searching)
        event.preventDefault();
        
        const abilityToActivate = mainHeroAbilities[hotkeyIndex];
        if (abilityToActivate) {
          handleActivateAbility(abilityToActivate.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [internalGameState, mainHeroAbilities, handleActivateAbility]);
  
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    const pixiApp = pixiAppRef.current;
    if (!ctx || !pixiApp) return;

    const gameLoop = (time: number) => {
        if (lastFrameTimeRef.current === 0) {
            lastFrameTimeRef.current = time;
            animationFrameId.current = requestAnimationFrame(gameLoop);
            return;
        }
        const deltaTime = time - lastFrameTimeRef.current;
        lastFrameTimeRef.current = time;

        ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
        if (backgroundCanvasRef.current) {
            ctx.drawImage(backgroundCanvasRef.current, 0, 0);
        } else {
            ctx.fillStyle = currentBiome.color;
            ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
        }

        if (currentBattleBiomeKey === 'FLORESTA') {
            ctx.strokeStyle = 'rgba(173, 216, 230, 0.5)';
            ctx.lineWidth = 1.5;
            rainParticlesRef.current.forEach(p => {
                p.y += p.speed;
                p.x += p.speed * 0.2; 
                if (p.y > canvasSize.height) {
                    p.y = -p.length;
                    p.x = Math.random() * canvasSize.width * 1.2 - canvasSize.width * 0.1;
                }
                ctx.globalAlpha = p.opacity;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x - p.length * 0.2, p.y + p.length);
                ctx.stroke();
                ctx.globalAlpha = 1.0;
            });
        }
        
        sceneryElementsRef.current.forEach(scenery => {
            switch(scenery.item) {
                case 'tree':
                    drawTree(ctx, scenery as TreeSceneryElement);
                    break;
                case 'rock':
                    drawRock(ctx, scenery as RockSceneryElement);
                    break;
                case 'river':
                    drawRiver(ctx, scenery as RiverSceneryElement);
                    break;
                case 'pine_tree':
                    drawPineTree(ctx, scenery as PineTreeSceneryElement);
                    break;
                case 'puddle':
                    drawPuddle(ctx, scenery as PuddleSceneryElement);
                    break;
                case 'flower':
                    drawFlower(ctx, scenery as FlowerSceneryElement);
                    break;
            }
        });

        const allHeroes = [...heroesRef.current, ...playerAlliesRef.current];
        const allEnemies = [...enemiesRef.current, ...opponentAlliesRef.current];
        const allCombatants = [...allHeroes, ...allEnemies];

        if (internalGameState === GameState.BATTLE && !hasEndedLevel.current) {
            const newEffects: DeathEffect[] = [];
            const newDamageNumbers: DamageNumber[] = [];
            
            const now = Date.now();
            
            if (now - lastStatsUpdateTimeRef.current > 250) { // Update stats 4 times per second
                lastStatsUpdateTimeRef.current = now;
                const elapsedSeconds = Math.max(0.1, (now - battleStartTimeRef.current) / 1000);

                const summonStatsMap = new Map<number, { damageDealt: number; healingDone: number; shieldingGranted: number; damageTaken: number; }>();
                playerAlliesRef.current.forEach(ally => {
                    const masterId = (ally as any).master?.id;
                    if (masterId) {
                        if (!summonStatsMap.has(masterId)) {
                            summonStatsMap.set(masterId, { damageDealt: 0, healingDone: 0, shieldingGranted: 0, damageTaken: 0 });
                        }
                        const currentStats = summonStatsMap.get(masterId)!;
                        currentStats.damageDealt += ally.damageDealt;
                        currentStats.healingDone += ally.healingDone;
                        currentStats.shieldingGranted += ally.shieldingGranted;
                        currentStats.damageTaken += ally.damageTaken;
                    }
                });
                
                const newStatsData: RealTimeStat[] = heroesRef.current
                    .filter(entity => entity.isAlive || entity.damageDealt > 0 || entity.healingDone > 0)
                    .map(entity => {
                        const classDetails = (entity as HeroEntity).classDetails;
                        const icon = classDetails?.abilities[0]?.icon || '❓';
                        const color = entity.combatStats.color || '#FFFFFF';

                        const aggregatedSummonStats = summonStatsMap.get(entity.id) || { damageDealt: 0, healingDone: 0, shieldingGranted: 0, damageTaken: 0 };
                        
                        const totalDamageDealt = entity.damageDealt + aggregatedSummonStats.damageDealt;
                        const totalHealingDone = entity.healingDone + aggregatedSummonStats.healingDone;
                        const totalShieldingGranted = entity.shieldingGranted + aggregatedSummonStats.shieldingGranted;
                        const totalDamageTaken = entity.damageTaken + aggregatedSummonStats.damageTaken;

                        return {
                            id: entity.id,
                            name: entity.combatStats.name,
                            icon: icon,
                            color: color,
                            currentHp: entity.currentHp,
                            maxHp: entity.maxHp,
                            shieldHp: entity.shieldHp,
                            damageDealt: totalDamageDealt,
                            healingDone: totalHealingDone,
                            shieldingGranted: totalShieldingGranted,
                            damageTaken: totalDamageTaken,
                            dps: totalDamageDealt / elapsedSeconds,
                            hps: totalHealingDone / elapsedSeconds,
                            combatStats: entity.combatStats,
                        };
                    });
                
                setRealTimeStatsData(newStatsData);
            }
            
            const completedDelayedActions = delayedActionsRef.current.filter(action => now >= action.executeAt);
            delayedActionsRef.current = delayedActionsRef.current.filter(action => now < action.executeAt);

            completedDelayedActions.forEach(action => {
                const actionResults = action.action();
                processUpdateResults(actionResults);
            });

            activeAreasRef.current = activeAreasRef.current.filter(area => {
                area.remainingMs -= deltaTime;
                return area.remainingMs > 0;
            });
    
            activeAreasRef.current.forEach(area => {
                if (area.debuffTemplate && area.damageProperties) {
                    if (!area.lastDamageTickTime || now - area.lastDamageTickTime >= area.damageProperties.tickIntervalMs) {
                        area.lastDamageTickTime = now;
                        const targetsInArea = allHeroes.filter(h => h.isAlive && distanceToTarget(h, area) <= area.radius);
                        targetsInArea.forEach(target => {
                            const debuffTemplate = area.debuffTemplate;
                            const dotTemplate = debuffTemplate.effects.dot;
                            const damagePerTick = target.maxHp * (dotTemplate.damagePercentOfTargetMaxHp / 100);
                            const debuffInstance: ActiveBuffDebuff = {
                                id: `${debuffTemplate.id}_${target.id}`,
                                abilityId: debuffTemplate.id,
                                name: debuffTemplate.name,
                                icon: debuffTemplate.icon,
                                durationMs: debuffTemplate.durationMs,
                                remainingMs: debuffTemplate.durationMs,
                                appliedAt: now,
                                isBuff: false,
                                sourceEntityId: area.casterId,
                                targetEntityId: target.id,
                                effects: {
                                    resistenciaPercent: debuffTemplate.effects.resistenciaPercent,
                                    dot: {
                                        tickIntervalMs: dotTemplate.tickIntervalMs,
                                        damagePerTick: Math.max(1, Math.round(damagePerTick)),
                                        sourceCasterId: area.casterId,
                                    },
                                },
                            };
                            target.applyDebuff(debuffInstance);
                        });
                    }
                }
            });


            allCombatants.forEach(entity => {
                const { results, abilityToTrigger } = entity.update(deltaTime, allHeroes, allEnemies, canvasSize);
                
                processUpdateResults(results);

                if (abilityToTrigger) {
                    const ability = entity.abilities.find(a => a.id === abilityToTrigger);
                    if (ability) {
                        triggerAbility(entity, ability);
                    }
                }
            });

            // Collect new effects and numbers from projectiles
            projectilesRef.current = projectilesRef.current.filter(p => {
                let potentialTargets: CombatCapable[];
                const attackerChar = p.attacker as Character;
                if (attackerChar instanceof HeroEntity && attackerChar.isOpponent) {
                    potentialTargets = allHeroes;
                } else if (attackerChar._entityType === 'hero' || attackerChar._entityType === 'ally') {
                    potentialTargets = allEnemies;
                } else { // 'enemy'
                    potentialTargets = allHeroes;
                }
            
                const updateResults = p.update(deltaTime, potentialTargets, visualEffectsManagerRef.current);
                if (updateResults.newDamageNumbers) newDamageNumbers.push(...updateResults.newDamageNumbers);
                if (updateResults.newEffects) newEffects.push(...updateResults.newEffects);
                if (updateResults.eventsToDispatch) eventQueueRef.current.push(...updateResults.eventsToDispatch);
                return p.lifetimeMs > 0;
            });

            // De-overlap ALL new damage numbers for this frame
            if (newDamageNumbers.length > 0) {
                const numbersToAvoid = [...damageNumbersRef.current.filter(dn => dn.life > 40 && dn.delayFrames === 0)];
                let collisionCountForThisFrame = 0;
                
                newDamageNumbers.forEach(newDn => {
                    let yOffset = 0;
                    let attempts = 0;
                    let collision = true;
                    
                    while (collision && attempts < 10) {
                        collision = false;
                        const checkY = newDn.y + yOffset;
            
                        for (const existingDn of numbersToAvoid) {
                            const distance = Math.hypot(newDn.x - existingDn.x, checkY - existingDn.y);
                            if (distance < 20) {
                                collision = true;
                                yOffset -= 20;
                                break;
                            }
                        }
                        attempts++;
                    }
                    
                    if (yOffset < 0) {
                        collisionCountForThisFrame++;
                        newDn.delayFrames = Math.min(18, collisionCountForThisFrame * 5); 
                    }
    
                    newDn.y += yOffset;
                    numbersToAvoid.push(newDn);
                });
            }

            // Now push all new items to their respective refs
            effectsRef.current.push(...newEffects);
            damageNumbersRef.current.push(...newDamageNumbers);

            // Update and filter effects, damage numbers, notifications
            effectsRef.current = effectsRef.current.filter(e => e.update());
            damageNumbersRef.current = damageNumbersRef.current.filter(d => d.update());
            notificationTextsRef.current = notificationTextsRef.current.filter(n => n.update());
            
            if (internalGameState === GameState.BATTLE && currentBattleBiomeKey === 'TREINO') {
                enemiesRef.current.forEach(enemy => {
                    if (!enemy.isAlive && !(enemy as EnemyEntity).isReviving) {
                        (enemy as EnemyEntity).isReviving = true;
            
                        dispatcherRef.current.addDelayedAction(2000, () => {
                             if (enemy && internalGameState === GameState.BATTLE) {
                                    enemy.currentHp = enemy.maxHp;
                                    enemy.isAlive = true;
                                    enemy.deathEffectCreated = false;
                                    (enemy as EnemyEntity).isReviving = false;
                                    if(visualEffectsManagerRef.current) {
                                        vfx.showSummoningEffect(visualEffectsManagerRef.current, enemy.x, enemy.y);
                                    }
                                }
                                return [];
                        });
                    }
                });
            }

            // NEW: Process Event Queue
            const eventsToProcess = [...eventQueueRef.current];
            eventQueueRef.current = []; // Clear queue for next frame
            eventsToProcess.forEach(event => {
                if (event.type === 'NOTIFICATION_TEXT') {
                    const { text, x, y, color } = event.payload;
                    notificationTextsRef.current.push(new NotificationText(text, x, y, color));
                }
                // Special case for SUMMON, as it modifies the list we iterate over
                if (event.type === 'SUMMON_PERFORMED') {
                    const summon = event.payload.summon as (SkeletonAlly | LivingTreeAlly);
                    if (summon) {
                        if ((summon.master as HeroEntity).isOpponent) {
                            opponentAlliesRef.current.push(summon);
                        } else {
                            playerAlliesRef.current.push(summon);
                        }
                        allCombatants.push(summon); // Add to current frame's combatants list
                        if(visualEffectsManagerRef.current) {
                           vfx.showSummoningEffect(visualEffectsManagerRef.current, summon.x, summon.y);
                        }
                    }
                }

                allCombatants.forEach(combatant => {
                    if (combatant.isAlive || event.type === 'ENTITY_DIED') { // Let dead entities react to their own death
                       const eventResults = combatant.handleEvent(event, dispatcherRef.current, allHeroes, allEnemies);
                       processUpdateResults(eventResults);
                    }
                });
            });

            const isPlayerTeamWiped = allHeroes.every(h => !h.isAlive);
            let areEnemiesWiped = allEnemies.every(e => !e.isAlive);
            if (currentBattleBiomeKey === 'TREINO') {
                areEnemiesWiped = false; // In training, enemies revive, so this condition shouldn't automatically end the game.
            }

            if (!hasEndedLevel.current) {
                if (isPlayerTeamWiped) {
                    hasEndedLevel.current = true;
                    const report = generateCombatReport(heroesRef.current, killedEnemiesRef.current);
                    onGameEnd(false, currentBattleBiomeKey, (currentThreatLevel % 10 === 0), report);
                } else if (areEnemiesWiped) {
                    hasEndedLevel.current = true;
                    enemiesRef.current.forEach(enemy => {
                        if (!(enemy as EnemyEntity).isCountedAsKilled) {
                            killedEnemiesRef.current[enemy.combatStats.name] = {
                                emoji: (enemy as EnemyEntity).emoji,
                                count: (killedEnemiesRef.current[enemy.combatStats.name]?.count || 0) + 1
                            };
                            (enemy as EnemyEntity).isCountedAsKilled = true;
                        }
                    });
                    const report = generateCombatReport(heroesRef.current, killedEnemiesRef.current);
                    onGameEnd(true, currentBattleBiomeKey, (currentThreatLevel % 10 === 0), report);
                }
            }
             const mainHero = heroesRef.current.find(h => h.isPlayer);
             setMainHeroAbilityCooldowns({ ...mainHero?.abilityCooldowns || {} });
             if (mainHero) setMainHeroForPortrait(mainHero);

        }

        areaIndicatorsRef.current = areaIndicatorsRef.current.filter(indicator => {
            indicator.remainingMs -= deltaTime;
            return indicator.remainingMs > 0;
        });
        areaIndicatorsRef.current.forEach(indicator => {
            ctx.save();
            const progress = 1 - (indicator.remainingMs / indicator.initialMs);
            const currentRadius = indicator.radius * progress;
            ctx.strokeStyle = `rgba(255, 0, 0, ${0.3 + progress * 0.7})`;
            ctx.lineWidth = 3 + progress * 4;
            ctx.beginPath();
            ctx.arc(indicator.x, indicator.y, currentRadius, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.strokeStyle = `rgba(255, 100, 100, 0.8)`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(indicator.x, indicator.y, indicator.radius, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.restore();
        });

        if (internalGameState === GameState.PLACEMENT) {
            if (opponentTeam) { // In PvP, draw dividing line
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(0, canvasSize.height / 2);
                ctx.lineTo(canvasSize.width, canvasSize.height / 2);
                ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)'; // Accent color with transparency
                ctx.lineWidth = 2;
                ctx.setLineDash([10, 5]);
                ctx.stroke();
                ctx.restore();
            }

            let slotsToDraw = placementSlotsRef.current;
            if (opponentTeam) { // In PvP, only show player's slots
                slotsToDraw = slotsToDraw.filter(slot => slot.y > canvasSize.height / 2);
            }
            
            // Draw placeholder slots first
            slotsToDraw.forEach(slot => {
                const currentHighlightedSlot = highlightedSlotRef.current;
                // Skip drawing the placeholder if this slot is the one currently highlighted by the drag
                if (currentHighlightedSlot?.id === slot.id) {
                    return;
                }

                const isOriginalSlotOfDraggedHero = draggedHeroRef.current && slot.x === draggedHeroRef.current.originalX && slot.y === draggedHeroRef.current.originalY;
        
                if (slot.occupied && !isOriginalSlotOfDraggedHero) {
                    return; // Skip drawing for other occupied slots
                }
        
                const isHovered = !draggedHeroRef.current && hoveredSlotId === slot.id;
                const squareSize = GRID_SIZE * 0.75;
                const squareX = slot.x - squareSize / 2;
                const squareY = slot.y - squareSize / 2;
                
                ctx.globalAlpha = isHovered ? 0.6 : 0.3;
                ctx.fillStyle = isHovered ? '#FFD700' : '#A09CC9';
                drawRoundedRect(ctx, squareX, squareY, squareSize, squareSize, 5);
                ctx.fill();
        
                ctx.strokeStyle = isHovered ? '#FFD700' : '#A09CC9';
                ctx.lineWidth = 2;
                ctx.globalAlpha = isHovered ? 0.9 : 0.5;
                ctx.stroke();
                ctx.globalAlpha = 1.0;
            });

            // Then, draw the highlighted slot on top so it's always visible
            const currentHighlightedSlot = highlightedSlotRef.current;
            if (currentHighlightedSlot) {
                const slot = placementSlotsRef.current.find(s => s.id === currentHighlightedSlot.id);
                if (slot) {
                    const squareSize = GRID_SIZE * 0.75;
                    const squareX = slot.x - squareSize / 2;
                    const squareY = slot.y - squareSize / 2;
                    const color = currentHighlightedSlot.valid ? 'rgba(46, 230, 208, 0.6)' : 'rgba(229, 62, 62, 0.6)';
                    const borderColor = currentHighlightedSlot.valid ? '#2EE6D0' : '#E53E3E';
                    
                    ctx.globalAlpha = 1.0;
                    ctx.fillStyle = color;
                    drawRoundedRect(ctx, squareX, squareY, squareSize, squareSize, 5);
                    ctx.fill();
                    ctx.strokeStyle = borderColor;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            }
        }
        
        // Draw selection circle
        if (selectedEntityForInspection && internalGameState === GameState.PLACEMENT) {
            ctx.save();
            ctx.strokeStyle = '#FFD700'; // Accent color for selection
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.arc(selectedEntityForInspection.x, selectedEntityForInspection.y, selectedEntityForInspection.size * 0.7, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        const entitiesToDraw = [...allCombatants, ...projectilesRef.current, ...effectsRef.current];
        entitiesToDraw.sort((a, b) => a.y - b.y);

        entitiesToDraw.forEach(entity => {
            const isDragged = draggedHeroRef.current?.hero.id === entity.id;
            entity.draw(ctx, false, isDragged);
        });
        
        // Draw inspect icon
        if (selectedEntityForInspection && internalGameState === GameState.PLACEMENT) {
            ctx.save();
            const iconX = selectedEntityForInspection.x;
            const iconY = selectedEntityForInspection.y + INSPECT_ICON_OFFSET_Y;
            const pulse = 1 + Math.sin(Date.now() * 0.005) * 0.1;
            const size = INSPECT_ICON_SIZE * pulse;
            ctx.globalAlpha = 0.95;
            ctx.fillStyle = 'rgba(48, 43, 75, 0.8)'; // brand-background
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(iconX, iconY, size / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.font = `${size * 0.55}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'white';
            ctx.fillText('🔍', iconX, iconY);
            ctx.restore();
        }

        // Draw UI elements like damage numbers on top of game entities
        damageNumbersRef.current.forEach(dn => dn.draw(ctx));
        notificationTextsRef.current.forEach(nt => nt.draw(ctx));

        const boss = enemiesRef.current.find(e => e.isBoss);
        if (boss && boss.isAlive) {
            const barWidth = canvasSize.width * 0.6;
            const barHeight = 25;
            const barX = (canvasSize.width - barWidth) / 2;
            const barY = 20;
        
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            drawRoundedRect(ctx, barX, barY, barWidth, barHeight, 8);
            ctx.fill();
        
            const healthPercentage = boss.currentHp / boss.maxHp;
            ctx.fillStyle = '#D22B2B'; // Enemy red
            drawRoundedRect(ctx, barX, barY, barWidth * healthPercentage, barHeight, 8);
            ctx.fill();
            
            if (boss.shieldHp > 0) {
                const shieldPercentage = boss.shieldHp / boss.maxHp;
                ctx.fillStyle = 'rgba(173, 216, 230, 0.85)'; // Light blue
                drawRoundedRect(ctx, barX, barY, barWidth * shieldPercentage, barHeight, 8);
                ctx.fill();
            }
        
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            drawRoundedRect(ctx, barX, barY, barWidth, barHeight, 8);
            ctx.stroke();
        
            ctx.font = 'bold 16px Fredoka';
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 4;
            const bossText = `${boss.combatStats.name} - ${Math.ceil(boss.currentHp)} / ${boss.maxHp}`;
            ctx.fillText(bossText, canvasSize.width / 2, barY + barHeight / 2);
            ctx.shadowBlur = 0;
        }

        visualEffectsManagerRef.current?.update(deltaTime);
        pixiApp.render();
        
        animationFrameId.current = requestAnimationFrame(gameLoop);
    };

    animationFrameId.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = undefined;
      }
       lastFrameTimeRef.current = 0;
    };
  }, [internalGameState, canvasSize, currentBiome, handleActivateAbility, hoveredSlotId, dispatchEvent, triggerAbility, processUpdateResults, selectedEntityForInspection, onGameEnd, currentBattleBiomeKey, currentThreatLevel, opponentTeam]);
  
  const getModalData = (): { heroClass: ClassData, baseStats: BaseStats, equippedItems: EquippedItems | undefined } | null => {
    if (!selectedEntityForInspection) return null;

    if (selectedEntityForInspection instanceof HeroEntity) {
        return {
            heroClass: selectedEntityForInspection.classDetails!,
            baseStats: selectedEntityForInspection['playerBaseStats'],
            equippedItems: selectedEntityForInspection.equippedItems
        }
    }
    if (selectedEntityForInspection instanceof EnemyEntity) {
        // Find class data by name for enemies that might be based on a class (none for now) or create a dummy one.
        const enemyClassData = Object.values(ALL_CLASSES_DATA).find(c => c.name === selectedEntityForInspection.combatStats.name) || {
            name: selectedEntityForInspection.combatStats.name,
            color: '#D22B2B', bodyColor: '#8B0000', weapon: 'unarmed',
            hp: selectedEntityForInspection.combatStats.maxHp,
            damage: selectedEntityForInspection.combatStats.effectiveDamage,
            range: selectedEntityForInspection.combatStats.range,
            attackSpeed: selectedEntityForInspection.combatStats.attackIntervalMs,
            velocidadeMovimento: selectedEntityForInspection.combatStats.velocidadeMovimento,
            abilities: selectedEntityForInspection.abilities
        };
        return {
            heroClass: enemyClassData,
            baseStats: { ...DEFAULT_PLAYER_DATA.baseStats, ...selectedEntityForInspection.combatStats },
            equippedItems: undefined,
        }
    }
    return null;
}

const modalData = getModalData();


  return (
    <div className="relative w-full h-full font-fredoka">
      {showInspectionModal && modalData && (
        <PreBattleHeroDetailsModal
          heroClass={modalData.heroClass}
          baseStats={modalData.baseStats}
          equippedItems={modalData.equippedItems}
          threatLevel={currentThreatLevel}
          onClose={() => setShowInspectionModal(false)}
          classes={classes}
          enemyTemplate={(selectedEntityForInspection instanceof EnemyEntity) ? selectedEntityForInspection['enemyDetails'] : undefined}
        />
      )}
      {/* The main canvas for mouse events and core drawing */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0"
        width={canvasSize.width}
        height={canvasSize.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
      {/* The Pixi canvas for VFX, no pointer events */}
      <canvas
        ref={pixiCanvasRef}
        className="absolute inset-0 z-10 pointer-events-none"
        width={canvasSize.width}
        height={canvasSize.height}
      />
      
      {/* UI Overlays container */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        
        {message && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-70 text-white text-2xl font-bold p-4 rounded-xl shadow-lg">
            {message}
          </div>
        )}

        {internalGameState === GameState.PLACEMENT && (
          <>
            <button
                onClick={onReturnToMenu}
                className="pointer-events-auto absolute top-4 left-4 py-2 px-5 rounded-lg border-2 border-border-game bg-brand-card text-text-light cursor-pointer shadow-md active:translate-y-1 hover:bg-brand-surface transition-all duration-100 ease-in-out text-lg z-30"
            >
                Voltar
            </button>
            <button
                onClick={() => {
                    setInternalGameState(GameState.BATTLE);
                    setMessage(null);
                    setSelectedEntityForInspection(null);
                    battleStartTimeRef.current = Date.now();
                    lastStatsUpdateTimeRef.current = 0;
                }}
                className="pointer-events-auto absolute top-4 left-1/2 -translate-x-1/2 py-3 px-8 rounded-lg border-2 border-border-game bg-accent text-accent-text cursor-pointer shadow-button-default active:translate-y-1 active:shadow-button-active hover:bg-accent-hover transition-all duration-100 ease-in-out text-xl z-30"
            >
                Iniciar Batalha
            </button>
          </>
        )}
        
        {mainHeroForPortrait && (
            <HeroPortrait heroData={mainHeroForPortrait} />
        )}
        
        <AbilityBar
            heroAbilities={mainHeroAbilities}
            abilityCooldowns={mainHeroAbilityCooldowns}
            onActivateAbility={handleActivateAbility}
            isSpectator={!mainHeroForPortrait?.isAlive}
        />

        {internalGameState === GameState.BATTLE && currentBattleBiomeKey === 'TREINO' && (
            <button
                onClick={() => {
                    if (hasEndedLevel.current) return;
                    hasEndedLevel.current = true;
                    const report = generateCombatReport(heroesRef.current, killedEnemiesRef.current);
                    onGameEnd(true, currentBattleBiomeKey, false, report);
                }}
                className="pointer-events-auto absolute top-4 right-4 py-2 px-5 rounded-lg border-2 border-border-game bg-button-danger-bg text-white cursor-pointer shadow-md active:translate-y-1 hover:bg-button-danger-hover-bg transition-all duration-100 ease-in-out text-lg z-30"
                >
                Encerrar Treino
            </button>
        )}

        {internalGameState === GameState.BATTLE && (
            <button
                onClick={() => setShowRealTimeStats(s => !s)}
                className="pointer-events-auto absolute top-4 right-4 py-2 px-3 rounded-full border-2 border-border-game bg-brand-card text-text-light cursor-pointer shadow-md active:translate-y-1 hover:bg-brand-surface transition-all duration-100 ease-in-out text-2xl z-30"
                aria-label="Mostrar/Ocultar Estatísticas em Tempo Real"
            >
                📊
            </button>
        )}

        {showRealTimeStats && (
            <RealTimeStatsPanel
                stats={realTimeStatsData}
                onClose={() => setShowRealTimeStats(false)}
            />
        )}
      </div>
    </div>
  );
};

export default GameContainer;