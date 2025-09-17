import type { CombatCapable, UpdateResult, EventDispatcher } from '../entityInterfaces';
import type { Ability } from '../../../types';
import { distanceToTarget } from '../entityUtils';
import { DamageNumber } from '../entities/DamageNumber';
import { DeathEffect } from '../entities/DeathEffect';
import type { HeroEntity } from '../entities/HeroEntity';

export const assassinoModoOculto = (caster: CombatCapable, ability: Ability, allHeroes: CombatCapable[], allEnemies: CombatCapable[], dispatcher: EventDispatcher): UpdateResult[] => {
    caster.applyBuff({
        id: `${ability.id}_${caster.id}`,
        abilityId: ability.id,
        name: ability.name,
        icon: ability.icon,
        durationMs: ability.durationMs!,
        remainingMs: ability.durationMs!,
        effects: { isInvisible: true },
        appliedAt: Date.now(),
        isBuff: true,
        sourceEntityId: caster.id,
        targetEntityId: caster.id,
    });
    return [{ newVfx: { type: 'MODO_OCULTO_SMOKE', target: caster } }];
};

export const assassinoAgilidadeExtrema = (caster: CombatCapable, ability: Ability, allHeroes: CombatCapable[], allEnemies: CombatCapable[], dispatcher: EventDispatcher): UpdateResult[] => {
    const props = ability.properties;
    if (!props) return [];

    const isStealthed = caster.activeBuffs.some(b => b.effects.isInvisible);
    const multiplier = isStealthed ? (props.stealthBonusMultiplier || 1) : 1;

    const buffEffects = {
        chanceEsquivaPercent: (props.chanceEsquivaPercent || 0) * multiplier,
        velocidadeAtaquePercent: (props.velocidadeAtaquePercent || 0) * multiplier,
        velocidadeMovimentoPercent: (props.velocidadeMovimentoPercent || 0) * multiplier,
    };

    caster.applyBuff({
        id: `${ability.id}_${caster.id}`,
        abilityId: ability.id,
        name: ability.name,
        icon: ability.icon,
        durationMs: ability.durationMs!,
        remainingMs: ability.durationMs!,
        effects: buffEffects,
        appliedAt: Date.now(),
        isBuff: true,
        sourceEntityId: caster.id,
        targetEntityId: caster.id,
    });
    return [{ newVfx: { type: 'AGILIDADE_EXTREMA', target: caster, duration: ability.durationMs! } }];
};

export const assassinoGolpeDuplo = (caster: CombatCapable, ability: Ability, allHeroes: CombatCapable[], allEnemies: CombatCapable[], dispatcher: EventDispatcher): UpdateResult[] => {
    const results: UpdateResult[] = [];
    const props = ability.properties;
    if (!props || !caster.target || !caster.target.isAlive) return [];

    const potentialTargets = (caster as HeroEntity).isOpponent ? allHeroes : allEnemies;
    const abilityRange = props.range || caster.range;
    const distance = distanceToTarget(caster, caster.target);
    if (distance > abilityRange) {
        return []; 
    }
    
    const isStealthed = caster.activeBuffs.some(b => b.effects.isInvisible);

    const performHit = (target: CombatCapable): UpdateResult[] => {
        const hitResults: UpdateResult[] = [];
        const damage = caster.effectiveDamage + caster.combatStats.letalidade * props.damageLethalityMultiplier;
        const isCrit = isStealthed || (Math.random() * 100 < caster.combatStats.chanceCritica);

        const oldHp = target.currentHp;
        const dmgTaken = target.takeDamage(damage, isCrit, caster);

        dispatcher.dispatchEvent('DAMAGE_TAKEN', { target: target, attacker: caster, amount: typeof dmgTaken === 'number' ? dmgTaken : 0, result: typeof dmgTaken === 'number' ? 'hit' : dmgTaken, isCrit: isCrit, abilityId: ability.id });
        if (typeof dmgTaken === 'number') {
            dispatcher.dispatchEvent('DAMAGE_DEALT', { attacker: caster, target: target, amount: dmgTaken, isCrit: isCrit, abilityId: ability.id });
            const afterDamageResults = caster.afterDealingDamage(dmgTaken, target, potentialTargets);
            hitResults.push(...afterDamageResults);
        }

        if (caster.isPlayer || target.isPlayer) {
            if (typeof dmgTaken === 'number') {
                hitResults.push({ newDamageNumber: new DamageNumber(dmgTaken, target.x, target.y, isCrit ? 'red' : 'white') });
            }
        }

        if (target.currentHp <= 0 && oldHp > 0 && !target.deathEffectCreated) {
            hitResults.push({ newEffect: new DeathEffect(target.x, target.y, '#757575') });
            target.deathEffectCreated = true;
            dispatcher.dispatchEvent('ENTITY_DIED', { victim: target, killer: caster });
        }
        return hitResults;
    };

    results.push(...performHit(caster.target));

    const secondHitTarget = caster.target;
    dispatcher.addDelayedAction(props.hitIntervalMs, () => {
        if (secondHitTarget.isAlive) {
            return performHit(secondHitTarget);
        }
        return [];
    });

    return results;
};

export const assassinoApunhalar = (caster: CombatCapable, ability: Ability, allHeroes: CombatCapable[], allEnemies: CombatCapable[], dispatcher: EventDispatcher): UpdateResult[] => {
    const results: UpdateResult[] = [];
    const props = ability.properties;
    if (!props) return [];

    const potentialTargets = (caster as HeroEntity).isOpponent ? allHeroes : allEnemies;
    const livingTargets = potentialTargets.filter(e => e.isAlive);
    const abilityRange = props.range || caster.range;

    // Filter for targets within range first
    const targetsInRange = livingTargets.filter(t => distanceToTarget(caster, t) <= abilityRange);

    if (targetsInRange.length === 0) {
        // No valid targets within the ability's range, so fail.
        // This returns an empty array, which the GameContainer interprets as 'out of range'.
        return [];
    }

    // From the valid targets, find the one that is farthest away
    let farthestTargetInRange: CombatCapable | null = null;
    let maxDistanceInRange = -1;
    for (const t of targetsInRange) {
        const dist = distanceToTarget(caster, t);
        if (dist > maxDistanceInRange) {
            maxDistanceInRange = dist;
            farthestTargetInRange = t;
        }
    }

    // This should always find a target if targetsInRange is not empty.
    if (!farthestTargetInRange) {
        return [];
    }

    const target = farthestTargetInRange;
    
    // --- Logic is the same as before, just using the new `target` ---

    const fromX = caster.x;
    const fromY = caster.y;

    // Teleport behind the new target, relative to caster's original position
    const angleToTarget = Math.atan2(target.y - fromY, target.x - fromX);
    caster.x = target.x - Math.cos(angleToTarget) * (target.size);
    caster.y = target.y - Math.sin(angleToTarget) * (target.size);

    const isStealthed = caster.activeBuffs.some(b => b.effects.isInvisible);
    const damage = caster.effectiveDamage + caster.combatStats.letalidade * props.damageLethalityMultiplier;
    const isCrit = isStealthed || (Math.random() * 100 < caster.combatStats.chanceCritica);

    const oldHp = target.currentHp;
    const dmgTaken = target.takeDamage(damage, isCrit, caster);

    dispatcher.dispatchEvent('DAMAGE_TAKEN', { target: target, attacker: caster, amount: typeof dmgTaken === 'number' ? dmgTaken : 0, result: typeof dmgTaken === 'number' ? 'hit' : dmgTaken, isCrit: isCrit, abilityId: ability.id });
    if (typeof dmgTaken === 'number') {
        dispatcher.dispatchEvent('DAMAGE_DEALT', { attacker: caster, target: target, amount: dmgTaken, isCrit: isCrit, abilityId: ability.id });
        const afterDamageResults = caster.afterDealingDamage(dmgTaken, target, potentialTargets);
        results.push(...afterDamageResults);
    }

    if (caster.isPlayer || target.isPlayer) {
        if (typeof dmgTaken === 'number') {
            results.push({ newDamageNumber: new DamageNumber(dmgTaken, target.x, target.y, isCrit ? 'red' : 'white') });
        }
    }

    if (target.currentHp <= 0 && oldHp > 0 && !target.deathEffectCreated) {
        results.push({ newEffect: new DeathEffect(target.x, target.y, '#757575') });
        target.deathEffectCreated = true;
        dispatcher.dispatchEvent('ENTITY_DIED', { victim: target, killer: caster });
    }

    const debuffTemplate = props.debuff;
    if (debuffTemplate) {
        target.applyDebuff({
            id: `${debuffTemplate.id}_${target.id}_${Date.now()}`,
            abilityId: debuffTemplate.id, name: debuffTemplate.name, icon: debuffTemplate.icon,
            durationMs: debuffTemplate.durationMs, remainingMs: debuffTemplate.durationMs,
            effects: { ...debuffTemplate.effects }, appliedAt: Date.now(), isBuff: false, sourceEntityId: caster.id
        });
    }

    results.push({ newVfx: { type: 'APUNHALAR_TELEPORT', fromX: fromX, fromY: fromY, toX: caster.x, toY: caster.y } });
    return results;
};
