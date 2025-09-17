import { Character } from './Character';
import type { HeroEntity } from './HeroEntity';
import type { CombatCapable, UpdateResult } from '../entityInterfaces';
import { Projectile } from './Projectile'; 
import { DamageNumber } from './DamageNumber';
import { DeathEffect } from './DeathEffect';
import { calculateFinalStatsForEntity, distanceToTarget } from '../entityUtils';
import type { ActiveBuffDebuff, BaseStats } from '../../../types';

const SKELETON_BASE_STATS = {
    letalidade: 0, vigor: 0, resistencia: 0,
    velocidadeAtaque: 0, velocidadeMovimento: 3.0,
    chanceCritica: 5, danoCritico: 50,
    chanceEsquiva: 0, vampirismo: 0,
    chanceDeAcerto: 100,
    poderDeCura: 0, curaRecebidaBonus: 0
};

const SKELETON_TEMPLATE = {
    name: 'Esqueleto', emoji: '💀',
    baseHp: 100, baseDamage: 10, range: 40, attackSpeed: 1500,
    velocidadeMovimento: 3.0, size: 20
};

export class SkeletonAlly extends Character {
    public master: HeroEntity;
    private bonusDamagePercentCasterMissingHp: number;

    constructor(
        x: number, y: number,
        master: HeroEntity,
        statTransferPercent: number,
        bonusDamagePercentCasterMissingHp: number
    ) {
        const transferredStats = { ...SKELETON_BASE_STATS };
        for (const key in transferredStats) {
            const statKey = key as keyof typeof transferredStats;
            const masterStat = master.combatStats[statKey] || 0;
            transferredStats[statKey] = masterStat * (statTransferPercent / 100);
        }

        // Override movement speed to match the master's, not a percentage.
        transferredStats.velocidadeMovimento = master.combatStats.velocidadeMovimento;

        const initialCombatStats = calculateFinalStatsForEntity(
            transferredStats,
            undefined, 
            SKELETON_TEMPLATE
        );
        
        super(
            x, y,
            initialCombatStats,
            false, // isPlayer
            transferredStats,
            undefined, // classDetails
            SKELETON_TEMPLATE, // enemyDetails
            1, // playerLevelScale
            undefined, // equippedItems
            master.threatLevel, // threatLevel from master
            master.isOpponent // isOpponent from master
        );

        this._entityType = 'ally';
        this.master = master;
        this.bonusDamagePercentCasterMissingHp = bonusDamagePercentCasterMissingHp;
        this.target = null;
    }

    performAttack(): { damageDealt: number; isCrit: boolean; projectile?: Projectile; } | null {
        if (!this.target) return null;

        let finalDamage = this.effectiveDamage;

        // Add bonus damage from master's missing health
        const missingHp = this.master.maxHp - this.master.currentHp;
        if (missingHp > 0) {
            const bonusDamage = missingHp * (this.bonusDamagePercentCasterMissingHp / 100);
            finalDamage += bonusDamage;
        }
        
        finalDamage = Math.max(1, Math.round(finalDamage));
        
        const isCrit = !!(this.combatStats.chanceCritica && Math.random() * 100 < this.combatStats.chanceCritica);
        if (isCrit) {
            finalDamage = Math.round(finalDamage * (1 + (this.combatStats.danoCritico || 50) / 100));
        }

        this.attackAnimProgress = 1;
        
        return { damageDealt: finalDamage, isCrit };
    }

    update(deltaTime: number, heroes: CombatCapable[], enemies: CombatCapable[], canvasSize: { width: number; height: number; }): { results: UpdateResult[]; abilityToTrigger?: string; } {
        const oldX = this.x;
        const oldY = this.y;

        const baseUpdate = super.update(deltaTime, heroes, enemies, canvasSize);
        const results = baseUpdate.results;
        if (!this.isAlive) {
            this.updateWalkAnimation(deltaTime, false);
            return baseUpdate;
        }

        const potentialTargets = this.master.isOpponent ? heroes : enemies;
        this.findTarget(potentialTargets);

        if (this.target && this.target.isAlive) {
            const dist = distanceToTarget(this, this.target);
            if (dist > this.range) {
                this.updateMovement(this.target.x, this.target.y, canvasSize.width, canvasSize.height);
            } else {
                const attackResult = this.attack();
                if (attackResult && this.target) {
                    const oldTargetHp = this.target.currentHp;
                    const dmgTaken = this.target.takeDamage(attackResult.damageDealt, attackResult.isCrit, this);

                    results.push({
                        eventToDispatch: {
                            type: 'DAMAGE_TAKEN',
                            payload: { target: this.target, attacker: this, amount: typeof dmgTaken === 'number' ? dmgTaken : 0, result: typeof dmgTaken === 'number' ? 'hit' : dmgTaken, isCrit: attackResult.isCrit, isBasicAttack: true }
                        }
                    });

                    if (typeof dmgTaken === 'number') {
                        const afterDamageResults = this.afterDealingDamage(dmgTaken, this.target, potentialTargets);
                        results.push(...afterDamageResults);
                        if (this.master.isPlayer) {
                            results.push({ newDamageNumber: new DamageNumber(dmgTaken, this.target.x, this.target.y, attackResult.isCrit ? 'red' : 'white') });
                        }
                    }
                    
                    if (this.target.currentHp <= 0 && oldTargetHp > 0 && !this.target.deathEffectCreated) {
                        results.push({ newEffect: new DeathEffect(this.target.x, this.target.y, '#757575', 10, 20) });
                        this.target.deathEffectCreated = true;
                    }

                    // HEAL MASTER LOGIC
                    const boneShieldBuff = this.activeBuffs.find(b => b.abilityId === 'BUFF_ESCUDO_DE_OSSOS');
                    if (boneShieldBuff?.effects.healCasterOnHitAsPercentOfMissingHp) {
                        const missingHp = this.master.maxHp - this.master.currentHp;
                        if (missingHp > 0) {
                            const healAmount = missingHp * (boneShieldBuff.effects.healCasterOnHitAsPercentOfMissingHp / 100);
                            
                            // Apply caster's healing power and receiver's bonus healing received
                            const poweredHeal = healAmount * (1 + (this.master.combatStats.poderDeCura || 0) / 100);
                            const finalHeal = poweredHeal * (1 + (this.master.combatStats.curaRecebidaBonus || 0) / 100);
                            
                            this.master.currentHp = Math.min(this.master.maxHp, this.master.currentHp + finalHeal);
                            this.master.healingDone += finalHeal;
                            results.push({ newDamageNumber: new DamageNumber(`+${Math.round(finalHeal)}`, this.master.x, this.master.y - 10, 'green') });
                        }
                    }
                }
            }
        }
        const didMove = this.x !== oldX || this.y !== oldY;
        this.updateWalkAnimation(deltaTime, didMove);
        return { results, abilityToTrigger: undefined };
    }

    draw(ctx: CanvasRenderingContext2D, isPreview?: boolean | undefined, isDragged?: boolean | undefined): void {
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
        ctx.fillText('💀', 0, 0);

        ctx.restore();
        super.draw(ctx, isPreview, isDragged);
    }
}

// --- NEW LIVING TREE ALLY ---

const LIVING_TREE_TEMPLATE = {
    name: 'Árvore Viva', emoji: '🌳',
    baseHp: 150, baseDamage: 8, range: 40, attackSpeed: 1800,
    velocidadeMovimento: 1.1, size: 25,
    baseStats: {
        resistencia: 10,
    }
};

export class LivingTreeAlly extends Character {
    public master: HeroEntity;
    private onHealDamageRadius: number;
    private onHealDamageLethalityMultiplier: number;
    private triggeredHealDamageThisFrame: boolean = false;

    constructor(
        x: number, y: number,
        master: HeroEntity,
        statTransferPercent: number,
        onHealEffect: { damageRadius: number, lethalityMultiplier: number }
    ) {
        const transferredStats: Partial<BaseStats> = {};
        const masterStats = master.combatStats;
        
        // Explicitly copy relevant stats
        transferredStats.letalidade = (masterStats.letalidade || 0) * (statTransferPercent / 100);
        transferredStats.vigor = (masterStats.vigor || 0) * (statTransferPercent / 100);
        transferredStats.resistencia = (masterStats.resistencia || 0) * (statTransferPercent / 100);
        transferredStats.velocidadeAtaque = (masterStats.velocidadeAtaque || 0) * (statTransferPercent / 100);
        transferredStats.chanceCritica = (masterStats.chanceCritica || 0) * (statTransferPercent / 100);
        transferredStats.danoCritico = (masterStats.danoCritico || 0) * (statTransferPercent / 100);
        transferredStats.chanceEsquiva = (masterStats.chanceEsquiva || 0) * (statTransferPercent / 100);
        transferredStats.vampirismo = (masterStats.vampirismo || 0) * (statTransferPercent / 100);
        transferredStats.poderDeCura = (masterStats.poderDeCura || 0) * (statTransferPercent / 100);
        transferredStats.curaRecebidaBonus = (masterStats.curaRecebidaBonus || 0) * (statTransferPercent / 100);
        
        transferredStats.velocidadeMovimento = master.combatStats.velocidadeMovimento;

        const initialCombatStats = calculateFinalStatsForEntity(
            transferredStats as BaseStats,
            undefined,
            LIVING_TREE_TEMPLATE
        );

        super(
            x, y, 
            initialCombatStats, 
            false, // isPlayer
            transferredStats as BaseStats, 
            undefined, 
            LIVING_TREE_TEMPLATE,
            1, // playerLevelScale
            undefined, // equippedItems
            master.threatLevel, // threatLevel from master
            master.isOpponent // isOpponent from master
        );

        this._entityType = 'ally';
        this.master = master;
        this.onHealDamageRadius = onHealEffect.damageRadius;
        this.onHealDamageLethalityMultiplier = onHealEffect.lethalityMultiplier;
        this.target = null;
    }
    
    public receiveHeal(amount: number, sourceCaster: CombatCapable): void {
        super.receiveHeal(amount, sourceCaster);
        if (amount > 0) {
            this.triggeredHealDamageThisFrame = true;
        }
    }

    update(deltaTime: number, heroes: CombatCapable[], enemies: CombatCapable[], canvasSize: { width: number; height: number; }): { results: UpdateResult[]; abilityToTrigger?: string; } {
        const oldX = this.x;
        const oldY = this.y;

        const baseUpdate = super.update(deltaTime, heroes, enemies, canvasSize);
        const results = baseUpdate.results;
        if (!this.isAlive) {
            this.updateWalkAnimation(deltaTime, false);
            return baseUpdate;
        }
        
        const potentialTargets = this.master.isOpponent ? heroes : enemies;

        if (this.triggeredHealDamageThisFrame) {
            this.triggeredHealDamageThisFrame = false;
            
            const enemiesInRange = potentialTargets.filter(e => e.isAlive && distanceToTarget(this, e) <= this.onHealDamageRadius);
            const damage = this.master.effectiveDamage + this.master.combatStats.letalidade * this.onHealDamageLethalityMultiplier;
            const roundedDamage = Math.max(1, Math.round(damage));
            
            if (enemiesInRange.length > 0) {
                 // Simple vfx: green/blue particle effect
                 results.push({ newEffect: new DeathEffect(this.x, this.y, '#2EE6D0', 20, 30) });
            }

            enemiesInRange.forEach(enemy => {
                const oldTargetHp = enemy.currentHp;
                const dmgTaken = enemy.takeDamage(roundedDamage, false, this);
                
                if (typeof dmgTaken === 'number') {
                    const afterDamageResults = this.afterDealingDamage(dmgTaken, enemy, potentialTargets);
                    afterDamageResults.forEach(res => {
                        if (res.newDamageNumber) results.push({ newDamageNumber: res.newDamageNumber });
                        if (res.newEffect) results.push({ newEffect: res.newEffect });
                    });
                    if (this.master.isPlayer) {
                        results.push({ newDamageNumber: new DamageNumber(dmgTaken, enemy.x, enemy.y, 'white') });
                    }
                }

                if (enemy.currentHp <= 0 && oldTargetHp > 0 && !enemy.deathEffectCreated) {
                    results.push({ newEffect: new DeathEffect(enemy.x, enemy.y, '#757575', 10, 20) });
                    enemy.deathEffectCreated = true;
                }
            });
        }
        
        // Basic AI: Find and attack target
        this.findTarget(potentialTargets);
        if (this.target && this.target.isAlive) {
            const dist = distanceToTarget(this, this.target);
            if (dist > this.range) {
                this.updateMovement(this.target.x, this.target.y, canvasSize.width, canvasSize.height);
            } else {
                const attackResult = this.attack();
                if (attackResult && this.target) {
                    const oldTargetHp = this.target.currentHp;
                    const dmgTaken = this.target.takeDamage(attackResult.damageDealt, attackResult.isCrit, this);
                    
                    results.push({
                        eventToDispatch: {
                            type: 'DAMAGE_TAKEN',
                            payload: { target: this.target, attacker: this, amount: typeof dmgTaken === 'number' ? dmgTaken : 0, result: typeof dmgTaken === 'number' ? 'hit' : dmgTaken, isCrit: attackResult.isCrit, isBasicAttack: true }
                        }
                    });

                    if (typeof dmgTaken === 'number') {
                        const afterDamageResults = this.afterDealingDamage(dmgTaken, this.target, potentialTargets);
                        results.push(...afterDamageResults);
                        if (this.master.isPlayer) {
                            results.push({ newDamageNumber: new DamageNumber(dmgTaken, this.target.x, this.target.y, attackResult.isCrit ? 'red' : 'white') });
                        }
                    }
                    if (this.target.currentHp <= 0 && oldTargetHp > 0 && !this.target.deathEffectCreated) {
                        results.push({ newEffect: new DeathEffect(this.target.x, this.target.y, '#757575', 10, 20) });
                        this.target.deathEffectCreated = true;
                    }
                }
            }
        }
        
        const didMove = this.x !== oldX || this.y !== oldY;
        this.updateWalkAnimation(deltaTime, didMove);
        return { results, abilityToTrigger: undefined };
    }
    
    draw(ctx: CanvasRenderingContext2D, isPreview?: boolean, isDragged?: boolean): void {
        if (!this.isAlive) return;

        ctx.save();
        const lunge = Math.sin(this.attackAnimProgress * Math.PI) * 5;
        const direction = this.target ? Math.sign(this.target.x - this.x) : 1;
        const tiltAngle = this.walkCycle === 0 ? 0 : Math.sin(this.walkCycle) * (Math.PI / 32);

        ctx.translate(this.x + (lunge * direction), this.y);
        ctx.rotate(tiltAngle);

        const trunkWidth = this.size * 0.3;
        const trunkHeight = this.size * 0.5;
        const foliageRadius = this.size * 0.6;
        
        const trunkX = -trunkWidth / 2;
        const trunkY = -trunkHeight;
        const foliageY = -trunkHeight * 1.2;

        ctx.fillStyle = '#6D4C41'; // Dark brown
        ctx.fillRect(trunkX, trunkY, trunkWidth, trunkHeight);
        ctx.fillStyle = '#2E7D32'; // Dark green
        ctx.beginPath();
        ctx.arc(0, foliageY, foliageRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
        super.draw(ctx, isPreview, isDragged);
    }
}