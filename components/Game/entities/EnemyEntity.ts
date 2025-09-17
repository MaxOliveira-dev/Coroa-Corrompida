import { Character } from './Character';
import type { CombatCapable, UpdateResult, EventDispatcher, Point } from '../entityInterfaces';
import { Projectile } from './Projectile'; 
import { DamageNumber } from './DamageNumber';
import { DeathEffect } from './DeathEffect';
import { calculateFinalStatsForEntity, distanceToTarget, getEntityId } from '../entityUtils';
import type { BaseStats, EnemyTemplate, Ability, ActiveBuffDebuff, PassiveAbility, ActiveArea } from '../../../types';
import { GRID_SIZE } from '../gameConstants';

const defaultEnemyBaseStats: BaseStats = {
    letalidade: 0,
    vigor: 0,
    resistencia: 0,
    velocidadeAtaque: 0,
    velocidadeMovimento: 1,
    chanceCritica: 0,
    danoCritico: 50,
    chanceEsquiva: 0,
    chanceDeAcerto: 100,
    vampirismo: 0,
    poderDeCura: 0,
    curaRecebidaBonus: 0,
};

export class EnemyEntity extends Character {
    aggroRadius: number = 150; 
    isAgro: boolean = false;
    emoji: string;
    isCountedAsKilled: boolean = false;
    public isJumping: boolean = false;
    public isChanneling: boolean = false;
    public isReviving: boolean = false;
    public isSubmerged: boolean = false;
    private submergedDestination: Point | null = null;
    private submergedHitHeroes: Set<number> = new Set();
    private submergedProps: any = null;
    private subterraneanPhase: 'none' | 'retreating' | 'charging' = 'none';
    private retreatDestination: Point | null = null;
    private retreatTimer: number = 0;
    public passiveAbility?: PassiveAbility;

    constructor(
        x: number, y: number,
        initialCombatStats: ReturnType<typeof calculateFinalStatsForEntity>,
        enemyTemplate: EnemyTemplate, // To get baseStats for recalculation
        threatLevel: number = 1
    ) {
        super(
            x, y,
            initialCombatStats,
            false, // isPlayerCharacter
            { ...defaultEnemyBaseStats, ...(enemyTemplate.baseStats || {}) }, // Provide enemy's own base stats
            undefined, // no classDetails
            enemyTemplate,
            1, // playerLevelScale is unused for enemies
            undefined, // no equippedItems
            threatLevel
        );
        this._entityType = 'enemy';
        this.emoji = initialCombatStats.emoji || '❓'; 
        if (this.isBoss) {
            this.aggroRadius = 300; 
        }
        if (enemyTemplate.abilities) {
            this.abilities = enemyTemplate.abilities;
            this.abilities.forEach(ab => this.abilityCooldowns[ab.id] = ab.cooldownMs / 2); // Start with half cooldown
        }
        this.passiveAbility = enemyTemplate.passiveAbility;
    }

    // FIX: Update return type to include optional debuffOnHit property for consistency with HeroEntity.
    performAttack(): { damageDealt: number; isCrit: boolean; projectile?: Projectile; debuffOnHit?: any; } | null {
        if (!this.target) return null;

        let isCrit = !!(this.combatStats.chanceCritica && Math.random() * 100 < this.combatStats.chanceCritica);

        // Passive check for guaranteed crit
        if (this.passiveAbility && this.passiveAbility.trigger === 'BASIC_ATTACK_LANDED' && (this.passiveAbility.properties as any).onHitConditional) {
            const props = (this.passiveAbility.properties as any).onHitConditional;
            if (this.target.activeDebuffs.some(d => d.abilityId === props.requiredDebuffId)) {
                if (props.guaranteedCrit) {
                    isCrit = true;
                }
            }
        }
        
        let finalDamage = this.effectiveDamage;
        if (isCrit) {
            finalDamage = Math.round(finalDamage * (1 + (this.combatStats.danoCritico || 50) / 100));
        }
        finalDamage = Math.max(1, Math.round(finalDamage));
        this.attackAnimProgress = 1;

        if (this.range > GRID_SIZE * 1.1) {
            return { damageDealt: finalDamage, isCrit, projectile: new Projectile(this.x, this.y, this, this.target, finalDamage, isCrit) };
        } else {
            return { damageDealt: finalDamage, isCrit };
        }
    }

    public afterDealingDamage(damageDealt: number, target: CombatCapable, allEnemies: CombatCapable[]): UpdateResult[] {
        const results = super.afterDealingDamage(damageDealt, target, allEnemies);
    
        if (this.passiveAbility && this.passiveAbility.trigger === 'BASIC_ATTACK_LANDED') {
            const props = this.passiveAbility.properties as any;

            // Scorpion King Passive
            if (props.debuff) {
                const debuffTemplate = props.debuff;
                
                const dotTemplate = debuffTemplate.effects.dot;
                const damagePerTick = target.maxHp * (dotTemplate.damagePercentOfTargetMaxHp / 100);
    
                const poisonDebuffData: ActiveBuffDebuff = {
                    id: `${debuffTemplate.id}_${target.id}`,
                    abilityId: debuffTemplate.id,
                    name: debuffTemplate.name,
                    icon: debuffTemplate.icon,
                    durationMs: debuffTemplate.durationMs,
                    remainingMs: debuffTemplate.durationMs,
                    effects: { 
                        dot: {
                            tickIntervalMs: dotTemplate.tickIntervalMs,
                            damagePerTick: Math.max(1, Math.round(damagePerTick)),
                            sourceCasterId: this.id,
                            lastTickTime: Date.now()
                        }
                    },
                    appliedAt: Date.now(),
                    isBuff: false,
                    sourceEntityId: this.id,
                    maxStacks: debuffTemplate.maxStacks
                };
    
                target.applyDebuff(poisonDebuffData);
    
                const poisonDebuff = target.activeDebuffs.find(d => d.abilityId === debuffTemplate.id);
                if (poisonDebuff && poisonDebuff.stacks === debuffTemplate.maxStacks) {
                    target.removeDebuff(debuffTemplate.id);
    
                    const stunTemplate = props.stunAtMaxStacks;
                    target.applyDebuff({
                        id: `${stunTemplate.id}_${target.id}_${Date.now()}`,
                        abilityId: stunTemplate.id,
                        name: stunTemplate.name,
                        icon: stunTemplate.icon,
                        durationMs: stunTemplate.durationMs,
                        remainingMs: stunTemplate.durationMs,
                        effects: { ...stunTemplate.effects },
                        appliedAt: Date.now(),
                        isBuff: false,
                        sourceEntityId: this.id,
                    });
                    
                    results.push({ newVfx: { type: 'STUN', target: target, duration: stunTemplate.durationMs } });
                }
            }

            // Venomous Serpent Passive
            if (props.onHitConditional) {
                const conditionalProps = props.onHitConditional;
                if (target.activeDebuffs.some(d => d.abilityId === conditionalProps.requiredDebuffId)) {
                    if (conditionalProps.applyDebuff) {
                        const debuffTemplate = conditionalProps.applyDebuff;
                        const dotTemplate = debuffTemplate.effects.dot;
                        const damagePerTick = target.maxHp * (dotTemplate.damagePercentOfTargetMaxHp / 100);
    
                        target.applyDebuff({
                            id: `${debuffTemplate.id}_${target.id}_${Date.now()}`,
                            abilityId: debuffTemplate.id,
                            name: debuffTemplate.name,
                            icon: debuffTemplate.icon,
                            durationMs: debuffTemplate.durationMs,
                            remainingMs: debuffTemplate.durationMs,
                            effects: {
                                dot: {
                                    tickIntervalMs: dotTemplate.tickIntervalMs,
                                    damagePerTick: Math.max(1, Math.round(damagePerTick)),
                                    sourceCasterId: this.id,
                                    lastTickTime: Date.now()
                                }
                            },
                            appliedAt: Date.now(),
                            isBuff: false,
                            sourceEntityId: this.id,
                        });
                    }
                }
            }
        }
    
        return results;
    }
    
    private emergeFromSand(allHeroes: CombatCapable[], results: UpdateResult[]): void {
        if (!this.submergedProps) return; 
    
        this.isSubmerged = false;
        this.isUntargetable = false;
        this.subterraneanPhase = 'none';
    
        const chargeProps = this.submergedProps.chargePhase;
    
        results.push({ newVfx: { type: 'SCORPION_EMERGE', x: this.x, y: this.y, radius: chargeProps.emergenceRadius } });
    
        const damage = this.effectiveDamage * chargeProps.emergenceDamageMultiplier;
        const livingHeroes = allHeroes.filter(h => h.isAlive);
        const debuffTemplate = chargeProps.emergenceDebuff;
    
        for (const hero of livingHeroes) {
            if (distanceToTarget(this, hero) <= chargeProps.emergenceRadius) {
                const oldHp = hero.currentHp;
                const dmgTaken = hero.takeDamage(damage, false, this);
    
                if (this.isPlayer || hero.isPlayer) {
                    if (typeof dmgTaken === 'number') {
                        results.push({ newDamageNumber: new DamageNumber(dmgTaken, hero.x, hero.y, 'white') });
                    }
                }
                if (hero.currentHp <= 0 && oldHp > 0) {
                     results.push({ newEffect: new DeathEffect(hero.x, hero.y, '#FFEB3B', 20, 40) });
                }
    
                if (debuffTemplate) {
                    hero.applyDebuff({
                        id: `${debuffTemplate.id}_${hero.id}_${Date.now()}`,
                        abilityId: debuffTemplate.id,
                        name: debuffTemplate.name,
                        icon: debuffTemplate.icon,
                        durationMs: debuffTemplate.durationMs,
                        remainingMs: debuffTemplate.durationMs,
                        effects: { ...debuffTemplate.effects },
                        appliedAt: Date.now(),
                        isBuff: false,
                        sourceEntityId: this.id
                    });
                }
            }
        }
        
        this.submergedDestination = null;
        this.submergedHitHeroes = new Set();
        this.submergedProps = null;
    }

    public useAbility(ability: Ability, allHeroes: CombatCapable[], allEnemies: CombatCapable[], dispatcher: EventDispatcher): UpdateResult[] {
        const results: UpdateResult[] = [];
        if (!ability.properties) return results;
    
        switch (ability.id) {
            case 'BOSS_SERPENTE_CUSPE_VENENOSO': {
                const props = ability.properties;
                if (!props) return [];
            
                const livingHeroes = allHeroes.filter(h => h.isAlive);
                if (livingHeroes.length === 0) return [];
            
                let targetPoint: Point;
            
                if (Math.random() < 0.5) {
                    // Target most distant hero
                    const mostDistantHero = [...livingHeroes].sort((a, b) => distanceToTarget(this, b) - distanceToTarget(this, a))[0];
                    targetPoint = { x: mostDistantHero.x, y: mostDistantHero.y };
                } else {
                    // Target area with most heroes (approximated by centroid)
                    const centroid = livingHeroes.reduce((acc, h) => ({ x: acc.x + h.x, y: acc.y + h.y }), { x: 0, y: 0 });
                    centroid.x /= livingHeroes.length;
                    centroid.y /= livingHeroes.length;
                    targetPoint = centroid;
                }
            
                const distance = distanceToTarget(this, targetPoint);
                const travelTime = (distance / props.projectileSpeed) * (1000 / 60); // Speed is in pixels per frame
            
                // Create a visual-only projectile
                const dummyTarget = { x: targetPoint.x, y: targetPoint.y, id: -1 } as any;
                const projectile = new Projectile(this.x, this.y, this, dummyTarget, 0, false, {
                    speed: props.projectileSpeed,
                    size: 15,
                    displayType: 'skull_orb',
                    color: '#4CAF50', // Green
                    lifetimeMs: travelTime + 100,
                    isVisualOnly: true,
                });
                results.push({ newProjectile: projectile });
            
                dispatcher.addDelayedAction(travelTime, () => {
                    const actionResults: UpdateResult[] = [];
                    const newArea: ActiveArea = {
                        id: getEntityId(),
                        casterId: this.id,
                        x: targetPoint.x,
                        y: targetPoint.y,
                        radius: props.puddleRadius,
                        remainingMs: props.puddleDurationMs,
                        damageProperties: {
                            tickIntervalMs: props.tickIntervalMs,
                        },
                        debuffTemplate: props.debuff,
                        lastDamageTickTime: Date.now(),
                    };
                    
                    actionResults.push({ newActiveArea: newArea });
                    actionResults.push({ newVfx: { type: 'VENOM_PUDDLE', x: newArea.x, y: newArea.y, radius: newArea.radius, duration: newArea.remainingMs } });
                    
                    return actionResults;
                });
            
                return results;
            }

            case 'BOSS_GORILA_SALTO_GIGANTE': {
                const props = ability.properties;
                const livingHeroes = allHeroes.filter(h => h.isAlive);
                if (livingHeroes.length === 0) {
                    return []; // No targets, do nothing.
                }
        
                // Find best landing spot
                let bestTargetPoint = { x: livingHeroes[0].x, y: livingHeroes[0].y };
                let maxHeroesInRadius = 0;
        
                for (const hero of livingHeroes) {
                    let heroesInRadius = 0;
                    for (const otherHero of livingHeroes) {
                        if (distanceToTarget(hero, otherHero) <= props.radius) {
                            heroesInRadius++;
                        }
                    }
                    if (heroesInRadius > maxHeroesInRadius) {
                        maxHeroesInRadius = heroesInRadius;
                        bestTargetPoint = { x: hero.x, y: hero.y };
                    }
                }
                
                this.isJumping = true;
                this.isUntargetable = true;
                
                // Return an indicator for the game container to draw
                results.push({
                    newAreaIndicator: {
                        x: bestTargetPoint.x,
                        y: bestTargetPoint.y,
                        radius: props.radius,
                        remainingMs: props.jumpDurationMs,
                        initialMs: props.jumpDurationMs
                    }
                });
                
                dispatcher.addDelayedAction(props.jumpDurationMs, () => {
                    this.isJumping = false;
                    this.isUntargetable = false;
                    this.x = bestTargetPoint.x;
                    this.y = bestTargetPoint.y;
                    
                    const totalDamage = this.combatStats.effectiveDamage * (1 + props.damageMultiplier);
                    const actionResults: UpdateResult[] = [];
                    
                    const heroesToDamage = allHeroes;
                    heroesToDamage.forEach(hero => {
                        if (hero.isAlive && distanceToTarget(this, hero) <= props.radius) {
                            const oldHeroHp = hero.currentHp;
                            const dmgTaken = hero.takeDamage(totalDamage, false, this);
                            
                            dispatcher.dispatchEvent('DAMAGE_TAKEN', { target: hero, attacker: this, amount: typeof dmgTaken === 'number' ? dmgTaken : 0, result: typeof dmgTaken === 'number' ? 'hit' : dmgTaken, isCrit: false, abilityId: ability.id });
                            if (typeof dmgTaken === 'number') {
                                 dispatcher.dispatchEvent('DAMAGE_DEALT', { attacker: this, target: hero, amount: dmgTaken, isCrit: false, abilityId: ability.id });
                            }
    
                            if (this.isPlayer || hero.isPlayer) {
                                if (typeof dmgTaken === 'number') {
                                    actionResults.push({ newDamageNumber: new DamageNumber(dmgTaken, hero.x, hero.y, 'white') });
                                } else if (dmgTaken === 'esquiva') {
                                    actionResults.push({ newDamageNumber: new DamageNumber("Esquiva!", hero.x, hero.y, 'white') });
                                }
                            }
                            
                            if (hero.currentHp <= 0 && oldHeroHp > 0 && !hero.deathEffectCreated) {
                                actionResults.push({ newEffect: new DeathEffect(hero.x, hero.y, '#FFEB3B', 20, 40) });
                                hero.deathEffectCreated = true;
                                dispatcher.dispatchEvent('ENTITY_DIED', { victim: hero, killer: this });
                            }
    
                            if (props.stunDurationMs) {
                                hero.applyDebuff({
                                    id: `stun_${hero.id}_giantLeap`, abilityId: 'BOSS_GORILA_SALTO_GIGANTE_STUN', name: 'Atordoado',
                                    icon: '💫', durationMs: props.stunDurationMs, remainingMs: props.stunDurationMs,
                                    effects: { isImmobile: true }, appliedAt: Date.now(), isBuff: false, sourceEntityId: this.id,
                                });
                                actionResults.push({ newVfx: { type: 'STUN', target: hero, duration: props.stunDurationMs } });
                            }
                        }
                    });
                    
                    actionResults.push({ newVfx: { type: 'GORILLA_STOMP', x: this.x, y: this.y, radius: props.radius } });
    
                    return actionResults;
                });
        
            }
            break;
            case 'BOSS_GORILA_MACHO_ALFA': {
                const props = ability.properties;
                if (!props || !props.channelBuff || !props.finalBuff) return [];
        
                const channelBuffTemplate = props.channelBuff;
                const finalBuffTemplate = props.finalBuff;
        
                this.isChanneling = true;
                
                this.applyBuff({
                    id: channelBuffTemplate.id,
                    abilityId: channelBuffTemplate.id,
                    name: channelBuffTemplate.name,
                    icon: channelBuffTemplate.icon,
                    durationMs: channelBuffTemplate.durationMs,
                    remainingMs: channelBuffTemplate.durationMs,
                    effects: { ...channelBuffTemplate.effects },
                    appliedAt: Date.now(),
                    isBuff: true,
                    sourceEntityId: this.id,
                });
        
                results.push({ newVfx: { type: 'MACHO_ALFA_CHANNEL', target: this, duration: props.channelDurationMs } });
        
                dispatcher.addDelayedAction(props.channelDurationMs, () => {
                    if (!this.isAlive) {
                        this.isChanneling = false;
                        return [];
                    }
    
                    this.isChanneling = false;
                    this.activeBuffs = this.activeBuffs.filter(b => b.id !== channelBuffTemplate.id);
                    this.recalculateStats();
    
                    this.applyBuff({
                        id: finalBuffTemplate.id,
                        abilityId: finalBuffTemplate.id,
                        name: finalBuffTemplate.name,
                        icon: finalBuffTemplate.icon,
                        durationMs: finalBuffTemplate.durationMs,
                        remainingMs: finalBuffTemplate.durationMs,
                        effects: { ...finalBuffTemplate.effects },
                        appliedAt: Date.now(),
                        isBuff: true,
                        sourceEntityId: this.id,
                    });
    
                    return [{ newVfx: { type: 'POWER_UP', target: this, color: '#FF4500' } }];
                });
        
            }
            break;
            case 'BOSS_ESCORPIAO_TERROR_SUBTERRANEO': {
                const props = ability.properties;
                if (!props) return [];
    
                this.isChanneling = true;
                this.applyBuff({
                    id: props.channelBuff.id,
                    abilityId: props.channelBuff.id,
                    name: props.channelBuff.name,
                    icon: props.channelBuff.icon,
                    durationMs: props.channelDurationMs,
                    remainingMs: props.channelDurationMs,
                    effects: { ...props.channelBuff.effects },
                    appliedAt: Date.now(),
                    isBuff: true,
                    sourceEntityId: this.id,
                });
    
                results.push({ newVfx: { type: 'SCORPION_DIG', target: this, duration: props.channelDurationMs } });
    
                dispatcher.addDelayedAction(props.channelDurationMs, () => {
                    if (!this.isAlive) {
                        this.isChanneling = false;
                        return [];
                    }
                    this.isChanneling = false;
                    this.isSubmerged = true;
                    this.isUntargetable = true;
                    
                    this.subterraneanPhase = 'retreating';
                    this.submergedProps = props;
                    this.retreatTimer = props.retreatPhase.durationMs;
    
                    const livingHeroes = allHeroes.filter(h => h.isAlive);
                    if (livingHeroes.length > 0) {
                        const centroid = livingHeroes.reduce((acc, h) => ({ x: acc.x + h.x, y: acc.y + h.y }), { x: 0, y: 0 });
                        centroid.x /= livingHeroes.length;
                        centroid.y /= livingHeroes.length;
    
                        const angleAway = Math.atan2(this.y - centroid.y, this.x - centroid.x);
                        this.retreatDestination = {
                            x: this.x + Math.cos(angleAway) * props.retreatPhase.retreatDistance,
                            y: this.y + Math.sin(angleAway) * props.retreatPhase.retreatDistance
                        };
                    } else {
                        this.retreatDestination = { x: this.x + (Math.random() - 0.5) * 400, y: this.y + (Math.random() - 0.5) * 400 };
                    }
    
                    return [];
                });
            }
            break;
        }
        return results;
    }

    agroAllies(enemies: CombatCapable[]) {
         enemies.forEach(ally => {
            if (ally instanceof EnemyEntity && ally !== this && ally.isAlive && !ally.isAgro) {
                const distance = distanceToTarget(this, ally);
                if(distance < this.aggroRadius * 1.5 ){ 
                    ally.isAgro = true;
                }
            }
         });
    }

    public findTarget(potentialTargets: CombatCapable[]): void {
        const tauntDebuff = this.activeDebuffs.find(d => d.effects.isTaunted);
        if (tauntDebuff && tauntDebuff.sourceEntityId !== undefined) {
            const taunter = potentialTargets.find(t => t.id === tauntDebuff.sourceEntityId);
            if(taunter && taunter.isAlive && !(taunter as Character).isUntargetable) {
                this.target = taunter;
                return;
            }
        }
    
        if (this.target && this.target.isAlive && !(this.target as Character).isUntargetable && !this.target.activeBuffs.some(b => b.effects.isInvisible) && distanceToTarget(this, this.target) <= this.range * 1.5) {
            const currentTargetDistance = distanceToTarget(this, this.target);
            if(currentTargetDistance <= this.range * 1.2) return;
        }
    
        let closestTarget: CombatCapable | null = null;
        let minDistance = Infinity;
    
        const livingTargets = potentialTargets.filter(t => t.isAlive && !(t as Character).isUntargetable && !t.activeBuffs.some(b => b.effects.isInvisible));
        
        // Find the closest target among all living heroes and allies
        for (const target of livingTargets) {
            const distance = distanceToTarget(this, target);
            if (distance < minDistance) {
                minDistance = distance;
                closestTarget = target;
            }
        }
        this.target = closestTarget;
    }

    update(deltaTime: number, heroes: CombatCapable[], enemies: CombatCapable[], canvasSize: { width: number; height: number; }): { results: UpdateResult[], abilityToTrigger?: string } {
        const oldX = this.x;
        const oldY = this.y;

        const baseUpdate = super.update(deltaTime, heroes, enemies, canvasSize); 
        let abilityToTrigger = baseUpdate.abilityToTrigger;
        const results = baseUpdate.results;
        if (!this.isAlive) {
            this.updateWalkAnimation(deltaTime, false);
            return baseUpdate;
        }

        if (this.isSubmerged) {
            if (this.subterraneanPhase === 'retreating') {
                this.retreatTimer -= deltaTime;
                if (!this.retreatDestination || this.retreatTimer <= 0 || distanceToTarget(this, this.retreatDestination) < this.movementSpeed) {
                    this.subterraneanPhase = 'charging';
                    const livingHeroes = heroes.filter(h => h.isAlive);
                    if (livingHeroes.length === 0) {
                        this.emergeFromSand(heroes, results);
                    } else {
                        const centroid = livingHeroes.reduce((acc, h) => ({ x: acc.x + h.x, y: acc.y + h.y }), { x: 0, y: 0 });
                        centroid.x /= livingHeroes.length;
                        centroid.y /= livingHeroes.length;
                        this.submergedDestination = centroid;
                    }
                } else {
                    const speed = this.movementSpeed * (this.submergedProps?.retreatPhase?.speedMultiplier || 1);
                    const angle = Math.atan2(this.retreatDestination.y - this.y, this.retreatDestination.x - this.x);
                    const nextX = this.x + Math.cos(angle) * speed;
                    const nextY = this.y + Math.sin(angle) * speed;
                    this.x = Math.max(this.size, Math.min(canvasSize.width - this.size, nextX));
                    this.y = Math.max(this.size, Math.min(canvasSize.height - this.size, nextY));
                }
            } else if (this.subterraneanPhase === 'charging') {
                if (!this.submergedDestination || !this.submergedProps) {
                    this.emergeFromSand(heroes, results);
                    return { results, abilityToTrigger };
                }
                const chargeProps = this.submergedProps.chargePhase;
                const distToDest = distanceToTarget(this, this.submergedDestination);
                const speed = this.movementSpeed * chargeProps.speedMultiplier;
                if (distToDest < speed) {
                    this.x = this.submergedDestination.x;
                    this.y = this.submergedDestination.y;
                    this.emergeFromSand(heroes, results);
                } else {
                    const angle = Math.atan2(this.submergedDestination.y - this.y, this.submergedDestination.x - this.x);
                    const nextX = this.x + Math.cos(angle) * speed;
                    const nextY = this.y + Math.sin(angle) * speed;
                    this.x = Math.max(this.size, Math.min(canvasSize.width - this.size, nextX));
                    this.y = Math.max(this.size, Math.min(canvasSize.height - this.size, nextY));

                    for (const hero of heroes) {
                        if (hero.isAlive && !this.submergedHitHeroes.has(hero.id)) {
                            const distToHero = distanceToTarget(this, hero);
                            if (distToHero < (this.size / 2 + hero.size / 2)) {
                                this.submergedHitHeroes.add(hero.id);
                                hero.applyDebuff({
                                    id: `stun_scorpion_${hero.id}`, abilityId: 'BOSS_ESCORPIAO_TERROR_SUBTERRANEO_STUN', name: 'Atordoado',
                                    icon: '💫', durationMs: chargeProps.collisionStunMs, remainingMs: chargeProps.collisionStunMs,
                                    effects: { isImmobile: true }, appliedAt: Date.now(), isBuff: false, sourceEntityId: this.id,
                                });
                                results.push({ newVfx: { type: 'STUN', target: hero, duration: chargeProps.collisionStunMs } });
                                const knockbackAngle = Math.atan2(hero.y - this.y, hero.x - this.x);
                                hero.x += Math.cos(knockbackAngle) * chargeProps.knockbackDistance;
                                hero.y += Math.sin(knockbackAngle) * chargeProps.knockbackDistance;
                            }
                        }
                    }
                }
            }
            return { results, abilityToTrigger };
        }

        if (this.isJumping || this.isChanneling) {
            this.updateWalkAnimation(deltaTime, false);
            return { results: [], abilityToTrigger: undefined };
        }

        if (!this.isAgro) {
            for (const hero of heroes) {
                if (hero.isAlive) {
                    const distToHero = distanceToTarget(this, hero);
                    if (distToHero < this.aggroRadius) {
                        this.isAgro = true;
                        this.agroAllies(enemies); 
                        break; 
                    }
                }
            }
        }

        if (this.isAgro) {
            this.findTarget(heroes); // Find a target from the heroes/allies array

            if (this.target && this.target.isAlive) {
                let targetX = this.target.x;
                let targetY = this.target.y;

                if (this.isProbingUnstuck && this.probeFrameCounter > 0) {
                    const angleToOriginalTarget = Math.atan2(this.target.y - this.y, this.target.x - this.x);
                    const probeAngle = angleToOriginalTarget + this.probeAngleOffset;
                    targetX = this.x + Math.cos(probeAngle) * (this.range * 2);
                    targetY = this.y + Math.sin(probeAngle) * (this.range * 2);
                }

                const dist = distanceToTarget(this, this.target);

                if (dist > this.range || (this.isProbingUnstuck && this.probeFrameCounter > 0)) {
                    this.updateMovement(targetX, targetY, canvasSize.width, canvasSize.height);
                } else {
                    this.isProbingUnstuck = false; 
                    this.probeFrameCounter = 0;
                    this.stuckFrameCounter = 0;

                    const attackResult = this.attack();
                     if (attackResult) {
                        if (attackResult.projectile) {
                            results.push({ newProjectile: attackResult.projectile });
                        } else if (this.target) { // Melee attack
                            const oldTargetHp = this.target.currentHp;
                            const dmgTaken = this.target.takeDamage(attackResult.damageDealt, attackResult.isCrit, this);
                            
                            // Dispatch DAMAGE_TAKEN event immediately
                            results.push({
                                eventToDispatch: {
                                    type: 'DAMAGE_TAKEN',
                                    payload: { target: this.target, attacker: this, amount: typeof dmgTaken === 'number' ? dmgTaken : 0, result: typeof dmgTaken === 'number' ? 'hit' : dmgTaken, isCrit: attackResult.isCrit, isBasicAttack: true }
                                }
                            });

                            if (typeof dmgTaken === 'number') {
                                results.push({
                                    eventToDispatch: {
                                        type: 'DAMAGE_DEALT',
                                        payload: { attacker: this, target: this.target, amount: dmgTaken, isCrit: attackResult.isCrit, isBasicAttack: true }
                                    }
                                });
                                const afterDamageResults = this.afterDealingDamage(dmgTaken, this.target, heroes);
                                results.push(...afterDamageResults);
                            }

                            let result: UpdateResult = {};
                            if (this.isPlayer || this.target.isPlayer) {
                                if (typeof dmgTaken === 'number') {
                                    if (dmgTaken > 0) {
                                        result.newDamageNumber = new DamageNumber(dmgTaken, this.target.x, this.target.y, attackResult.isCrit ? 'red' : 'white');
                                    }
                                } else if (dmgTaken === 'esquiva') {
                                    result.newDamageNumber = new DamageNumber("Esquiva!", this.target.x, this.target.y, 'white');
                                }
                            }
                            
                            if (this.target.currentHp <= 0 && oldTargetHp > 0 && !this.target.deathEffectCreated) {
                                const targetChar = this.target as Character;
                                result.newEffect = new DeathEffect(targetChar.x, targetChar.y, targetChar.combatStats.isBoss ? '#C62828' : '#757575', targetChar.combatStats.isBoss ? 35 : 15, targetChar.combatStats.isBoss ? 60 : 30);
                                targetChar.deathEffectCreated = true;
                            }
                            if (result.newDamageNumber || result.newEffect) {
                                results.push(result);
                            }
                        }
                    }
                }
            }
        }

        if (this.isBoss && this.abilities.length > 0) {
            const livingHeroes = heroes.filter(h => h.isAlive);
            if (livingHeroes.length > 0) {
                const usableAbilities = this.abilities.filter(ab => (this.abilityCooldowns[ab.id] || 0) <= 0);
                if (usableAbilities.length > 0) {
                    if (Math.random() < 0.02) {
                        const abilityToUse = usableAbilities[Math.floor(Math.random() * usableAbilities.length)];
                        
                        if (abilityToUse.id === 'BOSS_GORILA_SALTO_GIGANTE' && livingHeroes.length < 2) {
                        } else {
                            abilityToTrigger = abilityToUse.id;
                        }
                    }
                }
            }
        }

        const didMove = this.x !== oldX || this.y !== oldY;
        this.updateWalkAnimation(deltaTime, didMove);
        return { results, abilityToTrigger };
    }

    draw(ctx: CanvasRenderingContext2D, isPreview: boolean = false, isDragged: boolean = false) { // Added isDragged
        if (this.isSubmerged) {
            ctx.save();
            const pulse = 1 + Math.sin(Date.now() * 0.01) * 0.2;
            const radius = this.size * 1.5 * pulse;
            const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, radius);
            gradient.addColorStop(0, 'rgba(210, 180, 140, 0.6)'); // Tan
            gradient.addColorStop(1, 'rgba(210, 180, 140, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            return;
        }
        if (this.isJumping) return;
        if (!this.isAlive) return;
        ctx.save();
        
        const lunge = Math.sin(this.attackAnimProgress * Math.PI) * 5; 
        const direction = this.target ? Math.sign(this.target.x - this.x) : 1;
        const tiltAngle = this.walkCycle === 0 ? 0 : Math.sin(this.walkCycle) * (Math.PI / 32);

        ctx.translate(this.x + (lunge * direction), this.y);
        ctx.rotate(tiltAngle);

        ctx.font = `${this.size * 1.5}px sans-serif`; 
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.emoji, 0, 0);
        
        ctx.restore();
        super.draw(ctx, isPreview, isDragged); // Call Character's draw for health bar and buff icons
    }
}
