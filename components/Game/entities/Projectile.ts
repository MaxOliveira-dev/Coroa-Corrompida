import type { CombatCapable, GameEvent, UpdateResult } from '../entityInterfaces';
import { DamageNumber } from './DamageNumber'; 
import { DeathEffect } from './DeathEffect';   
import { getEntityId, distanceToTarget } from '../entityUtils';
import { Character } from './Character'; 
import type { ActiveBuffDebuffEffect, ActiveBuffDebuff } from '../../../types';
import { VisualEffectsManager } from '../VisualEffectsManager';
import { drawArrow, drawMagicOrb, drawSkullOrb } from '../drawingUtils';
import { showFireballExplosion, showExplosaoMagicaHit } from '../vfx/mageVfx';

interface ProjectileOptions {
    color?: string;
    size?: number;
    speed?: number;
    piercing?: boolean;
    lifetimeMs?: number;
    debuffToApply?: any; // Can be complex, from ability properties
    sourceAbilityProperties?: Record<string, any>;
    splashConfig?: ActiveBuffDebuffEffect['nextAttackSplash'];
    displayType?: 'circle' | 'arrow' | 'magic_orb' | 'skull_orb';
    trailType?: 'glitter' | 'fire' | 'magic_dust';
    isVisualOnly?: boolean;
}

interface ProjectileUpdateResult {
    newDamageNumbers?: DamageNumber[];
    newEffects?: DeathEffect[];
    eventsToDispatch?: GameEvent[];
}

export class Projectile {
    id: number;
    x: number;
    y: number;
    attacker: CombatCapable;
    target: CombatCapable;
    damage: number;
    isCrit: boolean;
    
    // Options
    color: string;
    speed: number;
    size: number;   
    piercing: boolean;
    lifetimeMs: number;
    debuffToApply?: ProjectileOptions['debuffToApply'];
    sourceAbilityProperties?: Record<string, any>;
    splashConfig?: ActiveBuffDebuffEffect['nextAttackSplash'];
    hitTargetIds: number[] = [];
    displayType: 'circle' | 'arrow' | 'magic_orb' | 'skull_orb';
    angle: number = 0;
    trailType?: 'glitter' | 'fire' | 'magic_dust';
    isVisualOnly: boolean;


    constructor(x: number, y: number, attacker: CombatCapable, target: CombatCapable, damage: number, isCrit: boolean, options: ProjectileOptions = {}) {
        this.id = getEntityId();
        this.x = x;
        this.y = y;
        this.attacker = attacker;
        this.target = target;
        this.damage = damage;
        this.isCrit = isCrit;

        this.color = options.color || 'white';
        this.size = options.size || 6;
        this.speed = options.speed || 10;
        this.piercing = options.piercing || false;
        this.lifetimeMs = options.lifetimeMs || 2000;
        this.debuffToApply = options.debuffToApply;
        this.sourceAbilityProperties = options.sourceAbilityProperties;
        this.splashConfig = options.splashConfig;
        this.displayType = options.displayType || 'circle';
        this.angle = Math.atan2(target.y - y, target.x - x);
        this.trailType = options.trailType;
        this.isVisualOnly = options.isVisualOnly || false;
    }

    private onHit(target: CombatCapable, allTargets: CombatCapable[], vfxManager?: VisualEffectsManager | null): ProjectileUpdateResult {
        if (this.hitTargetIds.includes(target.id)) return {};
        this.hitTargetIds.push(target.id);

        const newDamageNumbers: DamageNumber[] = [];
        const newEffects: DeathEffect[] = [];
        const eventsToDispatch: GameEvent[] = [];

        if (this.debuffToApply?.id === 'DEBUFF_QUEIMADURA' && vfxManager) {
            showFireballExplosion(vfxManager, target.x, target.y, target.size * 1.5);
        }

        let finalDamage = this.damage;

        if (this.sourceAbilityProperties?.bonusDamagePercentTargetMaxHp) {
            const bonusDmg = target.maxHp * (this.sourceAbilityProperties.bonusDamagePercentTargetMaxHp / 100);
            finalDamage += bonusDmg;
        }

        const oldHp = target.currentHp;
        const dmgTaken = target.takeDamage(finalDamage, this.isCrit, this.attacker);

        // Dispatch DAMAGE_TAKEN event immediately
        eventsToDispatch.push({
            type: 'DAMAGE_TAKEN',
            payload: { target, attacker: this.attacker, amount: typeof dmgTaken === 'number' ? dmgTaken : 0, result: typeof dmgTaken === 'number' ? 'hit' : dmgTaken, isCrit: this.isCrit, isBasicAttack: true }
        });

        if (typeof dmgTaken === 'number') {
            eventsToDispatch.push({
                type: 'DAMAGE_DEALT',
                payload: { attacker: this.attacker, target: target, amount: dmgTaken, isCrit: this.isCrit, isBasicAttack: true }
            });

            if ((this.attacker as Character).isPlayer || (target as Character).isPlayer) {
                newDamageNumbers.push(new DamageNumber(dmgTaken, target.x, target.y, this.isCrit ? 'red' : 'white'));
            }

            const afterDamageResults = (this.attacker as Character).afterDealingDamage(dmgTaken, target, allTargets);
            afterDamageResults.forEach(res => {
                if (res.newDamageNumber) newDamageNumbers.push(res.newDamageNumber);
                if (res.newEffect) newEffects.push(res.newEffect);
            });
        } else if (dmgTaken === 'esquiva') {
            if ((this.attacker as Character).isPlayer || (target as Character).isPlayer) {
                newDamageNumbers.push(new DamageNumber("Esquiva!", target.x, target.y, 'white'));
            }
        }
        
        if (target.currentHp <= 0 && oldHp > 0) {
            newEffects.push(new DeathEffect(target.x, target.y, '#757575'));
        }

        if (this.debuffToApply) {
            let finalDebuff = { ...this.debuffToApply };

            if (this.debuffToApply.effects?.dot) {
                const dotTemplate = this.debuffToApply.effects.dot;
                const casterDamage = this.attacker.effectiveDamage || 0;
                const targetMaxHp = target.maxHp || 0;
                const damagePerTick = (casterDamage * (dotTemplate.damagePercentOfCasterDamage / 100)) + (targetMaxHp * (dotTemplate.damagePercentOfTargetMaxHp / 100));

                finalDebuff.effects.dot = {
                    ...dotTemplate,
                    damagePerTick: Math.max(1, Math.round(damagePerTick)),
                    sourceCasterId: this.attacker.id
                };
            }
            target.applyDebuff({
                ...finalDebuff,
                id: `${finalDebuff.id}_${target.id}`,
                abilityId: this.debuffToApply.id, // Set abilityId from the template's id
                sourceEntityId: this.attacker.id,
                targetEntityId: target.id,
                remainingMs: finalDebuff.durationMs,
                appliedAt: Date.now(),
                isBuff: false
            });
        }
        
        if (this.splashConfig) {
            // Find all splash targets, EXCLUDING the main target, for damage application
            const secondarySplashTargets = allTargets.filter(e => e.isAlive && e.id !== target.id && distanceToTarget(target, e) <= this.splashConfig!.radius);
            
            if (vfxManager) {
                showExplosaoMagicaHit(vfxManager, target.x, target.y, this.splashConfig.radius);
            }

            // Apply splash DAMAGE to secondary targets
            secondarySplashTargets.forEach(splashTarget => {
                const splashDamage = finalDamage * (this.splashConfig?.damageMultiplier || 1.0);
                const splashOldHp = splashTarget.currentHp;
                const splashDmgTaken = splashTarget.takeDamage(splashDamage, this.isCrit, this.attacker);

                if (typeof splashDmgTaken === 'number') {
                    if ((this.attacker as Character).isPlayer || (splashTarget as Character).isPlayer) {
                         newDamageNumbers.push(new DamageNumber(splashDmgTaken, splashTarget.x, splashTarget.y, this.isCrit ? 'red' : 'white'));
                    }
                    const afterDamageResults = (this.attacker as Character).afterDealingDamage(splashDmgTaken, splashTarget, allTargets);
                    afterDamageResults.forEach(res => {
                        if (res.newDamageNumber) newDamageNumbers.push(res.newDamageNumber);
                        if (res.newEffect) newEffects.push(res.newEffect);
                    });
                }
                
                if (splashTarget.currentHp <= 0 && splashOldHp > 0) {
                    newEffects.push(new DeathEffect(splashTarget.x, splashTarget.y, '#757575'));
                }
            });

            // Apply/Refresh debuff on ALL targets within the splash radius (including main target)
            if (this.splashConfig?.spreadsDebuffId) {
                const debuffToSpreadTemplate = target.activeDebuffs.find(d => d.abilityId === this.splashConfig!.spreadsDebuffId);
                if (debuffToSpreadTemplate) {
                    // Include the main target for the debuff refresh
                    const allSplashEntities = [target, ...secondarySplashTargets]; 
                    
                    allSplashEntities.forEach(entityToDebuff => {
                        // Create a fresh copy to ensure durations and IDs are correct per target
                        const newDebuffInstance = JSON.parse(JSON.stringify(debuffToSpreadTemplate));
                        newDebuffInstance.id = `${debuffToSpreadTemplate.id}_${entityToDebuff.id}`;
                        newDebuffInstance.targetEntityId = entityToDebuff.id;
                        newDebuffInstance.appliedAt = Date.now();
                        newDebuffInstance.remainingMs = debuffToSpreadTemplate.durationMs; // Ensure full duration for refresh
                        entityToDebuff.applyDebuff(newDebuffInstance);
                    });
                }
            }
        }

        return { newDamageNumbers, newEffects, eventsToDispatch };
    }

    update(deltaTime: number, potentialTargets: CombatCapable[], vfxManager?: VisualEffectsManager | null): ProjectileUpdateResult { 
        this.lifetimeMs -= deltaTime;
        if (this.lifetimeMs <= 0) {
            if (!this.piercing) this.hitTargetIds.push(-1); // Mark as "dead"
            return {};
        }

        let combinedResult: ProjectileUpdateResult = { newDamageNumbers: [], newEffects: [], eventsToDispatch: [] };

        if (this.trailType === 'glitter') {
            combinedResult.newEffects?.push(new DeathEffect(this.x, this.y, '#FFD700', 1, 20, 'trail'));
        }

        if (this.trailType === 'fire') {
            // Create fire particles on most frames to form a trail
            if (Math.random() > 0.3) {
                const fireColors = ['#FF4500', '#FFA500', '#FFD700']; // OrangeRed, Orange, Gold
                const randomColor = fireColors[Math.floor(Math.random() * fireColors.length)];
                combinedResult.newEffects?.push(new DeathEffect(this.x, this.y, randomColor, 2, 30, 'trail'));
            }
        }
        
        if (this.trailType === 'magic_dust') {
            combinedResult.newEffects?.push(new DeathEffect(this.x, this.y, '#E0DDEF', 1, 30, 'trail'));
        }

        if (this.isVisualOnly) {
            // Just move and return, no collision
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            this.angle = Math.atan2(dy, dx);
            const distance = Math.hypot(dx, dy);
    
            if (distance > this.speed) {
                this.x += (dx / distance) * this.speed;
                this.y += (dy / distance) * this.speed;
            } else {
                this.x = this.target.x;
                this.y = this.target.y;
                this.lifetimeMs = 0; // Arrived
            }
    
            return combinedResult;
        }

        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        this.angle = Math.atan2(dy, dx);
        const distance = Math.hypot(dx, dy);

        if (distance > this.speed) {
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
        } else {
            this.x = this.target.x;
            this.y = this.target.y;
            if (!this.piercing) {
                this.lifetimeMs = 0; // It will be removed next frame
            }
        }
        
        for (const pt of potentialTargets) {
            if (pt.id === this.attacker.id) {
                continue;
            }
            if (pt.isAlive && !this.hitTargetIds.includes(pt.id)) {
                const distToTarget = Math.hypot(this.x - pt.x, this.y - pt.y);
                if (distToTarget < (this.size + pt.size / 2)) {
                    const hitResult = this.onHit(pt, potentialTargets, vfxManager);
                    if (hitResult.newDamageNumbers) combinedResult.newDamageNumbers?.push(...hitResult.newDamageNumbers);
                    if (hitResult.newEffects) combinedResult.newEffects?.push(...hitResult.newEffects);
                    if (hitResult.eventsToDispatch) combinedResult.eventsToDispatch?.push(...hitResult.eventsToDispatch);
                }
            }
        }
        return combinedResult;
    }

    draw(ctx: CanvasRenderingContext2D) {
        switch (this.displayType) {
            case 'arrow':
                drawArrow(ctx, this.x, this.y, this.size, this.angle, '#A1887F');
                break;
            case 'magic_orb':
                drawMagicOrb(ctx, this.x, this.y, this.size, this.color);
                break;
            case 'skull_orb':
                drawSkullOrb(ctx, this.x, this.y, this.size, this.color);
                break;
            case 'circle':
            default:
                ctx.save();
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                break;
        }
    }
}