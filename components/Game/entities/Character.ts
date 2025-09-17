// FIX: Moved EventPayload_DAMAGE_TAKEN to the correct import from entityInterfaces.ts
import type { Point, ActiveBuffDebuff, ActiveBuffDebuffEffect, BaseStats, ClassData, EnemyTemplate, EquippedItems, Ability as AbilityType, PassiveEffect } from '../../../types';
import type { CombatCapable, GameEvent, UpdateResult, EventDispatcher, GameEventType, EventPayload_ENTITY_DIED, EventPayload_DAMAGE_DEALT, EventPayload_ABILITY_CAST, EventPayload_HEAL_PERFORMED, EventPayload_SHIELD_APPLIED, EventPayload_DAMAGE_TAKEN } from '../entityInterfaces';
import { Projectile } from './Projectile';
import { DamageNumber } from './DamageNumber';
import { DeathEffect } from './DeathEffect';
import { getEntityId, distanceToTarget, calculateFinalStatsForEntity } from '../entityUtils';
import { GRID_SIZE, CHARACTER_STUCK_THRESHOLD_FRAMES, CHARACTER_PROBE_DURATION_FRAMES } from '../gameConstants';
import { drawRoundedRect } from '../drawingUtils';
import { CLASSES as ALL_CLASSES_DATA } from '../../../gameData'; // For class details
import { executeEffect } from '../effects/effectExecutor';
import type { HeroEntity } from './HeroEntity';

export class Character implements CombatCapable {
    id: number;
    x: number;
    y: number;
    public walkCycle: number = 0;
    
    // Base properties that don't change from buffs (or are source for calculation)
    protected playerBaseStats: BaseStats;
    public classDetails?: ClassData;
    protected enemyDetails?: EnemyTemplate;
    protected playerLevelScale: number;
    public equippedItems?: EquippedItems; // Only for player/heroes
    public threatLevel: number = 1;

    public combatStats: ReturnType<typeof calculateFinalStatsForEntity>; // Dynamically calculated
    
    currentHp: number; // This needs to be managed carefully with maxHp changes
    shieldHp: number = 0;
    furia?: number;
    maxFuria?: number;
    corruption?: number;
    maxCorruption?: number;
    isComposing?: boolean;
    compositionSequence?: (1 | 2 | 3)[];
    public redBalloonStacks: number = 0;

    // maxHp, effectiveDamage, range etc. are now part of combatStats

    public _entityType: 'hero' | 'enemy' | 'ally' | 'unknown' = 'unknown';

    isAlive: boolean = true;
    target: CombatCapable | null = null;
    lastAttackTime: number = 0;
    attackAnimProgress: number = 0;
    deathEffectCreated: boolean = false;
    isPlayer: boolean; // Added isPlayer property
    isOpponent: boolean;
    public isUntargetable: boolean = false;

    // Combat Report Stats
    public damageDealt: number = 0;
    public healingDone: number = 0;
    public shieldingGranted: number = 0;
    public damageTaken: number = 0;

    lastPosition: Point | null;
    stuckFrameCounter: number = 0;
    isProbingUnstuck: boolean = false;
    probeAngleOffset: number = Math.PI / 4;
    probeFrameCounter: number = 0;
    
    // Buffs and Debuffs
    public activeBuffs: ActiveBuffDebuff[] = [];
    public activeDebuffs: ActiveBuffDebuff[] = [];

    // Abilities & Cooldowns
    public abilities: AbilityType[] = [];
    public abilityCooldowns: { [abilityId: string]: number } = {};

    // For channeled abilities
    private isImmobileDueToBuff: boolean = false;
    private channeledDamageAuraEffect: ActiveBuffDebuffEffect['channeledDamageAura'] | null = null;


    constructor(
        x: number, y: number,
        initialCombatStats: ReturnType<typeof calculateFinalStatsForEntity>, // This is the result of a single calculateFinalStatsForEntity call
        isPlayerCharacter: boolean = false,
        // Store the inputs to calculateFinalStatsForEntity for recalculation
        playerBaseStats: BaseStats,
        classDetails?: ClassData,
        enemyDetails?: EnemyTemplate,
        playerLevelScale: number = 1,
        equippedItems?: EquippedItems,
        threatLevel: number = 1,
        isOpponent: boolean = false
    ) {
        this.id = getEntityId();
        this.x = x;
        this.y = y;

        this.playerBaseStats = playerBaseStats;
        this.classDetails = classDetails;
        this.enemyDetails = enemyDetails;
        this.playerLevelScale = playerLevelScale;
        this.equippedItems = equippedItems;
        this.threatLevel = threatLevel;

        this.combatStats = initialCombatStats; // Use the passed initial calculation
        this.currentHp = this.combatStats.maxHp;
        // this.maxHp, this.effectiveDamage, etc., are now directly from this.combatStats
        
        this.isPlayer = isPlayerCharacter;
        this.isOpponent = isOpponent;
        this.lastPosition = { x, y };

        if (classDetails) {
            this.abilities = classDetails.abilities;
            this.abilities.forEach(ab => this.abilityCooldowns[ab.id] = 0);
        }
    }

    public isPartOfPlayerTeam(): boolean {
        if (this._entityType === 'hero') {
            // A hero is on the player's team if it is not an opponent.
            return !this.isOpponent;
        }
        if (this._entityType === 'ally') {
            // An ally belongs to its master's team. HeroEntity has an isOpponent flag.
            const master = (this as any).master as { isOpponent: boolean };
            if (master) {
                return !master.isOpponent;
            }
            return false; // Should not happen
        }
        // 'enemy' and 'unknown' types are not on the player's team.
        return false;
    }

    public useAbility(ability: AbilityType, allHeroes: CombatCapable[], allEnemies: CombatCapable[], dispatcher: EventDispatcher): UpdateResult[] {
        // Base implementation. Child classes like HeroEntity will override this.
        console.warn(`useAbility not implemented for ${this.combatStats.name} and ability ${ability.name}`);
        return [];
    }

    public handleEvent(event: GameEvent, dispatcher: EventDispatcher, allHeroes: CombatCapable[], allEnemies: CombatCapable[]): UpdateResult[] {
        const results: UpdateResult[] = [];

        if (event.type === 'DAMAGE_TAKEN') {
            const payload = event.payload as EventPayload_DAMAGE_TAKEN;
            if (payload.target.id !== this.id) return results;

            if (!this.equippedItems) return results;

            for (const slotKey in this.equippedItems) {
                const item = this.equippedItems[slotKey as keyof typeof this.equippedItems];

                if (item && item.passiveAbility?.trigger === 'DAMAGE_TAKEN') {
                    const props = item.passiveAbility.properties;
                    
                    if (item.passiveAbility.id === 'PASSIVE_BALAO_VERMELHO') {
                        const maxStacks = props.maxStacks || 1;
                        this.redBalloonStacks = Math.min(maxStacks, this.redBalloonStacks + 1);

                        if (this.redBalloonStacks >= maxStacks) {
                            this.redBalloonStacks = 0; // Reset stacks
                            if (props.effects) {
                                props.effects.forEach((effect: PassiveEffect) => {
                                    results.push(...executeEffect(effect, { caster: this, allHeroes, allEnemies, dispatcher }));
                                });
                                const radius = props.effects[0]?.properties?.radius;
                                if (radius) {
                                    results.push({ newVfx: { type: 'RED_BALLOON_EXPLOSION', x: this.x, y: this.y, radius } });
                                }
                            }
                        }
                        break; 
                    }
                }
            }
        }
        
        return results;
    }

    protected updateWalkAnimation(deltaTime: number, didMove: boolean): void {
        if (didMove) {
            // Adjust speed for a natural-looking sway, maybe 0.007 is good
            this.walkCycle += deltaTime * 0.007; 
        } else {
            // If not moving, smoothly return to an upright position.
            if (this.walkCycle !== 0) {
                const remainder = this.walkCycle % Math.PI;
                // Move towards the nearest multiple of PI (where sin is 0)
                if (remainder > Math.PI / 2) {
                    // Lerp to the next multiple of PI
                    this.walkCycle += (Math.PI - remainder) * 0.1; 
                } else {
                    // Lerp to the previous multiple of PI
                    this.walkCycle -= remainder * 0.1; 
                }

                // If close enough, snap to 0 to stop animation completely and prevent jittering
                if (Math.abs(Math.sin(this.walkCycle)) < 0.05) {
                    this.walkCycle = 0;
                }
            }
        }
    }
    
    public applyLifesteal(damageDealt: number, targetIsBoss: boolean): UpdateResult | null {
        if (this.combatStats.vampirismo && this.combatStats.vampirismo > 0 && damageDealt > 0) {
            const potentialLifeStealDamage = targetIsBoss ? damageDealt * 0.5 : damageDealt;
            const baseLifeSteal = potentialLifeStealDamage * (this.combatStats.vampirismo / 100);
            const finalLifeSteal = baseLifeSteal * (1 + (this.combatStats.curaRecebidaBonus || 0) / 100);

            const lifeStolen = Math.ceil(finalLifeSteal);
            if (lifeStolen > 0) {
                this.currentHp = Math.min(this.maxHp, this.currentHp + lifeStolen);
                this.healingDone += lifeStolen;
                if (this.isPlayer) {
                    return { newDamageNumber: new DamageNumber(`+${lifeStolen}`, this.x, this.y - 10, 'green') };
                }
            }
        }
        return null;
    }

    public afterDealingDamage(damageDealt: number, target: CombatCapable, allEnemies: CombatCapable[]): UpdateResult[] {
        const results: UpdateResult[] = [];
        const lifestealResult = this.applyLifesteal(damageDealt, target.isBoss || false);
        if (lifestealResult) {
            results.push(lifestealResult);
        }
    
        // Process all on-hit effects from buffs
        this.activeBuffs.forEach(buff => {
            // Frenesi AoE
            if (buff.effects.onHitAoeDamage) {
                const props = buff.effects.onHitAoeDamage;
                const aoeDamage = (target.maxHp * (props.damagePercentTargetMaxHp / 100)) + 
                                  (this.combatStats.letalidade * props.lethalityMultiplier);
                const roundedAoeDamage = Math.round(aoeDamage);
    
                if (roundedAoeDamage > 0) {
                    const enemiesInArea = allEnemies.filter(e => 
                        e.isAlive && 
                        distanceToTarget(target, e) <= props.radius
                    );
    
                    if (!enemiesInArea.some(e => e.id === target.id)) {
                        enemiesInArea.push(target);
                    }
    
                    enemiesInArea.forEach(enemy => {
                        const oldHp = enemy.currentHp;
                        const dmgTaken = enemy.takeDamage(roundedAoeDamage, false, this);
                        
                        if (typeof dmgTaken === 'number') {
                            if (this.isPlayer) { // Only show damage number if the attacker is the main player
                                results.push({ newDamageNumber: new DamageNumber(dmgTaken, enemy.x, enemy.y, 'white') });
                            }
    
                            if (enemy.currentHp <= 0 && oldHp > 0 && !enemy.deathEffectCreated) {
                                results.push({ newEffect: new DeathEffect(enemy.x, enemy.y, '#757575') });
                                enemy.deathEffectCreated = true;
                            }
                        }
                    });
                }
            }
    
            // Poder Necro DoT
            if (buff.effects.applyDotOnHit) {
                const dotInfo = buff.effects.applyDotOnHit;
                const casterMissingHp = this.maxHp - this.currentHp;
                const targetMissingHp = target.maxHp - target.currentHp;
                const dotDmgPerTick = (casterMissingHp > 0 ? casterMissingHp * (dotInfo.dotDamagePercentCasterMissingHp / 100) : 0) +
                                      (targetMissingHp > 0 ? targetMissingHp * (dotInfo.dotDamagePercentTargetMissingHp / 100) : 0);
                if (dotDmgPerTick > 0) {
                    const dotDebuff: ActiveBuffDebuff = {
                        id: `${dotInfo.id}_${target.id}_${Date.now()}`,
                        abilityId: dotInfo.id,
                        name: dotInfo.name,
                        icon: dotInfo.icon,
                        // FIX: Correct property name from 'dotDurationMs' to 'durationMs'
                        durationMs: dotInfo.dotDurationMs,
                        remainingMs: dotInfo.dotDurationMs,
                        isBuff: false,
                        sourceEntityId: this.id,
                        targetEntityId: target.id,
                        appliedAt: Date.now(),
                        effects: {
                            dot: {
                                tickIntervalMs: dotInfo.dotTickIntervalMs,
                                damagePerTick: Math.max(1, Math.round(dotDmgPerTick)),
                                lastTickTime: Date.now(),
                                sourceCasterId: this.id
                            }
                        }
                    };
                    target.applyDebuff(dotDebuff);
                }
            }
        });
    
        return results;
    }

    get maxHp(): number { return this.combatStats.maxHp; }
    get effectiveDamage(): number { return this.combatStats.effectiveDamage; }
    get range(): number { return this.combatStats.range; }
    get attackIntervalMs(): number { return this.combatStats.attackIntervalMs; }
    get movementSpeed(): number { return (this.combatStats.velocidadeMovimento * GRID_SIZE) / 60; } // pixels per frame
    get size(): number { return this.combatStats.size || 20; }
    get color(): string | undefined { return this.combatStats.color; }
    get bodyColor(): string | undefined { return this.combatStats.bodyColor; }
    get isBoss(): boolean | undefined { return this.combatStats.isBoss; }


    public recalculateStats(): void {
        const oldMaxHp = this.combatStats.maxHp;
        const oldHpPercent = oldMaxHp > 0 ? this.currentHp / oldMaxHp : 1;

        this.combatStats = calculateFinalStatsForEntity(
            this.playerBaseStats,
            this.classDetails,
            this.enemyDetails,
            this.playerLevelScale,
            this.equippedItems,
            this.activeBuffs,
            this.activeDebuffs,
            this.threatLevel
        );
        
        this.currentHp = Math.max(1, Math.round(this.combatStats.maxHp * oldHpPercent));
        
        if (this.currentHp > this.combatStats.maxHp) {
             this.currentHp = this.combatStats.maxHp;
        }
        if (this.currentHp <=0 && this.isAlive) this.currentHp = 1; // Prevent dying from stat changes alone if still alive

        // Update channeled states based on new stats
        this.isImmobileDueToBuff = false;
        this.channeledDamageAuraEffect = null;
        [...this.activeBuffs, ...this.activeDebuffs].forEach(bd => {
            if (bd.effects.isImmobile) this.isImmobileDueToBuff = true;
            if (bd.effects.channeledDamageAura) {
                 this.channeledDamageAuraEffect = { 
                    ...bd.effects.channeledDamageAura, 
                    lastTickTime: this.channeledDamageAuraEffect?.lastTickTime || bd.effects.channeledDamageAura?.lastTickTime || Date.now() // Preserve lastTickTime if already set
                };
            }
        });
    }

    public applyShield(amount: number): void {
        this.shieldHp += amount;
    }

    public applyBuff(buff: ActiveBuffDebuff): void {
        // Prevent stacking identical buffs unless designed to stack (e.g. by unique ID)
        const existingBuffIndex = this.activeBuffs.findIndex(b => b.abilityId === buff.abilityId && !b.id.startsWith('stackable_'));
        if (existingBuffIndex !== -1) {
            this.activeBuffs[existingBuffIndex] = buff; // Refresh duration or replace
        } else {
            this.activeBuffs.push(buff);
        }
        this.recalculateStats();
    }

    public applyDebuff(debuff: ActiveBuffDebuff): void {
        const existingDebuffIndex = this.activeDebuffs.findIndex(d => d.abilityId === debuff.abilityId);

        if (existingDebuffIndex !== -1) {
            const existingDebuff = this.activeDebuffs[existingDebuffIndex];
            if (debuff.maxStacks && debuff.maxStacks > 1) {
                existingDebuff.stacks = Math.min(debuff.maxStacks, (existingDebuff.stacks || 1) + 1);
            }
            existingDebuff.remainingMs = debuff.durationMs;
            existingDebuff.appliedAt = Date.now();
        } else {
            this.activeDebuffs.push({ ...debuff, stacks: 1 });
        }
        this.recalculateStats();
    }

    public removeDebuff(abilityId: string): void {
        const initialLength = this.activeDebuffs.length;
        this.activeDebuffs = this.activeDebuffs.filter(d => d.abilityId !== abilityId);
        if (this.activeDebuffs.length < initialLength) {
            this.recalculateStats();
        }
    }


    private updateBuffsDebuffs(deltaTime: number): void {
        let statsChanged = false;

        this.activeBuffs = this.activeBuffs.filter(buff => {
            buff.remainingMs -= deltaTime;
            if (buff.remainingMs <= 0) {
                statsChanged = true;
                return false;
            }
            return true;
        });

        this.activeDebuffs = this.activeDebuffs.filter(debuff => {
            debuff.remainingMs -= deltaTime;
            if (debuff.remainingMs <= 0) {
                statsChanged = true;
                return false;
            }
            return true;
        });

        if (statsChanged) {
            this.recalculateStats();
        }
    }
    
    public updateCooldowns(deltaTime: number): void {
        for (const id in this.abilityCooldowns) {
            if (this.abilityCooldowns[id] > 0) {
                this.abilityCooldowns[id] = Math.max(0, this.abilityCooldowns[id] - deltaTime);
            }
        }
    }

    public receiveHeal(amount: number, sourceCaster: CombatCapable): void {
        // This method applies the heal.
        // It is designed to be overridden by subclasses (like LivingTreeAlly) to trigger effects.
        const roundedHeal = Math.round(amount);
        if (roundedHeal > 0) {
            this.currentHp = Math.min(this.maxHp, this.currentHp + roundedHeal);
        }
    }

    takeDamage(amount: number, isCrit: boolean = false, attacker?: CombatCapable, options?: { neverMiss?: boolean }): number | 'esquiva' | 'bloqueado' {
        if (!this.isAlive) return 0;
        
        // A character that is "untargetable" (e.g., mid-jump) is immune to all damage.
        // This is different from "invisible," which should only prevent new single-target attacks.
        // If a bug is making invisible units untargetable, this check will correctly separate the two states.
        if (this.isUntargetable) {
            const isInvisible = this.activeBuffs.some(b => b.effects.isInvisible);
            if (!isInvisible) {
                return 'esquiva';
            }
        }
    
        let totalDamage = amount;
    
        if (attacker) {
            // "Apunhalado" debuff logic
            const apunhaladoDebuff = this.activeDebuffs.find(d => 
                d.abilityId === 'DEBUFF_APUNHALADO' && 
                d.sourceEntityId === attacker.id
            );
    
            if (apunhaladoDebuff) {
                const missingHpPercent = (this.maxHp - this.currentHp) / this.maxHp;
                let bonusMultiplier = 0;
    
                const minBonus = 0.10; // 10%
                const maxBonus = 0.70; // 70%
                const peakThreshold = 0.70; // 70% missing hp (at 30% remaining)
    
                if (missingHpPercent >= peakThreshold) {
                    bonusMultiplier = maxBonus;
                } else if (missingHpPercent > 0) {
                    bonusMultiplier = minBonus + (missingHpPercent / peakThreshold) * (maxBonus - minBonus);
                }
                
                totalDamage *= (1 + bonusMultiplier);
            }
        }
    
        const blockBuffIndex = this.activeBuffs.findIndex(b => b.effects.blockCharges && b.effects.blockCharges > 0);
        if (blockBuffIndex !== -1) {
            const blockBuff = this.activeBuffs[blockBuffIndex];
            if (blockBuff.effects.blockCharges) {
                blockBuff.effects.blockCharges--;
                if (blockBuff.effects.blockCharges <= 0) {
                    this.activeBuffs.splice(blockBuffIndex, 1);
                    this.recalculateStats();
                }
                return 'bloqueado';
            }
        }
        
        if (this.activeBuffs.some(b => b.effects.isInvulnerable)) {
            return 'esquiva';
        }

        if (!options?.neverMiss) {
            const attackerHitChance = attacker?.combatStats.chanceDeAcerto ?? 100;
            const dodgeChanceReduction = Math.max(0, attackerHitChance - 100);
            const effectiveDodgeChance = Math.max(0, (this.combatStats.chanceEsquiva || 0) - dodgeChanceReduction);

            if (effectiveDodgeChance > 0 && Math.random() * 100 < effectiveDodgeChance) {
                return 'esquiva';
            }
        }


        const resistance = this.combatStats.resistencia || 0;
        const damageMultiplier = 100 / (100 + resistance);
        const finalDamage = Math.max(1, Math.round(totalDamage * damageMultiplier));

        this.damageTaken += finalDamage;
        if (attacker && attacker instanceof Character) {
            let damageAttributor: Character = attacker;
            // If the attacker is an ally with a master (i.e., a summon),
            // attribute the damage dealt to the master for combat report purposes.
            if (attacker._entityType === 'ally' && 'master' in attacker && (attacker as any).master) {
                damageAttributor = (attacker as any).master;
            }
            damageAttributor.damageDealt += finalDamage;
        }

        const damageAbsorbedByShield = Math.min(this.shieldHp, finalDamage);
        this.shieldHp -= damageAbsorbedByShield;

        const remainingDamage = finalDamage - damageAbsorbedByShield;

        if (remainingDamage > 0) {
            this.currentHp -= remainingDamage;
        }

        if (this.currentHp <= 0) {
            this.currentHp = 0;
            this.isAlive = false;
        }
        return finalDamage;
    }

    findTarget(potentialTargets: CombatCapable[]) {
        const myTeamIsPlayer = this.isPartOfPlayerTeam();
    
        const tauntDebuff = this.activeDebuffs.find(d => d.effects.isTaunted);
        if (tauntDebuff && tauntDebuff.sourceEntityId !== undefined) {
            const taunter = potentialTargets.find(t => t.id === tauntDebuff.sourceEntityId);
            if (taunter && taunter.isAlive && !(taunter as Character).isUntargetable) {
                this.target = taunter;
                return;
            }
        }
    
        if (this.target && this.target.isAlive && !(this.target as Character).isUntargetable && !this.target.activeBuffs.some(b => b.effects.isInvisible) && distanceToTarget(this, this.target) <= this.range * 1.5) {
            // Also check if the current target is an enemy
            if (myTeamIsPlayer !== (this.target as Character).isPartOfPlayerTeam()) {
                const currentTargetDistance = distanceToTarget(this, this.target);
                if (currentTargetDistance <= this.range * 1.2) return; // Keep current target if reasonably close and is an enemy
            }
        }
    
        let closestTarget: CombatCapable | null = null;
        let minDistance = Infinity;
    
        // The main fix: filter the provided list to ensure we only consider opponents.
        const livingTargets = potentialTargets.filter(t => {
            if (!t.isAlive || (t as Character).isUntargetable || t.activeBuffs.some(b => b.effects.isInvisible)) {
                return false;
            }
            const targetTeamIsPlayer = (t as Character).isPartOfPlayerTeam();
            return myTeamIsPlayer !== targetTeamIsPlayer;
        });
    
        let orderedTargets = [...livingTargets];
        // Basic Taunt: Prioritize Guardians if this character is an enemy
        if (this._entityType === 'enemy' || this.isOpponent) {
            const guardians = livingTargets.filter(t => (t as Character).combatStats.name === 'Guardião' && t.isAlive);
            if (guardians.length > 0) {
                orderedTargets = guardians; // Focus guardians first
            }
        }
    
        for (const target of orderedTargets) {
            const distance = distanceToTarget(this, target);
            if (distance < minDistance) {
                minDistance = distance;
                closestTarget = target;
            }
        }
        this.target = closestTarget;
    }

    // FIX: Update return type to include optional debuffOnHit property to align with HeroEntity's implementation.
    attack(): { damageDealt: number, isCrit: boolean, projectile?: Projectile, debuffOnHit?: any } | null {
        if (this.isImmobileDueToBuff && !this.channeledDamageAuraEffect) return null; // Can't attack if immobile by buff unless it's a damage aura
        if (!this.target || !this.target.isAlive) return null;

        if (Date.now() - this.lastAttackTime >= this.attackIntervalMs) {
            const result = this.performAttack();
            if (result) {
                 this.lastAttackTime = Date.now();
            }
            return result;
        }
        return null;
    }

    // FIX: Update return type to include optional debuffOnHit property.
    performAttack(): { damageDealt: number, isCrit: boolean, projectile?: Projectile, debuffOnHit?: any } | null {
        if (!this.target) return null;

        let isCrit: boolean = !!(this.combatStats.chanceCritica && Math.random() * 100 < this.combatStats.chanceCritica);
        let finalDamage = this.effectiveDamage;
        let bonusDamageFromBuff = 0;

        // Check for Golpe Certeiro buff (or similar "next attack is special" buffs)
        const attackModifierBuffIndex = this.activeBuffs.findIndex(b => b.effects.nextAttackCrit || b.effects.nextAttackBonusDamagePercentTargetMaxHp);
        if (attackModifierBuffIndex !== -1) {
            const buff = this.activeBuffs[attackModifierBuffIndex];
            if (buff.effects.nextAttackCrit) {
                isCrit = true;
            }
            if (buff.effects.nextAttackBonusDamagePercentTargetMaxHp && this.target.maxHp) {
                bonusDamageFromBuff = this.target.maxHp * (buff.effects.nextAttackBonusDamagePercentTargetMaxHp / 100);
            }
            // Consume the buff
            this.activeBuffs.splice(attackModifierBuffIndex, 1);
            this.recalculateStats(); 
        }

        if (isCrit) {
            finalDamage = Math.round(finalDamage * (1 + (this.combatStats.danoCritico || 50) / 100));
        }

        // Add bonus damage from other buffs that don't get consumed
        let bonusDamageOnHit = 0;
        this.activeBuffs.forEach(buff => {
            if (buff.effects.bonusDamageOnAttackAsPercentOfMaxHp) {
                bonusDamageOnHit += this.maxHp * (buff.effects.bonusDamageOnAttackAsPercentOfMaxHp / 100);
            }
        });
        
        finalDamage += bonusDamageFromBuff;
        finalDamage += bonusDamageOnHit;

        finalDamage = Math.max(1, Math.round(finalDamage));
        
        this.attackAnimProgress = 1;

        if (this.range > GRID_SIZE * 1.1) { 
            const projectileOptions = { color: this.bodyColor || 'grey' };
            return { damageDealt: finalDamage, isCrit, projectile: new Projectile(this.x, this.y, this, this.target, finalDamage, isCrit, projectileOptions) };
        } else { 
            return { damageDealt: finalDamage, isCrit };
        }
    }

    updateAnimation() {
        if (this.attackAnimProgress > 0) {
            this.attackAnimProgress = Math.max(0, this.attackAnimProgress - 0.1);
        }
    }
    
    updateMovement(targetX: number, targetY: number, canvasWidth: number, canvasHeight: number) {
        if (this.isImmobileDueToBuff) return; // Prevent movement if buffed as immobile

        const angle = Math.atan2(targetY - this.y, targetX - this.x);
        const nextXUnchecked = this.x + Math.cos(angle) * this.movementSpeed;
        const nextYUnchecked = this.y + Math.sin(angle) * this.movementSpeed;

        const nextX = Math.max(this.size / 2, Math.min(canvasWidth - this.size / 2, nextXUnchecked));
        const nextY = Math.max(this.size / 2, Math.min(canvasHeight - this.size / 2, nextYUnchecked));
        
        this.x = nextX;
        this.y = nextY;
    }

    updateStuckLogic() {
        if (!this.target || !this.isAlive || distanceToTarget(this, this.target) <= this.range * 0.9 /* A bit of leeway */ ) {
            this.stuckFrameCounter = 0;
            this.isProbingUnstuck = false;
            this.probeFrameCounter = 0;
            if (this.lastPosition) {
                 this.lastPosition.x = this.x;
                 this.lastPosition.y = this.y;
            }
            return;
        }

        if (this.lastPosition && Math.hypot(this.x - this.lastPosition.x, this.y - this.lastPosition.y) < 0.5) { // Reduced threshold
            this.stuckFrameCounter++;
        } else {
            this.stuckFrameCounter = 0;
        }
        
        if (this.lastPosition) {
            this.lastPosition.x = this.x;
            this.lastPosition.y = this.y;
        }

        if (this.isProbingUnstuck) {
            this.probeFrameCounter--;
            if (this.probeFrameCounter <= 0 || this.stuckFrameCounter === 0) {
                this.isProbingUnstuck = false;
                this.probeFrameCounter = 0;
            }
        } else if (this.stuckFrameCounter >= CHARACTER_STUCK_THRESHOLD_FRAMES) {
            this.isProbingUnstuck = true;
            this.probeFrameCounter = CHARACTER_PROBE_DURATION_FRAMES;
            this.probeAngleOffset = (Math.random() > 0.5 ? 1 : -1) * (Math.PI / 3 + Math.random() * Math.PI / 6); // More varied probe angle
            this.stuckFrameCounter = 0; 
            // console.log(`${this.combatStats.name} is stuck, trying to probe at angle offset: ${this.probeAngleOffset}`);
        }
    }

    private updateChanneledAbilities(allTargets: CombatCapable[]): UpdateResult[] {
        const results: UpdateResult[] = [];
        if (this.channeledDamageAuraEffect) {
            const aura = this.channeledDamageAuraEffect;
            if (!aura.lastTickTime || (Date.now() - aura.lastTickTime >= aura.tickIntervalMs)) {
                aura.lastTickTime = Date.now();
    
                allTargets.forEach(entityTarget => {
                    if (entityTarget.isAlive && distanceToTarget(this, entityTarget) <= aura.radius) {
                        let tickDamage = this.effectiveDamage * aura.damageMultiplier;
                        if (aura.isCrit) {
                            tickDamage = Math.round(tickDamage * (1 + (this.combatStats.danoCritico || 50) / 100));
                        }
                        tickDamage = Math.max(1, Math.round(tickDamage));
    
                        const dmgTaken = entityTarget.takeDamage(tickDamage, aura.isCrit, this);
                        results.push({
                            eventToDispatch: {
                                type: 'DAMAGE_TAKEN',
                                payload: { target: entityTarget, attacker: this, amount: typeof dmgTaken === 'number' ? dmgTaken : 0, result: typeof dmgTaken === 'number' ? 'hit' : dmgTaken, isCrit: aura.isCrit, isDot: true, abilityId: 'CHANNELED_AURA' }
                            }
                        });
                        if (typeof dmgTaken === 'number') {
                            results.push({
                                eventToDispatch: {
                                    type: 'DAMAGE_DEALT',
                                    payload: { attacker: this, target: entityTarget, amount: dmgTaken, isCrit: aura.isCrit, isDot: true, abilityId: 'CHANNELED_AURA' }
                                }
                            });
                            const afterDamageResults = this.afterDealingDamage(dmgTaken, entityTarget, allTargets);
                            results.push(...afterDamageResults);
                        }
                        
                        let damageResult: UpdateResult = {};
                        if (typeof dmgTaken === 'number') {
                            damageResult.newDamageNumber = new DamageNumber(dmgTaken, entityTarget.x, entityTarget.y, aura.isCrit ? 'red' : 'white');
                        } else if (dmgTaken === 'esquiva') {
                            damageResult.newDamageNumber = new DamageNumber("Esquiva!", entityTarget.x, entityTarget.y, 'white');
                        } else if (dmgTaken === 'bloqueado') {
                            damageResult.newDamageNumber = new DamageNumber("Bloqueado!", entityTarget.x, entityTarget.y, 'cyan');
                        }
    
                        if (entityTarget.currentHp <= 0 && !entityTarget.deathEffectCreated) {
                            damageResult.newEffect = new DeathEffect(entityTarget.x, entityTarget.y, entityTarget.combatStats.isBoss ? '#C62828' : '#757575', entityTarget.combatStats.isBoss ? 35 : 15, entityTarget.combatStats.isBoss ? 60 : 30);
                            entityTarget.deathEffectCreated = true;
                        }
                        if (damageResult.newDamageNumber || damageResult.newEffect) {
                            results.push(damageResult);
                        }
                    }
                });
            }
        }
        return results;
    }

    private updateDotEffects(allHeroes: CombatCapable[], allEnemies: CombatCapable[]): UpdateResult[] {
        const results: UpdateResult[] = [];
        this.activeDebuffs.forEach(debuff => {
            const dot = debuff.effects.dot;
            if (dot) {
                if (!dot.lastTickTime) {
                    dot.lastTickTime = Date.now();
                }
                if (Date.now() - dot.lastTickTime >= dot.tickIntervalMs) {
                    dot.lastTickTime = Date.now();
                    const caster = [...allHeroes, ...allEnemies].find(c => c.id === dot.sourceCasterId);
                    
                    const dmgTaken = this.takeDamage(dot.damagePerTick, false, caster);
                    results.push({
                        eventToDispatch: {
                            type: 'DAMAGE_TAKEN',
                            payload: { target: this, attacker: caster, amount: typeof dmgTaken === 'number' ? dmgTaken : 0, result: typeof dmgTaken === 'number' ? 'hit' : dmgTaken, isCrit: false, isDot: true, abilityId: debuff.abilityId }
                        }
                    });
                    if (typeof dmgTaken === 'number' && dmgTaken > 0 && caster) {
                        results.push({
                            eventToDispatch: {
                                type: 'DAMAGE_DEALT',
                                payload: { attacker: caster, target: this, amount: dmgTaken, isCrit: false, isDot: true, abilityId: debuff.abilityId }
                            }
                        });
                    }
                    
                    let dotResult: UpdateResult = {};
                    if (this.isPlayer || (caster && caster.isPlayer)) {
                        if (typeof dmgTaken === 'number') {
                            if (dmgTaken > 0) {
                                dotResult.newDamageNumber = new DamageNumber(dmgTaken, this.x, this.y, 'orange');
                            }
                        } else if (dmgTaken === 'esquiva') {
                             dotResult.newDamageNumber = new DamageNumber("Esquiva!", this.x, this.y, 'white');
                        }
                    }


                    if (this.currentHp <= 0 && !this.deathEffectCreated) {
                        dotResult.newEffect = new DeathEffect(this.x, this.y, this.isBoss ? '#C62828' : '#757575', this.isBoss ? 35 : 15, this.isBoss ? 60 : 30);
                        this.deathEffectCreated = true;
                    }

                    if(dotResult.newDamageNumber || dotResult.newEffect) {
                        results.push(dotResult);
                    }
                }
            }
        });
        return results;
    }

    public updateHotEffects(allHeroes: CombatCapable[], allEnemies: CombatCapable[]): UpdateResult[] {
        const results: UpdateResult[] = [];
        this.activeBuffs.forEach(buff => {
            const hot = buff.effects.hot;
            if (hot) {
                if (!hot.lastTickTime) {
                    hot.lastTickTime = Date.now();
                }
                if (Date.now() - hot.lastTickTime >= hot.tickIntervalMs) {
                    hot.lastTickTime = Date.now();
                    const allCombatants = [...allHeroes, ...allEnemies];
                    const caster = allCombatants.find(c => c.id === hot.sourceCasterId);
                    
                    let baseHealAmount = 0;
                    if (hot.healPerTick) {
                        baseHealAmount = hot.healPerTick;
                    } else if (caster) {
                        // DYNAMIC HEAL LOGIC
                        const missingHp = this.maxHp - this.currentHp;
                        const healFromMissingHp = missingHp > 0 ? missingHp * (hot.healPercentOfTargetMissingHp || 0) / 100 : 0;
                        const healFromPower = (caster.combatStats.poderDeCura || 0) * (hot.healFromCasterPowerOfHealingMultiplier || 0);
                        const healFromLethality = (caster.combatStats.letalidade || 0) * (hot.healFromCasterLethalityMultiplier || 0);
                        baseHealAmount = healFromMissingHp + healFromPower + healFromLethality;
                    }
                    
                    const finalHealAmount = baseHealAmount * (1 + (this.combatStats.curaRecebidaBonus || 0) / 100);
                    const roundedHeal = Math.round(finalHealAmount);
    
                    if (roundedHeal > 0) {
                        const oldHp = this.currentHp;
                        this.receiveHeal(roundedHeal, caster || this);
                        const actualHeal = this.currentHp - oldHp;
                        
                        if (caster) {
                            caster.healingDone += actualHeal;
                        } else {
                            this.healingDone += actualHeal;
                        }
                    }
    
                    if (this.isPlayer || (caster && caster.isPlayer)) {
                        if (roundedHeal > 0) {
                            results.push({ newDamageNumber: new DamageNumber(`+${roundedHeal}`, this.x, this.y - 10, 'green') });
                        }
                    }
                }
            }
        });
        return results;
    }


    update(deltaTime: number, heroes: CombatCapable[], enemies: CombatCapable[], canvasSize: { width: number; height: number; }): { results: UpdateResult[], abilityToTrigger?: string } {
        const results: UpdateResult[] = [];
        if (!this.isAlive) return { results, abilityToTrigger: undefined };

        this.updateCooldowns(deltaTime);
        this.updateBuffsDebuffs(deltaTime);
        results.push(...this.updateDotEffects(heroes, enemies));
        results.push(...this.updateHotEffects(heroes, enemies));
        
        this.updateAnimation();
        this.updateStuckLogic();
        
        results.push(...this.updateChanneledAbilities(this._entityType === 'hero' ? enemies : heroes));
        
        return { results, abilityToTrigger: undefined };
    }

    draw(ctx: CanvasRenderingContext2D, isPreview: boolean = false, isDragged: boolean = false) {
        if (!isPreview) this.drawHealthBar(ctx);

        // Draw buff/debuff icons
        let buffIconX = this.x - this.size / 2;
        const iconY = this.y + this.size / 2 + 5;
        const iconSize = 10;

        // Special handling for Agilidade/Frenesi
        const hasFrenesi = this.activeBuffs.some(b => b.abilityId === 'BUFF_FRENESI_AGILIDADE');

        this.activeBuffs.forEach(buff => {
            // If Frenesi is active, do not draw the Agilidade buff that causes it.
            if (hasFrenesi && buff.abilityId === 'BUFF_AGILIDADE') {
                return; // Skip drawing this buff
            }

            if (buff.icon) {
                ctx.font = `${iconSize}px sans-serif`;
                let textToDraw = buff.icon;
                if (buff.stacks && buff.stacks > 0) {
                    textToDraw += `x${buff.stacks}`;
                }
                ctx.fillText(textToDraw, buffIconX, iconY);
                buffIconX += ctx.measureText(textToDraw).width + 4;
            }
        });

        let debuffIconX = buffIconX; // Start after buffs
        this.activeDebuffs.forEach(debuff => {
            if (debuff.icon) {
                ctx.font = `${iconSize}px sans-serif`;
                let textToDraw = debuff.icon;
                if (debuff.stacks && debuff.stacks > 1) {
                    textToDraw += `x${debuff.stacks}`;
                }
                ctx.fillText(textToDraw, debuffIconX, iconY);
                debuffIconX += ctx.measureText(textToDraw).width + 4;
            }
        });
    }


    drawHealthBar(ctx: CanvasRenderingContext2D) {
        if (this.isBoss && this._entityType === 'enemy') return;

        const healthBarWidth = this.size * 1.8;
        const healthBarHeight = this.size * 0.22; 

        const totalHeroVisualHeight = this.size * 1.5; 
        const healthBarX = this.x - healthBarWidth / 2;
        const healthBarY = this.y - totalHeroVisualHeight * 0.8; 

        const healthColor = (this._entityType === 'enemy' || this.isOpponent) ? '#D22B2B' : '#50C878';
        const backgroundColor = 'rgba(0, 0, 0, 0.4)';

        ctx.fillStyle = backgroundColor;
        drawRoundedRect(ctx, healthBarX, healthBarY, healthBarWidth, healthBarHeight, 2);
        ctx.fill();

        const currentHealthWidth = Math.max(0, (this.currentHp / this.maxHp) * healthBarWidth);
        ctx.fillStyle = healthColor;
        drawRoundedRect(ctx, healthBarX, healthBarY, currentHealthWidth, healthBarHeight, 2);
        ctx.fill();

        if (this.shieldHp > 0) {
            const shieldBarWidth = Math.min(healthBarWidth, (this.shieldHp / this.maxHp) * healthBarWidth);
            ctx.fillStyle = 'rgba(173, 216, 230, 0.85)'; // Light blue, semi-opaque
            drawRoundedRect(ctx, healthBarX, healthBarY, shieldBarWidth, healthBarHeight, 2);
            ctx.fill();
        }

        ctx.strokeStyle = '#333'; 
        ctx.lineWidth = 1;
        drawRoundedRect(ctx, healthBarX, healthBarY, healthBarWidth, healthBarHeight, 2);
        ctx.stroke();
    }
}