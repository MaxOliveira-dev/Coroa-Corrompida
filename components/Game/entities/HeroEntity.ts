import { Character } from './Character';
// FIX: Changed import path for combat-related types from '../../../types' to '../entityInterfaces' as they were moved.
import type { CombatCapable, UpdateResult, GameEvent, EventDispatcher, EventPayload_HEAL_PERFORMED, EventPayload_DAMAGE_DEALT, EventPayload_ABILITY_CAST } from '../entityInterfaces';
import { Projectile } from './Projectile'; 
import { DamageNumber } from './DamageNumber';
import { DeathEffect } from './DeathEffect';
import { calculateFinalStatsForEntity, distanceToTarget, getMultiShotTargets, isTargetInCone } from '../entityUtils';
import { drawHeroCharacter, drawRoundedRect } from '../drawingUtils';
import { GRID_SIZE } from '../gameConstants';
import type { BaseStats, ClassData, EquippedItems, Ability, Item, ActiveBuffDebuff, ActiveBuffDebuffEffect } from '../../../types';
import { EnemyEntity } from './EnemyEntity';
import { SkeletonAlly, LivingTreeAlly } from './SkeletonAlly';
import { abilityHandlers } from '../abilities/abilityHandlers';

export class HeroEntity extends Character {
    public mapleLeafPassiveReady: boolean = false;
    public hasUsedFirstAbilityThisBattle: boolean = false;
    public passiveCooldowns = new Map<string, Map<number, number>>(); // passiveId -> (targetId -> cooldownEndTime)
    public globalPassiveCooldowns = new Map<string, number>(); // passiveId -> cooldownEndTime
    public isOpponent: boolean;
    private karateStanceTimer = 0;
    // isPlayer is inherited from Character
    constructor(
        x: number, y: number,
        initialCombatStats: ReturnType<typeof calculateFinalStatsForEntity>,
        isPlayer: boolean, // This sets the isPlayer property in the Character constructor
        playerBaseStats: BaseStats, // Source for recalculation
        classDetails: ClassData,    // Source for recalculation
        equippedItems?: EquippedItems, // Source for recalculation
        threatLevel: number = 1,
        isOpponent: boolean = false
    ) {
        super(
            x, y, 
            initialCombatStats, 
            isPlayer,
            playerBaseStats,
            classDetails,
            undefined, // no enemyDetails for hero
            1, // playerLevelScale default
            equippedItems,
            threatLevel,
            isOpponent
        );
        this._entityType = 'hero';
        this.isOpponent = isOpponent;
        if (this.classDetails?.name === 'Guerreiro') {
            this.furia = 0;
            this.maxFuria = 10;
        }
        if (this.classDetails?.name === 'Paladino Corrompido') {
            this.corruption = 0;
            this.maxCorruption = 10;
        }
        if (this.classDetails?.name === 'Bardo') {
            this.isComposing = false;
            this.compositionSequence = [];
        }
    }
    
    public useAbility(ability: Ability, allHeroes: CombatCapable[], allEnemies: CombatCapable[], dispatcher: EventDispatcher): UpdateResult[] {
        const handler = abilityHandlers[ability.id];
        if (handler) {
            return handler(this, ability, allHeroes, allEnemies, dispatcher);
        }

        console.warn(`No handler found for ability: ${ability.id}`);
        return [];
    }


    public handleEvent(event: GameEvent, dispatcher: EventDispatcher, allHeroes: CombatCapable[], allEnemies: CombatCapable[]): UpdateResult[] {
        const results = super.handleEvent(event, dispatcher, allHeroes, allEnemies); // Call parent method

        if (event.type === 'HEAL_PERFORMED') {
            const payload = event.payload as EventPayload_HEAL_PERFORMED;
            
            // Check if this hero is the caster and not healing itself
            if (payload.caster.id === this.id && payload.target.id !== this.id) {
                const target = payload.target;
                if (!this.equippedItems) return results;

                const equipped: Item[] = Object.values(this.equippedItems).filter((i): i is Item => i !== null);

                for (const equippedItem of equipped) {
                    if (equippedItem.passiveAbility && equippedItem.passiveAbility.trigger === 'HEAL_PERFORMED') {
                        switch (equippedItem.passiveAbility.id) {
                            case 'PASSIVE_FOLHA_DE_BORDO': {
                                const props = equippedItem.passiveAbility.properties as {
                                    shieldHpPercentTargetMaxHp: number;
                                    shieldFromCasterPowerOfHealingMultiplier: number;
                                    cooldownMs: number;
                                };
                                const passiveId = equippedItem.passiveAbility.id;
                                const now = Date.now();
                                const cooldownEnd = this.globalPassiveCooldowns.get(passiveId) || 0;

                                // This logic handles AOE heals. If the cooldown was set less than 50ms ago,
                                // we assume it's part of the same heal event and apply the shield to other allies too.
                                const isDuringAoeHeal = (cooldownEnd > now) && ((cooldownEnd - now) > (props.cooldownMs - 50));

                                if (now >= cooldownEnd || isDuringAoeHeal) {
                                    const shieldAmount = (target.maxHp * (props.shieldHpPercentTargetMaxHp / 100)) +
                                                         (this.combatStats.poderDeCura * props.shieldFromCasterPowerOfHealingMultiplier);

                                    if (shieldAmount > 0) {
                                        const roundedShieldAmount = Math.round(shieldAmount);
                                        target.applyShield(roundedShieldAmount);
                                        dispatcher.dispatchEvent('SHIELD_APPLIED', { caster: this, target: target, amount: roundedShieldAmount });
                                        this.shieldingGranted += roundedShieldAmount;
                                    }

                                    // Only set the global cooldown if it's not already set by this heal event.
                                    if (now >= cooldownEnd) {
                                        this.globalPassiveCooldowns.set(passiveId, now + props.cooldownMs);
                                    }
                                }
                                break;
                            }
                        }
                    }
                }
            }
        } else if (event.type === 'DAMAGE_DEALT') {
            const payload = event.payload as EventPayload_DAMAGE_DEALT;
            // Check if this hero is the attacker and it's a basic attack
            if (payload.isBasicAttack && payload.attacker.id === this.id) {
                if (!this.equippedItems) return results;

                // Logic for Invocar Ciclone stacks
                const cicloneBuffIndex = this.activeBuffs.findIndex(b => b.abilityId === 'BUFF_INVOCAR_CICLONE');
                if (cicloneBuffIndex !== -1) {
                    const buff = this.activeBuffs[cicloneBuffIndex];
                    if (buff.stacks !== undefined && buff.stacks > 0) {
                        buff.stacks -= 1;
                        if (buff.stacks <= 0) {
                            this.activeBuffs.splice(cicloneBuffIndex, 1);
                            this.recalculateStats();
                        }
                    }
                }

                const equipped: Item[] = Object.values(this.equippedItems).filter((i): i is Item => i !== null);
                for (const equippedItem of equipped) {
                    const passive = equippedItem.passiveAbility;
                    if (passive && passive.trigger === 'BASIC_ATTACK_LANDED' && passive.id === 'PASSIVE_AMULETO_AGILIDADE') {
                        const props = passive.properties as any;
                        const stackingBuffConfig = props.stackingBuff;
                        const frenzyBuffConfig = props.frenzyBuff;
                    
                        if (!stackingBuffConfig || !frenzyBuffConfig) break;
                    
                        const hasFrenzy = this.activeBuffs.some(b => b.abilityId === frenzyBuffConfig.id);
                        if (hasFrenzy) break;
                    
                        let agilidadeBuff = this.activeBuffs.find(b => b.abilityId === stackingBuffConfig.id);
                    
                        if (agilidadeBuff) {
                            agilidadeBuff.remainingMs = stackingBuffConfig.durationMs;
                            agilidadeBuff.stacks = Math.min(stackingBuffConfig.maxStacks, (agilidadeBuff.stacks || 1) + 1);
                        } else {
                            agilidadeBuff = {
                                id: `${stackingBuffConfig.id}_${this.id}`, abilityId: stackingBuffConfig.id,
                                name: stackingBuffConfig.name, icon: stackingBuffConfig.icon,
                                durationMs: stackingBuffConfig.durationMs, remainingMs: stackingBuffConfig.durationMs,
                                effects: { ...stackingBuffConfig.effects }, appliedAt: Date.now(),
                                isBuff: true, sourceEntityId: this.id, targetEntityId: this.id,
                                stacks: 1, maxStacks: stackingBuffConfig.maxStacks,
                            };
                            this.applyBuff(agilidadeBuff);
                        }
                    
                        if ((agilidadeBuff.stacks ?? 0) >= stackingBuffConfig.maxStacks) {
                            this.activeBuffs = this.activeBuffs.filter(b => b.abilityId !== stackingBuffConfig.id);
                            this.applyBuff({
                                id: `${frenzyBuffConfig.id}_${this.id}`, abilityId: frenzyBuffConfig.id,
                                name: frenzyBuffConfig.name, icon: frenzyBuffConfig.icon,
                                durationMs: frenzyBuffConfig.durationMs, remainingMs: frenzyBuffConfig.durationMs,
                                effects: { ...frenzyBuffConfig.effects }, appliedAt: Date.now(),
                                isBuff: true, sourceEntityId: this.id, targetEntityId: this.id
                            });
                            results.push({ newVfx: { type: 'FRENZY_GLOW', target: this, duration: frenzyBuffConfig.durationMs } });
                        } else {
                             this.recalculateStats();
                        }
                        break; // Found and processed the amulet, no need to check other items.
                    }
                }
            }
        } else if (event.type === 'ABILITY_CAST') {
            const payload = event.payload as EventPayload_ABILITY_CAST;
            if (payload.caster.id === this.id) {
                if (!this.equippedItems) return results;

                const equipped: Item[] = Object.values(this.equippedItems).filter((i): i is Item => i !== null);
                for (const equippedItem of equipped) {
                    const passive = equippedItem.passiveAbility;
                    if (passive && passive.trigger === 'ABILITY_CAST') {
                        if (passive.id === 'PASSIVE_INVOCAR_CICLONE') {
                            const props = passive.properties as any;
                            const cooldownMs = props.cooldownMs || 10000;
                            const now = Date.now();
                            const cooldownEnd = this.globalPassiveCooldowns.get(passive.id) || 0;

                            if (now >= cooldownEnd) {
                                this.globalPassiveCooldowns.set(passive.id, now + cooldownMs);
                                const buffTemplate = props.buff;
                                if (buffTemplate) {
                                    this.applyBuff({
                                        id: `${buffTemplate.id}_${this.id}`,
                                        abilityId: buffTemplate.id,
                                        name: buffTemplate.name,
                                        icon: buffTemplate.icon,
                                        durationMs: buffTemplate.durationMs,
                                        remainingMs: buffTemplate.durationMs,
                                        effects: { ...buffTemplate.effects },
                                        appliedAt: now,
                                        isBuff: true,
                                        sourceEntityId: this.id,
                                        targetEntityId: this.id,
                                        stacks: buffTemplate.maxStacks,
                                        maxStacks: buffTemplate.maxStacks
                                    });
                                    results.push({ newVfx: { type: 'INVOCAR_CICLONE_BUFF', target: this, duration: buffTemplate.durationMs } });
                                }
                            }
                        } else if (passive.id !== 'PASSIVE_BEIJO_DUPLO') {
                            const buffTemplate = passive.properties.buff;
                            if (buffTemplate) {
                                if (!this.activeBuffs.some(b => b.abilityId === buffTemplate.id)) {
                                    this.applyBuff({
                                        id: `${buffTemplate.id}_${this.id}`,
                                        abilityId: buffTemplate.id,
                                        name: buffTemplate.name,
                                        icon: buffTemplate.icon,
                                        durationMs: buffTemplate.durationMs,
                                        remainingMs: buffTemplate.durationMs,
                                        effects: { ...buffTemplate.effects },
                                        appliedAt: Date.now(),
                                        isBuff: true,
                                        sourceEntityId: this.id,
                                        targetEntityId: this.id,
                                    });
                                }
                            }
                        }
                    }
                }

                // Logic for Beijo Duplo
                const insignia = this.equippedItems?.insignia;
                if (insignia?.passiveAbility?.id === 'PASSIVE_BEIJO_DUPLO' && !this.hasUsedFirstAbilityThisBattle) {
                    this.hasUsedFirstAbilityThisBattle = true;

                    const buffTemplate = insignia.passiveAbility.properties.buff;
                    if (buffTemplate) {
                        this.applyBuff({
                            id: `${buffTemplate.id}_${this.id}`,
                            abilityId: buffTemplate.id,
                            name: buffTemplate.name,
                            icon: buffTemplate.icon,
                            durationMs: buffTemplate.durationMs,
                            remainingMs: buffTemplate.durationMs,
                            effects: { ...buffTemplate.effects },
                            appliedAt: Date.now(),
                            isBuff: true,
                            sourceEntityId: this.id,
                            targetEntityId: this.id,
                        });
                    }

                    dispatcher.addDelayedAction(100, () => {
                        return this.useAbility(payload.ability, allHeroes, allEnemies, dispatcher);
                    });

                    if (this.isPlayer) {
                        results.push({
                            eventToDispatch: {
                                type: 'NOTIFICATION_TEXT',
                                payload: { text: "Beijo Duplo!", x: this.x, y: this.y - this.size }
                            }
                        });
                    }
                }
            }
        }
        
        return results;
    }

    public afterDealingDamage(damageDealt: number, target: CombatCapable, allEnemies: CombatCapable[]): UpdateResult[] {
        const results = super.afterDealingDamage(damageDealt, target, allEnemies); 
        
        if (this.classDetails?.name === 'Guerreiro') {
            if (this.furia !== undefined && this.maxFuria !== undefined) {
                let furyToAdd = 1;
                this.activeBuffs.forEach(buff => {
                    if (buff.effects.furiaPerAttack) {
                        furyToAdd += buff.effects.furiaPerAttack;
                    }
                });
                this.furia = Math.min(this.maxFuria, this.furia + furyToAdd);
            }
        }

        // Corruption gain from basic attacks
        if (this.classDetails?.name === 'Paladino Corrompido') {
            if (this.corruption !== undefined && this.maxCorruption !== undefined) {
                this.corruption = Math.min(this.maxCorruption, this.corruption + 1);
            }
        }

        if (target instanceof EnemyEntity && !target.isAgro) {
            target.isAgro = true;
            target.agroAllies(allEnemies);
        }
        return results;
    }

    performAttack(): { damageDealt: number; isCrit: boolean; projectile?: Projectile; debuffOnHit?: any; } | null {
        if (!this.target) return null;
    
        let isCrit: boolean = !!(this.combatStats.chanceCritica && Math.random() * 100 < this.combatStats.chanceCritica);
        let finalDamage = this.effectiveDamage;
        let bonusDamageFromBuff = 0;
        let debuffOnHit: any = null;
    
        const attackModifierBuffIndex = this.activeBuffs.findIndex(b => b.effects.nextAttackCrit || b.effects.nextAttackBonusDamagePercentTargetMaxHp);
        if (attackModifierBuffIndex !== -1) {
            const buff = this.activeBuffs[attackModifierBuffIndex];
            if (buff.effects.nextAttackCrit) {
                isCrit = true;
            }
            if (buff.effects.nextAttackBonusDamagePercentTargetMaxHp && this.target.maxHp) {
                bonusDamageFromBuff = this.target.maxHp * (buff.effects.nextAttackBonusDamagePercentTargetMaxHp / 100);
            }
            if (!buff.effects.nextAttackSplash) {
                this.activeBuffs.splice(attackModifierBuffIndex, 1);
                this.recalculateStats();
            }
        }

        const enchantedAttackBuffIndex = this.activeBuffs.findIndex(b => b.effects.nextAttackEnchanted);
        if (enchantedAttackBuffIndex !== -1) {
            const buff = this.activeBuffs[enchantedAttackBuffIndex];
            const enchantProps = buff.effects.nextAttackEnchanted;
            if (enchantProps) {
                if (enchantProps.bonusDamageFromResistancePercent) {
                    bonusDamageFromBuff += this.combatStats.resistencia || 0;
                }
                if (enchantProps.bonusDamageFromVigorMultiplier) {
                    const vigorValue = this.combatStats.vigor || 0;
                    const bonusDamageFromVigor = vigorValue * enchantProps.bonusDamageFromVigorMultiplier;
                    bonusDamageFromBuff += bonusDamageFromVigor;
                }
                if (enchantProps.applyDebuff) {
                    debuffOnHit = enchantProps.applyDebuff;
                }
            }
            this.activeBuffs.splice(enchantedAttackBuffIndex, 1);
            this.recalculateStats();
        }
    
        if (isCrit) {
            finalDamage = Math.round(finalDamage * (1 + (this.combatStats.danoCritico || 50) / 100));
        }
        
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
            let projectileOptions: any = { color: this.bodyColor || 'grey' };

            // SPECIFIC CLASS LOGIC FIRST
            if (this.classDetails?.name === 'NECROMANTE') { 
                projectileOptions = {
                    ...projectileOptions,
                    displayType: 'skull_orb',
                    trailType: 'magic_dust',
                    size: 10,
                    color: '#39FF14' // Necrotic Green
                };
            } 
            // GENERIC WEAPON TYPE LOGIC
            else if (this.combatStats.weaponRepresentation === 'bow') {
                projectileOptions.displayType = 'arrow';
            } else if (this.combatStats.weaponRepresentation === 'staff') {
                // Generic Mage Staff attack
                projectileOptions = {
                    ...projectileOptions,
                    displayType: 'magic_orb',
                    trailType: 'magic_dust',
                    size: 8,
                    color: this.combatStats.color || '#90CAF9'
                };
            }

            // Check for splash buff and pass it to projectile
            const splashBuffIndex = this.activeBuffs.findIndex(b => b.effects.nextAttackSplash);
            if (splashBuffIndex !== -1) {
                const buff = this.activeBuffs[splashBuffIndex];
                projectileOptions.splashConfig = buff.effects.nextAttackSplash;
                // The buff is consumed once the special attack is fired
                this.activeBuffs.splice(splashBuffIndex, 1);
                this.recalculateStats();
            }
            
            if (debuffOnHit) {
                projectileOptions.debuffToApply = debuffOnHit;
            }

            return { damageDealt: finalDamage, isCrit, projectile: new Projectile(this.x, this.y, this, this.target, finalDamage, isCrit, projectileOptions) };
        } else {
            return { damageDealt: finalDamage, isCrit, debuffOnHit };
        }
    }


    update(deltaTime: number, heroes: CombatCapable[], enemies: CombatCapable[], canvasSize: { width: number; height: number; }): { results: UpdateResult[], abilityToTrigger?: string } {
        const oldX = this.x;
        const oldY = this.y;
        
        const baseUpdate = super.update(deltaTime, heroes, enemies, canvasSize); 
        if (!this.isAlive) {
            this.updateWalkAnimation(deltaTime, false);
            return baseUpdate;
        }

        const results = baseUpdate.results;
        let abilityToTrigger: string | undefined = baseUpdate.abilityToTrigger;
        
        const armor = this.equippedItems?.armor;
        if (armor?.passiveAbility?.id === 'PASSIVE_KARATE_STANCE') {
            this.karateStanceTimer += deltaTime;
            const passiveProps = armor.passiveAbility.properties;
            const stackingBuffConfig = passiveProps?.stackingBuff;
            const healingBuffConfig = passiveProps?.healingBuff;
            if (this.karateStanceTimer >= 1000 && stackingBuffConfig && healingBuffConfig) {
                this.karateStanceTimer -= 1000;
                const isHealing = this.activeBuffs.some(b => b.abilityId === healingBuffConfig.id);
                if (!isHealing) {
                    let karateStackBuff = this.activeBuffs.find(b => b.abilityId === stackingBuffConfig.id);
                    
                    const maxStacks = stackingBuffConfig.maxStacks ?? 1;

                    if (!karateStackBuff) {
                        this.applyBuff({
                            id: `${stackingBuffConfig.id}_${this.id}`, abilityId: stackingBuffConfig.id, name: stackingBuffConfig.name, icon: stackingBuffConfig.icon,
                            durationMs: stackingBuffConfig.durationMs, remainingMs: stackingBuffConfig.durationMs, effects: { ...stackingBuffConfig.effects },
                            appliedAt: Date.now(), isBuff: true, sourceEntityId: this.id, targetEntityId: this.id,
                            stacks: 1, maxStacks: maxStacks,
                        });
                    } else if ((karateStackBuff.stacks ?? 1) < maxStacks) {
                        karateStackBuff.stacks = (karateStackBuff.stacks || 1) + 1;
                        karateStackBuff.remainingMs = stackingBuffConfig.durationMs;
                        this.recalculateStats();
                    }
                    karateStackBuff = this.activeBuffs.find(b => b.abilityId === stackingBuffConfig.id);
                    if (karateStackBuff && (karateStackBuff.stacks ?? 0) >= maxStacks) {
                        this.activeBuffs = this.activeBuffs.filter(b => b.abilityId !== stackingBuffConfig.id);
                        const hotEffectsTemplate = healingBuffConfig.effects.hot;
                        this.recalculateStats();
                        if (hotEffectsTemplate) {
                            const healPerTick = this.combatStats.letalidade * (hotEffectsTemplate.healFromCasterLethalityMultiplier || 0);
                            this.applyBuff({
                                id: `${healingBuffConfig.id}_${this.id}`, abilityId: healingBuffConfig.id, name: healingBuffConfig.name, icon: healingBuffConfig.icon,
                                durationMs: healingBuffConfig.durationMs, remainingMs: healingBuffConfig.durationMs,
                                effects: { hot: { tickIntervalMs: hotEffectsTemplate.tickIntervalMs, healPerTick: Math.max(1, Math.round(healPerTick)), sourceCasterId: this.id } },
                                appliedAt: Date.now(), isBuff: true, sourceEntityId: this.id,
                            });
                        }
                    }
                }
            }
        }
        // Define potential targets once for this update cycle.
        const potentialTargets = this.isOpponent ? heroes : enemies;
        const potentialAllies = this.isOpponent ? enemies : heroes;

        // Bardo Aura Logic
        this.activeBuffs.forEach(buff => {
            const bardoAura = buff.effects.bardoComboAura;
            if (bardoAura) {
                if (!bardoAura.lastTickTime) {
                    bardoAura.lastTickTime = Date.now();
                }
                if (Date.now() - bardoAura.lastTickTime >= bardoAura.tickIntervalMs) {
                    bardoAura.lastTickTime = Date.now();
                    const enemiesInArea = potentialTargets.filter(e => e.isAlive && distanceToTarget(this, e) <= bardoAura.radius);

                    results.push({ newVfx: { type: 'ACORDE_DISSONANTE', target: this } });

                    enemiesInArea.forEach(enemy => {
                        const missingHp = enemy.maxHp - enemy.currentHp;
                        const damage = (this.combatStats.letalidade * bardoAura.lethalityMultiplier) +
                                       (missingHp > 0 ? missingHp * (bardoAura.missingHpPercentDamage / 100) : 0);
                        const roundedDamage = Math.max(1, Math.round(damage));
                        
                        const oldHp = enemy.currentHp;
                        const dmgTaken = enemy.takeDamage(roundedDamage, false, this);

                        if (typeof dmgTaken === 'number') {
                            if (this.isPlayer || enemy.isPlayer) {
                                results.push({ newDamageNumber: new DamageNumber(dmgTaken, enemy.x, enemy.y, 'white') });
                            }
                            const afterDamageResults = this.afterDealingDamage(dmgTaken, enemy, potentialTargets);
                            results.push(...afterDamageResults);
                        }

                        if (enemy.currentHp <= 0 && oldHp > 0 && !enemy.deathEffectCreated) {
                            results.push({ newEffect: new DeathEffect(enemy.x, enemy.y, '#757575') });
                            enemy.deathEffectCreated = true;
                        }
                    });
                }
            }
        });

        // Check for Maple Leaf passive readiness
        const mapleLeafItem = Object.values(this.equippedItems || {}).find((item: Item | null) => item?.passiveAbility?.id === 'PASSIVE_FOLHA_DE_BORDO');
        if (mapleLeafItem) {
            const now = Date.now();
            const passiveId = 'PASSIVE_FOLHA_DE_BORDO';
            const cooldownEnd = this.globalPassiveCooldowns.get(passiveId) || 0;
            const livingAllies = potentialAllies.filter(h => h.isAlive && h.id !== this.id);

            // Ready if cooldown is over AND there's at least one living ally to heal.
            this.mapleLeafPassiveReady = now >= cooldownEnd && livingAllies.length > 0;
        } else {
            this.mapleLeafPassiveReady = false;
        }

        // --- DASH LOGIC ---
        const dashBuff = this.activeBuffs.find(b => b.effects.dashToTarget);
        if (dashBuff?.effects.dashToTarget) {
            const dashInfo = dashBuff.effects.dashToTarget;
            const dashTarget = potentialTargets.find(e => e.id === dashInfo.targetId);

            if (dashTarget && dashTarget.isAlive) {
                this.target = dashTarget; // Force target override
                const dist = distanceToTarget(this, dashTarget);
                
                // Check for hit
                if (dist < (this.size / 2 + dashTarget.size / 2)) {
                    // HIT! Apply effect
                    const onHit = dashInfo.onHitEffect;
                    
                    let damage = (this.classDetails?.damage || 0) +
                                 (this.combatStats.letalidade * (onHit.lethalityMultiplier || 0)) +
                                 (this.combatStats.vigor * (onHit.vigorMultiplier || 0));

                    if (onHit.isDoubled) {
                        damage *= 2;
                    }

                    if (onHit.alwaysCrit) {
                        damage = Math.round(damage * (1 + (this.combatStats.danoCritico || 50) / 100));
                    }
                    damage = Math.max(1, Math.round(damage));

                    const dmgTaken = dashTarget.takeDamage(damage, true, this);
                    if (typeof dmgTaken === 'number') {
                        results.push({
                            eventToDispatch: {
                                type: 'DAMAGE_DEALT',
                                payload: { attacker: this, target: dashTarget, amount: dmgTaken, isCrit: true, isBasicAttack: false, abilityId: 'GUERREIRO_INTERCEPTAR' }
                            }
                        });
                        const afterDamageResults = this.afterDealingDamage(dmgTaken, dashTarget, potentialTargets);
                        results.push(...afterDamageResults);
                    }
                    
                    if (this.isPlayer || dashTarget.isPlayer) {
                        if (typeof dmgTaken === 'number') {
                            results.push({ newDamageNumber: new DamageNumber(dmgTaken, dashTarget.x, dashTarget.y, 'red') });
                        }
                    }
                    
                    // Apply stun
                    dashTarget.applyDebuff({
                        id: `stun_${dashTarget.id}_intercept`,
                        abilityId: 'GUERREIRO_INTERCEPTAR_STUN',
                        name: 'Atordoado',
                        icon: '💫',
                        durationMs: onHit.stunDurationMs,
                        remainingMs: onHit.stunDurationMs,
                        effects: { isImmobile: true },
                        appliedAt: Date.now(),
                        isBuff: false,
                        sourceEntityId: this.id,
                        targetEntityId: dashTarget.id
                    });

                    this.activeBuffs = this.activeBuffs.filter(b => b.id !== dashBuff.id);
                    this.recalculateStats();
                } else {
                    // Not hit yet, continue moving
                    const modifiedSpeed = this.movementSpeed * dashInfo.speedMultiplier;
                    const angle = Math.atan2(dashTarget.y - this.y, dashTarget.x - this.x);
                    this.x += Math.cos(angle) * modifiedSpeed;
                    this.y += Math.sin(angle) * modifiedSpeed;
                }
            } else {
                // Target died or doesn't exist, remove buff
                this.activeBuffs = this.activeBuffs.filter(b => b.id !== dashBuff.id);
                this.recalculateStats();
            }
            
            const didMove = this.x !== oldX || this.y !== oldY;
            this.updateWalkAnimation(deltaTime, didMove);
            return { results, abilityToTrigger };
        }

        // --- END DASH LOGIC ---

        this.findTarget(potentialTargets); 
        
        // AI LOGIC for non-player heroes
        if (!this.isPlayer && this.target && this.target.isAlive) {
            const usableAbilities = this.abilities.filter(ab => (this.abilityCooldowns[ab.id] || 0) <= 0);
            if (usableAbilities.length > 0) {
                // Simple AI: 1% chance per frame to use an ability if off cooldown
                if (Math.random() < 0.01) { 
                     const abilityToUse = usableAbilities[Math.floor(Math.random() * usableAbilities.length)];
                     // A simple check to not waste certain abilities
                     if (abilityToUse.targetType === 'SINGLE_ENEMY' && distanceToTarget(this, this.target) > this.range * 1.5) {
                        // Don't use single target ability if target is too far
                     } else {
                        abilityToTrigger = abilityToUse.id;
                     }
                }
            }
        }

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
                    if (attackResult.projectile) { // Ranged Attack
                        const projectiles: Projectile[] = [attackResult.projectile];
                        const multiShotBuff = this.activeBuffs.find(b => b.effects.multiShot);
                        
                        if (multiShotBuff?.effects.multiShot && this.target) {
                            const additionalTargets = getMultiShotTargets(this, this.target, potentialTargets, multiShotBuff.effects.multiShot.count);
                            
                            for (const additionalTarget of additionalTargets) {
                                const newProjectile = new Projectile(
                                    attackResult.projectile.x,
                                    attackResult.projectile.y,
                                    attackResult.projectile.attacker,
                                    additionalTarget,
                                    attackResult.projectile.damage,
                                    attackResult.projectile.isCrit,
                                    {
                                        color: attackResult.projectile.color,
                                        size: attackResult.projectile.size,
                                        speed: attackResult.projectile.speed,
                                        piercing: attackResult.projectile.piercing,
                                        lifetimeMs: attackResult.projectile.lifetimeMs,
                                        debuffToApply: attackResult.projectile.debuffToApply,
                                        sourceAbilityProperties: attackResult.projectile.sourceAbilityProperties,
                                        splashConfig: attackResult.projectile.splashConfig,
                                        displayType: attackResult.projectile.displayType,
                                        trailType: attackResult.projectile.trailType,
                                    }
                                );
                                projectiles.push(newProjectile);
                            }
                        }
        
                        projectiles.forEach((proj) => {
                            results.push({ newProjectile: proj });
                        });
        
                    } else if (this.target) { // Melee Attack
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
                            const afterDamageResults = this.afterDealingDamage(dmgTaken, this.target, potentialTargets);
                            results.push(...afterDamageResults);

                            if (attackResult.debuffOnHit) {
                                const debuffTemplate = attackResult.debuffOnHit;
                                this.target.applyDebuff({
                                    id: `${debuffTemplate.id}_${this.target.id}_${Date.now()}`,
                                    abilityId: debuffTemplate.id,
                                    name: debuffTemplate.name,
                                    icon: debuffTemplate.icon,
                                    durationMs: debuffTemplate.durationMs,
                                    remainingMs: debuffTemplate.durationMs,
                                    effects: { ...debuffTemplate.effects },
                                    appliedAt: Date.now(),
                                    isBuff: false,
                                    sourceEntityId: this.id,
                                });
                                if (debuffTemplate.id === 'DEBUFF_TOQUE_CONGELANTE') {
                                    results.push({ newVfx: { type: 'FREEZING_TOUCH', target: this.target, duration: debuffTemplate.durationMs } });
                                }
                            }
                        }
                        
                        let result: UpdateResult = {};
                        if (this.isPlayer || this.target.isPlayer) {
                            if (typeof dmgTaken === 'number') {
                                result.newDamageNumber = new DamageNumber(dmgTaken, this.target.x, this.target.y, attackResult.isCrit ? 'red' : 'white');
                            } else if (dmgTaken === 'esquiva') {
                                result.newDamageNumber = new DamageNumber("Esquiva!", this.target.x, this.target.y, 'white');
                            } else if (dmgTaken === 'bloqueado') {
                                result.newDamageNumber = new DamageNumber("Bloqueado!", this.target.x, this.target.y, 'cyan');
                            }
                        }

                        if (this.target.currentHp <= 0 && oldTargetHp > 0 && !this.target.deathEffectCreated) {
                            const targetChar = this.target as Character;
                            result.newEffect = new DeathEffect(targetChar.x, targetChar.y, targetChar.combatStats.isBoss ? '#C62828' : '#757575', targetChar.combatStats.isBoss ? 35 : 15, targetChar.combatStats.isBoss ? 60 : 30);
                            targetChar.deathEffectCreated = true;
                        }
                        results.push(result);
                    }
                }
            }
        }
        
        const didMove = this.x !== oldX || this.y !== oldY;
        this.updateWalkAnimation(deltaTime, didMove);
        return { results, abilityToTrigger };
    }

    private drawOrbitingShields(ctx: CanvasRenderingContext2D, chargeCount: number) {
        ctx.save();
        
        const orbitRadius = this.size * 1.2;
        const shieldSize = this.size * 0.3;
        const rotation = (Date.now() / 1000) * 2; // Radians per second
    
        for (let i = 0; i < chargeCount; i++) {
            const angle = rotation + (i * (Math.PI * 2 / chargeCount));
            const shieldX = this.x + Math.cos(angle) * orbitRadius;
            const shieldY = this.y + Math.sin(angle) * orbitRadius;
            
            ctx.fillStyle = 'rgba(135, 206, 250, 0.7)'; // Light sky blue with transparency
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.lineWidth = 1.5;
    
            ctx.beginPath();
            ctx.moveTo(shieldX, shieldY - shieldSize * 0.6); // Top point
            ctx.lineTo(shieldX + shieldSize * 0.5, shieldY); // Right point
            ctx.lineTo(shieldX, shieldY + shieldSize * 0.6); // Bottom point
            ctx.lineTo(shieldX - shieldSize * 0.5, shieldY); // Left point
            ctx.closePath();
            
            ctx.fill();
            ctx.stroke();
        }
    
        ctx.restore();
    }

    private drawFuryBar(ctx: CanvasRenderingContext2D) {
        if (this.furia === undefined || this.maxFuria === undefined) return;
    
        const barWidth = this.size * 1.8;
        const barHeight = this.size * 0.15;
    
        const totalHeroVisualHeight = this.size * 1.5;
        const healthBarY = this.y - totalHeroVisualHeight * 0.8;
        const healthBarHeight = this.size * 0.22;
        
        const furyBarX = this.x - barWidth / 2;
        const furyBarY = healthBarY + healthBarHeight + 2; // Position below health bar
    
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        drawRoundedRect(ctx, furyBarX, furyBarY, barWidth, barHeight, 2);
        ctx.fill();
    
        // Fill
        const currentFuryWidth = Math.max(0, (this.furia / this.maxFuria) * barWidth);
        ctx.fillStyle = '#DC143C'; // Crimson Red for fury
        drawRoundedRect(ctx, furyBarX, furyBarY, currentFuryWidth, barHeight, 2);
        ctx.fill();
    
        // Border
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        drawRoundedRect(ctx, furyBarX, furyBarY, barWidth, barHeight, 2);
        ctx.stroke();
    }

    private drawCorruptionBar(ctx: CanvasRenderingContext2D) {
        if (this.corruption === undefined || this.maxCorruption === undefined) return;
    
        const barWidth = this.size * 1.8;
        const barHeight = this.size * 0.15;
    
        const totalHeroVisualHeight = this.size * 1.5;
        const healthBarY = this.y - totalHeroVisualHeight * 0.8;
        const healthBarHeight = this.size * 0.22;
        
        const corruptionBarX = this.x - barWidth / 2;
        const corruptionBarY = healthBarY + healthBarHeight + 2; // Position below health bar
    
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        drawRoundedRect(ctx, corruptionBarX, corruptionBarY, barWidth, barHeight, 2);
        ctx.fill();
    
        // Fill
        const currentCorruptionWidth = Math.max(0, (this.corruption / this.maxCorruption) * barWidth);
        ctx.fillStyle = '#8E44AD'; // Purple for corruption
        drawRoundedRect(ctx, corruptionBarX, corruptionBarY, currentCorruptionWidth, barHeight, 2);
        ctx.fill();
    
        // Border
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        drawRoundedRect(ctx, corruptionBarX, corruptionBarY, barWidth, barHeight, 2);
        ctx.stroke();
    }
    
    private drawCompositionBar(ctx: CanvasRenderingContext2D) {
        if (this.isComposing === undefined || this.compositionSequence === undefined) return;

        if (!this.isComposing) return;

        const totalHeroVisualHeight = this.size * 1.5;
        const healthBarY = this.y - totalHeroVisualHeight * 0.8;
        
        const barY = healthBarY - 20;
        const barWidth = 60;
        const barHeight = 20;
        const barX = this.x - barWidth / 2;
        
        const numSlots = 3;
        const slotSize = barWidth / numSlots;
        const circleRadius = slotSize * 0.4;
        const noteColors = ['#C471ED', '#76D7C4', '#F7DC6F']; // Purple, Green, Yellow

        // Draw background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        drawRoundedRect(ctx, barX, barY, barWidth, barHeight, 5);
        ctx.fill();

        for (let i = 0; i < numSlots; i++) {
            const slotX = barX + slotSize * (i + 0.5);
            const slotY = barY + barHeight / 2;

            // Draw empty slot
            ctx.strokeStyle = '#888';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(slotX, slotY, circleRadius, 0, Math.PI * 2);
            ctx.stroke();

            // Draw filled note
            if (this.compositionSequence[i]) {
                const noteKey = this.compositionSequence[i];
                ctx.fillStyle = noteColors[noteKey - 1] || '#FFF';
                ctx.beginPath();
                ctx.arc(slotX, slotY, circleRadius, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }


    draw(ctx: CanvasRenderingContext2D, isPreview: boolean = false, isDragged: boolean = false) {
        if (!this.isAlive && !isPreview) return;
    
        ctx.save();
    
        // Draw max fury aura
        if (!isPreview && this.furia !== undefined && this.maxFuria !== undefined && this.furia >= this.maxFuria) {
            const auraRadius = this.size * 0.8 + Math.sin(Date.now() * 0.005) * 5;
            const gradient = ctx.createRadialGradient(this.x, this.y, this.size * 0.4, this.x, this.y, auraRadius);
            gradient.addColorStop(0, 'rgba(255, 0, 0, 0.4)');
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, auraRadius, 0, Math.PI * 2);
            ctx.fill();
        }
    
        const isInvisible = this.activeBuffs.some(b => b.effects.isInvisible);
        if (isDragged && !isPreview) {
            ctx.globalAlpha = isInvisible ? 0.3 : 0.7;
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 10;
        } else if (isInvisible && !isPreview) {
            ctx.globalAlpha = 0.4;
        }
    
        const lunge = isPreview ? 0 : Math.sin(this.attackAnimProgress * Math.PI) * (this.size * 0.2);
        let direction = 1;
        if (!isPreview && this.target) {
            direction = Math.sign(this.target.x - this.x);
            if (direction === 0) { // Fix: ensure direction is never 0
                direction = 1;
            }
        }
        
        const tiltAngle = this.walkCycle === 0 ? 0 : Math.sin(this.walkCycle) * (Math.PI / 32);
    
        // Call the centralized drawing function
        drawHeroCharacter(
            ctx,
            this.x,
            this.y,
            this.size,
            direction,
            tiltAngle,
            lunge,
            this.combatStats,
            this.equippedItems
        );
    
        ctx.restore();

        // Draw Maple Leaf cooldown indicator
        if (!isPreview && this.mapleLeafPassiveReady) {
            const pulse = 1 + Math.sin(Date.now() * 0.006) * 0.15;
            const fontSize = 16 * pulse;
            ctx.font = `bold ${fontSize}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            const yPosition = this.y - this.size * 1.6; // Position above the hero's head
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 4;
            ctx.fillText('🍁', this.x, yPosition);
            ctx.shadowBlur = 0;
        }

        if (!isPreview && this.equippedItems?.enchantment?.name === 'Balão Vermelho' && this.redBalloonStacks > 0) {
            const balloonSize = 12 + this.redBalloonStacks * 3;
            ctx.font = `${balloonSize}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            const yPosition = this.y - this.size * 1.6;
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 4;
            ctx.fillText('🎈', this.x, yPosition);
            ctx.shadowBlur = 0;
        }

        // Draw overlays that shouldn't be scaled (health bar, etc.)
        if (!isPreview) {
            super.draw(ctx, isPreview, isDragged); // Draw health bar, buff icons
            this.drawFuryBar(ctx);
            this.drawCorruptionBar(ctx);
            this.drawCompositionBar(ctx);
            const blockBuff = this.activeBuffs.find(b => b.effects.blockCharges);
            if (blockBuff?.effects.blockCharges) {
                this.drawOrbitingShields(ctx, blockBuff.effects.blockCharges);
            }
        }
    }
}
