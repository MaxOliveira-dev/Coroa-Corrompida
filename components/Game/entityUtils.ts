





import type { BaseStats, ClassData, EnemyTemplate, CombatStats, Item as ItemType, EquippedItems, ActiveBuffDebuff, ActiveBuffDebuffEffect, Point, ClassDataMap } from '../../types';
import type { CombatCapable } from './entityInterfaces';
import { ITEM_SCALING_FACTOR_PER_THREAT_LEVEL, ENEMY_STAT_SCALING_PER_THREAT_LEVEL, DROPPABLE_WEAPONS, PLAYER_DATA } from '../../gameData';

export let entityIdCounter = 0;
export const getEntityId = () => entityIdCounter++;
export const resetEntityIdCounter = () => { entityIdCounter = 0; };

const defaultBaseStatsTemplate: BaseStats = { ...PLAYER_DATA.baseStats };

// --- Internal Helper Functions for Stat Calculation ---

function _applyItemBonuses(
    baseStats: BaseStats, 
    equippedItems: EquippedItems, 
    threatLevel: number
): void {
    const percentageStats: (keyof BaseStats)[] = [
        'velocidadeAtaque',
        'chanceCritica',
        'danoCritico',
        'chanceEsquiva',
        'chanceDeAcerto',
        'vampirismo',
        'curaRecebidaBonus',
        'resistencia'
    ];

    Object.values(equippedItems).forEach(item => {
        if (item && item.statBonuses) {
            for (const [statKey, baseBonusValue] of Object.entries(item.statBonuses)) {
                const key = statKey as keyof BaseStats;
                
                let totalBonusFromItemStat: number;
                
                if (percentageStats.includes(key)) {
                    // Don't apply scaling for percentage-based stats
                    totalBonusFromItemStat = baseBonusValue as number;
                } else {
                    // Apply scaling for flat stats
                    const scalingFactor = 1 + (ITEM_SCALING_FACTOR_PER_THREAT_LEVEL * threatLevel);
                    totalBonusFromItemStat = (baseBonusValue as number) * scalingFactor;
                }
                
                baseStats[key] = (baseStats[key] || 0) + totalBonusFromItemStat;
            }
        }
    });
}

function _applyEnemyScaling(
    baseStats: BaseStats, 
    enemyDetails: EnemyTemplate, 
    threatLevel: number
): void {
    const scalingMultiplier = 1 + (ENEMY_STAT_SCALING_PER_THREAT_LEVEL * (threatLevel - 1));
    const enemyBaseTemplate = { ...defaultBaseStatsTemplate, ...enemyDetails.baseStats };

    (Object.keys(enemyBaseTemplate) as Array<keyof BaseStats>).forEach(key => {
        const statValue = enemyBaseTemplate[key];
        if (typeof statValue === 'number') {
            // Per request, only 'letalidade' and 'vigor' should scale with threat level.
            // All other stats, including percentage-based ones, should remain static.
            if (key === 'letalidade' || key === 'vigor') {
                baseStats[key] = statValue * scalingMultiplier;
            } else {
                baseStats[key] = statValue;
            }
        }
    });
    // Cap resistance
    if (baseStats.resistencia !== undefined) {
      baseStats.resistencia = Math.min(20, baseStats.resistencia);
    }
}

function _applyBuffsAndDebuffs(
    calculatedStats: Partial<CombatStats>, 
    allBuffsAndDebuffs: ActiveBuffDebuff[]
): { rangePercentBonus: number; attackIntervalOverride?: number } {
    const accumulatedPercentages: { [key in keyof BaseStats]?: number } = {};
    let rangePercentBonus = 0;
    let attackIntervalOverride: number | undefined = undefined;

    allBuffsAndDebuffs.forEach(bd => {
        const effect = bd.effects;
        const stacks = bd.stacks || 1;

        if (effect.letalidadePercent) accumulatedPercentages.letalidade = (accumulatedPercentages.letalidade || 0) + (effect.letalidadePercent * stacks);
        if (effect.vigorPercent) accumulatedPercentages.vigor = (accumulatedPercentages.vigor || 0) + (effect.vigorPercent * stacks);
        if (effect.resistenciaPercent) accumulatedPercentages.resistencia = (accumulatedPercentages.resistencia || 0) + (effect.resistenciaPercent * stacks);
        if (effect.velocidadeAtaquePercent) calculatedStats.velocidadeAtaque = (calculatedStats.velocidadeAtaque || 0) + (effect.velocidadeAtaquePercent * stacks);
        if (effect.velocidadeMovimentoPercent) accumulatedPercentages.velocidadeMovimento = (accumulatedPercentages.velocidadeMovimento || 0) + (effect.velocidadeMovimentoPercent * stacks);
        if (effect.chanceCriticaPercent) calculatedStats.chanceCritica = (calculatedStats.chanceCritica || 0) + (effect.chanceCriticaPercent * stacks);
        if (effect.danoCriticoPercent) calculatedStats.danoCritico = (calculatedStats.danoCritico || 0) + (effect.danoCriticoPercent * stacks);
        if (effect.chanceEsquivaPercent) calculatedStats.chanceEsquiva = (calculatedStats.chanceEsquiva || 0) + (effect.chanceEsquivaPercent * stacks);
        if (effect.chanceDeAcertoPercent) calculatedStats.chanceDeAcerto = (calculatedStats.chanceDeAcerto || 0) + (effect.chanceDeAcertoPercent * stacks);
        if (effect.curaRecebidaBonusPercent) calculatedStats.curaRecebidaBonus = (calculatedStats.curaRecebidaBonus || 0) + (effect.curaRecebidaBonusPercent * stacks);
        if (effect.poderDeCuraPercent) accumulatedPercentages.poderDeCura = (accumulatedPercentages.poderDeCura || 0) + (effect.poderDeCuraPercent * stacks);
        if (effect.rangePercent) rangePercentBonus += (effect.rangePercent * stacks);

        if (effect.letalidadeFlat) calculatedStats.letalidade = (calculatedStats.letalidade || 0) + (effect.letalidadeFlat * stacks);
        if (effect.vigorFlat) calculatedStats.vigor = (calculatedStats.vigor || 0) + (effect.vigorFlat * stacks);
        if (effect.resistenciaFlat) calculatedStats.resistencia = (calculatedStats.resistencia || 0) + (effect.resistenciaFlat * stacks);
        if (effect.chanceDeAcertoFlat) calculatedStats.chanceDeAcerto = (calculatedStats.chanceDeAcerto || 0) + (effect.chanceDeAcertoFlat * stacks);
        if (effect.resistanceReductionPercent) calculatedStats.resistencia = (calculatedStats.resistencia || 0) - (effect.resistanceReductionPercent * stacks);

        if (effect.overrideAttackIntervalMs) {
            attackIntervalOverride = effect.overrideAttackIntervalMs;
        }
    });

    for (const key in accumulatedPercentages) {
        const statKey = key as keyof BaseStats;
        if (calculatedStats[statKey] !== undefined) {
            (calculatedStats[statKey] as number) *= (1 + (accumulatedPercentages[statKey]! || 0) / 100);
        }
    }

    return { rangePercentBonus, attackIntervalOverride };
}


export const calculateFinalStatsForEntity = (
    sourcePlayerBaseStats: BaseStats, 
    classDetails?: ClassData, 
    enemyDetails?: EnemyTemplate, 
    playerLevelScale: number = 1,
    equippedItems?: EquippedItems,
    activeBuffs: ActiveBuffDebuff[] = [],
    activeDebuffs: ActiveBuffDebuff[] = [],
    threatLevel: number = 1
): CombatStats & { currentHp: number, name: string, weaponRepresentation?: string, emoji?: string } => {

    let finalBaseStats: BaseStats = { ...defaultBaseStatsTemplate };
    
    // 1. Establish base stats from source (hero or enemy) and apply scaling/items
    if (classDetails) { // It's a hero
        finalBaseStats = { ...sourcePlayerBaseStats }; 
        if (equippedItems) {
            _applyItemBonuses(finalBaseStats, equippedItems, threatLevel);
        }
        // Cap resistance from items/base stats at 100 (50% DR).
        if (finalBaseStats.resistencia !== undefined) {
            finalBaseStats.resistencia = Math.min(100, finalBaseStats.resistencia);
        }
    } else if (enemyDetails) { // It's an enemy
        _applyEnemyScaling(finalBaseStats, enemyDetails, threatLevel);
    }

    let calculatedStats: Partial<CombatStats> = { ...finalBaseStats };

    // 2. Apply buffs and debuffs
    const allBuffsAndDebuffs = [...activeBuffs, ...activeDebuffs];
    const { rangePercentBonus, attackIntervalOverride } = _applyBuffsAndDebuffs(calculatedStats, allBuffsAndDebuffs);
    
    // Clamp final resistance
    if (calculatedStats.resistencia !== undefined) {
        if (enemyDetails) {
            calculatedStats.resistencia = Math.min(20, calculatedStats.resistencia);
        } else { // It's a hero
            // Cap final resistance with buffs at 400 (80% DR).
            calculatedStats.resistencia = Math.min(400, calculatedStats.resistencia);
        }
        calculatedStats.resistencia = Math.max(-99, calculatedStats.resistencia);
    }
    
    // 3. Calculate derived stats (HP, Damage, Attack Interval)
    let finalMaxHp = 0;
    let effectiveDamageCalc = 0;
    let finalAttackIntervalMs = 1500;
    let name = "Unknown";
    let color: string | undefined;
    let bodyColor: string | undefined;
    let weaponRepresentation: string | undefined;
    let range = 0;
    let finalVelocidadeMovimento = 1.0;
    let size = 20;
    let isBoss = false;
    let emoji: string | undefined;

    if (classDetails) { 
        name = classDetails.name;
        color = classDetails.color;
        bodyColor = classDetails.bodyColor;
        weaponRepresentation = classDetails.weapon;
        range = classDetails.range;
        finalVelocidadeMovimento = classDetails.velocidadeMovimento * (1 + ((calculatedStats.velocidadeMovimento || 0) - classDetails.velocidadeMovimento) / classDetails.velocidadeMovimento);
        
        finalMaxHp = Math.floor((calculatedStats.vigor || 0) * 100 + (classDetails.hp || 0));
        effectiveDamageCalc = Math.floor((calculatedStats.letalidade || 0) * 1.25 + (classDetails.damage || 0));
        
        finalAttackIntervalMs = classDetails.attackSpeed || 1500;
        if (calculatedStats.velocidadeAtaque && calculatedStats.velocidadeAtaque !== 0) { 
            finalAttackIntervalMs = Math.round(finalAttackIntervalMs / (1 + (calculatedStats.velocidadeAtaque / 100)));
        }
        size = classDetails.name === 'Guardião' ? 30 : 25;

    } else if (enemyDetails) { 
        name = enemyDetails.name;
        
        // Vigor and Letalidade in `calculatedStats` are pre-scaled by `_applyEnemyScaling`.
        // Base HP and Damage are now used directly without threat level scaling.
        finalMaxHp = Math.floor((calculatedStats.vigor || 0) * 100 + enemyDetails.baseHp);
        effectiveDamageCalc = Math.floor((calculatedStats.letalidade || 0) * 1.25 + enemyDetails.baseDamage);

        range = enemyDetails.range;
        finalAttackIntervalMs = enemyDetails.attackSpeed;
        finalVelocidadeMovimento = calculatedStats.velocidadeMovimento || enemyDetails.velocidadeMovimento;
        
        if (calculatedStats.velocidadeAtaque && calculatedStats.velocidadeAtaque !== 0) {
            finalAttackIntervalMs = Math.round(finalAttackIntervalMs / (1 + (calculatedStats.velocidadeAtaque / 100)));
        }
        
        size = enemyDetails.size || 20;
        isBoss = enemyDetails.isBoss ?? false;
        emoji = enemyDetails.emoji;
    }
    
    if (rangePercentBonus !== 0) {
        range *= (1 + rangePercentBonus / 100);
    }
    
    if (attackIntervalOverride !== undefined) {
        finalAttackIntervalMs = attackIntervalOverride;
    }
    
    // Final object assembly
    return {
        ...(calculatedStats as BaseStats),
        name,
        color,
        bodyColor,
        weaponRepresentation,
        range,
        attackIntervalMs: finalAttackIntervalMs,
        velocidadeMovimento: finalVelocidadeMovimento,
        maxHp: Math.max(1, finalMaxHp),
        currentHp: Math.max(1, finalMaxHp), 
        effectiveDamage: Math.max(0, effectiveDamageCalc),
        size,
        isBoss,
        emoji,
    };
};

export const generateRandomEquipmentForClass = (classKey: keyof ClassDataMap): EquippedItems => {
    const getRandomItem = (filter: (item: ItemType) => boolean): ItemType | null => {
        const pool = DROPPABLE_WEAPONS.filter(filter);
        if (pool.length === 0) return null;
        return pool[Math.floor(Math.random() * pool.length)];
    };

    return {
        weapon: getRandomItem(item => item.equipsToClass === classKey),
        armor: getRandomItem(item => item.type === 'armor'),
        insignia: getRandomItem(item => item.type === 'insignia'),
        enchantment: getRandomItem(item => item.type === 'necklace'),
    };
};

export const distanceToTarget = (entity: Point, target: Point): number => {
    return Math.hypot(entity.x - target.x, entity.y - target.y);
};

export const getMultiShotTargets = (attacker: CombatCapable, mainTarget: CombatCapable, allEnemies: CombatCapable[], count: number): CombatCapable[] => {
    if (count <= 1) return [];

    const otherEnemies = allEnemies
        .filter(e => e.isAlive && e.id !== mainTarget.id)
        .sort((a, b) => distanceToTarget(attacker, a) - distanceToTarget(attacker, b));
    
    return otherEnemies.slice(0, count - 1);
};

export const isTargetInCone = (
    casterX: number, casterY: number, 
    targetX: number, targetY: number, 
    coneRange: number, 
    coneAngleRadians: number, 
    casterDirectionRadians: number
): boolean => {
    const dx = targetX - casterX;
    const dy = targetY - casterY;
    const distance = Math.hypot(dx, dy);

    if (distance === 0 || distance > coneRange) {
        return false;
    }

    const angleToTarget = Math.atan2(dy, dx);
    let angleDifference = angleToTarget - casterDirectionRadians;

    // Normalize angle difference to be between -PI and PI
    while (angleDifference > Math.PI) angleDifference -= 2 * Math.PI;
    while (angleDifference < -Math.PI) angleDifference += 2 * Math.PI;

    return Math.abs(angleDifference) <= coneAngleRadians / 2;
};