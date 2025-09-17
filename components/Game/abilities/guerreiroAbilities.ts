import type { CombatCapable, UpdateResult, EventDispatcher } from '../entityInterfaces';
import type { Ability } from '../../../types';
import { distanceToTarget, isTargetInCone } from '../entityUtils';
import { DamageNumber } from '../entities/DamageNumber';
import { DeathEffect } from '../entities/DeathEffect';
import type { HeroEntity } from '../entities/HeroEntity';

export const guerreiroTornadoMortal = (caster: CombatCapable, ability: Ability, allHeroes: CombatCapable[], allEnemies: CombatCapable[], dispatcher: EventDispatcher): UpdateResult[] => {
    const results: UpdateResult[] = [];
    const props = ability.properties;
    if (!props) return [];

    const potentialTargets = (caster as HeroEntity).isOpponent ? allHeroes : allEnemies;
    const enemiesInArea = potentialTargets.filter(e => e.isAlive && distanceToTarget(caster, e) <= props.radius);

    let damage = caster.effectiveDamage + caster.combatStats.letalidade * props.damageLethalityMultiplier + caster.combatStats.vigor * props.damageVigorMultiplier;
    
    const isMaxFury = caster.furia !== undefined && caster.maxFuria !== undefined && caster.furia >= caster.maxFuria;
    const isCritFromChance = Math.random() * 100 < caster.combatStats.chanceCritica;
    const isCrit = isMaxFury || isCritFromChance;

    if (isCrit) {
        damage = Math.round(damage * (1 + (caster.combatStats.danoCritico || 50) / 100));
    }

    enemiesInArea.forEach(enemy => {
        const oldHp = enemy.currentHp;
        const dmgTaken = enemy.takeDamage(damage, isCrit, caster);
        
        dispatcher.dispatchEvent('DAMAGE_TAKEN', { target: enemy, attacker: caster, amount: typeof dmgTaken === 'number' ? dmgTaken : 0, result: typeof dmgTaken === 'number' ? 'hit' : dmgTaken, isCrit: isCrit, abilityId: ability.id });
        if (typeof dmgTaken === 'number') {
            dispatcher.dispatchEvent('DAMAGE_DEALT', { attacker: caster, target: enemy, amount: dmgTaken, isCrit: isCrit, abilityId: ability.id });
            const afterDamageResults = caster.afterDealingDamage(dmgTaken, enemy, potentialTargets);
            results.push(...afterDamageResults);
        }

        if (caster.isPlayer || enemy.isPlayer) {
            if (typeof dmgTaken === 'number') {
                results.push({ newDamageNumber: new DamageNumber(dmgTaken, enemy.x, enemy.y, isCrit ? 'red' : 'white') });
            } else if (dmgTaken === 'esquiva') {
                results.push({ newDamageNumber: new DamageNumber("Esquiva!", enemy.x, enemy.y, 'white') });
            }
        }
        if (enemy.currentHp <= 0 && oldHp > 0 && !enemy.deathEffectCreated) {
            results.push({ newEffect: new DeathEffect(enemy.x, enemy.y, enemy.isBoss ? '#C62828' : '#757575', enemy.isBoss ? 35 : 15, enemy.isBoss ? 60 : 30) });
            enemy.deathEffectCreated = true;
            dispatcher.dispatchEvent('ENTITY_DIED', { victim: enemy, killer: caster });
        }
    });

    if (isMaxFury) {
        if (caster.furia !== undefined) caster.furia = 0;
    }
    
    results.push({ newVfx: { type: 'TORNADO_MORTAL', target: caster, radius: props.radius, duration: 500 } });
    return results;
};

export const guerreiroCorteCrescente = (caster: CombatCapable, ability: Ability, allHeroes: CombatCapable[], allEnemies: CombatCapable[], dispatcher: EventDispatcher): UpdateResult[] => {
    const results: UpdateResult[] = [];
    const props = ability.properties;
    if (!props) return [];

    const potentialTargets = (caster as HeroEntity).isOpponent ? allHeroes : allEnemies;
    const isMaxFury = caster.furia !== undefined && caster.maxFuria !== undefined && caster.furia >= caster.maxFuria;

    const castSlash = (): UpdateResult[] => {
        const castResults: UpdateResult[] = [];
        const casterAngle = caster.target ? Math.atan2(caster.target.y - caster.y, caster.target.x - caster.x) : 0;
        const coneAngleRad = (props.coneAngle || 60) * (Math.PI / 180);
        const coneRange = props.coneRange || 120;

        const enemiesInCone = potentialTargets.filter(e => e.isAlive && isTargetInCone(caster.x, caster.y, e.x, e.y, coneRange, coneAngleRad, casterAngle));
        
        if (enemiesInCone.length === 0) {
            return [];
        }

        castResults.push({ newVfx: { type: 'CONE_SLASH', target: caster, range: coneRange, coneAngle: props.coneAngle, color: caster.color } });

        const damage = caster.effectiveDamage + 
                       caster.combatStats.letalidade * props.damageLethalityMultiplier + 
                       caster.combatStats.vigor * props.damageVigorMultiplier;
        
        enemiesInCone.forEach(enemy => {
            const oldHp = enemy.currentHp;
            const dmgTaken = enemy.takeDamage(damage, false, caster);

            dispatcher.dispatchEvent('DAMAGE_TAKEN', { target: enemy, attacker: caster, amount: typeof dmgTaken === 'number' ? dmgTaken : 0, result: typeof dmgTaken === 'number' ? 'hit' : dmgTaken, isCrit: false, abilityId: ability.id });

            if (typeof dmgTaken === 'number') {
                dispatcher.dispatchEvent('DAMAGE_DEALT', { attacker: caster, target: enemy, amount: dmgTaken, isCrit: false, abilityId: ability.id });
                const afterDamageResults = caster.afterDealingDamage(dmgTaken, enemy, potentialTargets);
                castResults.push(...afterDamageResults);

                if (caster.isPlayer) {
                    castResults.push({ newDamageNumber: new DamageNumber(dmgTaken, enemy.x, enemy.y, 'white') });
                }
            }

            if (enemy.currentHp <= 0 && oldHp > 0 && !enemy.deathEffectCreated) {
                castResults.push({ newEffect: new DeathEffect(enemy.x, enemy.y, enemy.isBoss ? '#C62828' : '#757575', enemy.isBoss ? 35 : 15, enemy.isBoss ? 60 : 30) });
                enemy.deathEffectCreated = true;
                dispatcher.dispatchEvent('ENTITY_DIED', { victim: enemy, killer: caster });
            }

            const debuffTemplate = props.debuff;
            if (debuffTemplate) {
                enemy.applyDebuff({
                    id: `${debuffTemplate.id}_${enemy.id}`, abilityId: debuffTemplate.id, name: debuffTemplate.name,
                    icon: debuffTemplate.icon, durationMs: debuffTemplate.durationMs, remainingMs: debuffTemplate.durationMs,
                    effects: { ...debuffTemplate.effects }, appliedAt: Date.now(), isBuff: false, sourceEntityId: caster.id,
                    maxStacks: debuffTemplate.maxStacks,
                });
            }
        });

        return castResults;
    };

    results.push(...castSlash());

    if (isMaxFury && props.furySynergy?.castTwice) {
        if (caster.furia !== undefined) caster.furia = 0;
        dispatcher.addDelayedAction(250, castSlash);
    }

    return results;
};

export const guerreiroRegeneracaoDeCombate = (caster: CombatCapable, ability: Ability, allHeroes: CombatCapable[], allEnemies: CombatCapable[], dispatcher: EventDispatcher): UpdateResult[] => {
    const results: UpdateResult[] = [];
    const props = ability.properties;
    if (!props) return [];

    const isMaxFury = caster.furia !== undefined && caster.maxFuria !== undefined && caster.furia >= caster.maxFuria;

    const mainBuffTemplate = props.mainBuff;
    if (mainBuffTemplate) {
        const buffEffects = { ...mainBuffTemplate.effects };
        if (isMaxFury && props.maxFuryBonusEffect) {
            Object.assign(buffEffects, props.maxFuryBonusEffect);
        }

        caster.applyBuff({
            id: `${mainBuffTemplate.id}_${caster.id}`, abilityId: mainBuffTemplate.id, name: mainBuffTemplate.name, icon: mainBuffTemplate.icon,
            durationMs: mainBuffTemplate.durationMs, remainingMs: mainBuffTemplate.durationMs,
            effects: buffEffects, appliedAt: Date.now(), isBuff: true, sourceEntityId: caster.id, targetEntityId: caster.id,
        });
        results.push({ newVfx: { type: 'VIGOR_DE_BATALHA', target: caster, duration: mainBuffTemplate.durationMs } });
    }

    if (isMaxFury) {
        const hotBuffTemplate = props.maxFuryHotBuff;
        if (hotBuffTemplate) {
            const baseHealPerTick = caster.maxHp * (hotBuffTemplate.effects.hot.healPercentOfMaxHp / 100);
            caster.applyBuff({
                id: `${hotBuffTemplate.id}_${caster.id}`, abilityId: hotBuffTemplate.id, name: hotBuffTemplate.name, icon: hotBuffTemplate.icon,
                durationMs: hotBuffTemplate.durationMs, remainingMs: hotBuffTemplate.durationMs,
                effects: { hot: { tickIntervalMs: hotBuffTemplate.effects.hot.tickIntervalMs, healPerTick: baseHealPerTick, sourceCasterId: caster.id } },
                appliedAt: Date.now(), isBuff: true, sourceEntityId: caster.id, targetEntityId: caster.id,
            });
        }
        if (caster.furia !== undefined) caster.furia = 0;
    } else {
        const healProps = props.instantHeal;
        if (healProps) {
            const baseHealAmount = caster.effectiveDamage + (caster.combatStats.letalidade * healProps.lethalityMultiplier) + (caster.combatStats.vigor * healProps.vigorMultiplier);
            const finalHealAmount = baseHealAmount * (1 + (caster.combatStats.curaRecebidaBonus || 0) / 100);
            const roundedHeal = Math.round(finalHealAmount);
            
            const oldHp = caster.currentHp;
            caster.receiveHeal(roundedHeal, caster);
            const actualHeal = caster.currentHp - oldHp;
            caster.healingDone += actualHeal;
        
            dispatcher.dispatchEvent('HEAL_PERFORMED', { caster: caster, target: caster, amount: actualHeal, isCrit: false });
            
            if (caster.isPlayer) {
                results.push({ newDamageNumber: new DamageNumber(`+${roundedHeal}`, caster.x, caster.y, 'green') });
            }
        }
    }
    
    results.push({ newVfx: { type: 'REGENERACAO_DE_BATALHA', target: caster, isMaxFury: isMaxFury } });
    return results;
};

export const guerreiroInterceptar = (caster: CombatCapable, ability: Ability, allHeroes: CombatCapable[], allEnemies: CombatCapable[], dispatcher: EventDispatcher): UpdateResult[] => {
    const results: UpdateResult[] = [];
    const potentialTargets = (caster as HeroEntity).isOpponent ? allHeroes : allEnemies;
    const livingEnemies = potentialTargets.filter(e => e.isAlive);
    if (livingEnemies.length === 0) { 
        return []; 
    }
    livingEnemies.sort((a, b) => distanceToTarget(caster, a) - distanceToTarget(caster, b));
    const nearestEnemy = livingEnemies[0];

    let isDoubled = false;
    const doubleDamageBuffIndex = caster.activeBuffs.findIndex(b => b.effects.nextAbilityDoubleDamage);
    if (doubleDamageBuffIndex !== -1) {
        isDoubled = true;
        caster.activeBuffs.splice(doubleDamageBuffIndex, 1);
        caster.recalculateStats();
    }

    caster.applyBuff({
        id: ability.id, abilityId: ability.id, name: 'Interceptando', icon: ability.icon,
        durationMs: ability.durationMs || 2000, remainingMs: ability.durationMs || 2000,
        effects: { dashToTarget: { targetId: nearestEnemy.id, speedMultiplier: ability.properties?.speedMultiplier, onHitEffect: { ...ability.properties?.onHitEffect, isDoubled }, } },
        appliedAt: Date.now(), isBuff: true, sourceEntityId: caster.id, targetEntityId: caster.id
    });
    results.push({ newVfx: { type: 'INTERCEPTAR_TRAIL', target: caster, duration: ability.durationMs || 2000 } });
    return results;
};