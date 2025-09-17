import type { CombatCapable, UpdateResult, EventDispatcher } from '../entityInterfaces';
import { distanceToTarget } from '../entityUtils';
import { DamageNumber } from '../entities/DamageNumber';
import type { PassiveEffect } from '../../../types';

interface EffectContext {
    caster: CombatCapable;
    allHeroes: CombatCapable[];
    allEnemies: CombatCapable[];
    dispatcher: EventDispatcher;
}

function executeDealDamageOnArea(effect: PassiveEffect, context: EffectContext): UpdateResult[] {
    const results: UpdateResult[] = [];
    const { caster, allHeroes, allEnemies, dispatcher } = context;
    const { radius, damage: damageConfig } = effect.properties;

    if (!damageConfig) return [];

    // Determine the correct list of targets based on who the caster is.
    const potentialTargets = caster.isPartOfPlayerTeam() ? allEnemies : allHeroes;

    let damage = 0;
    switch (damageConfig.type) {
        case 'vigor_scaling':
            damage = caster.combatStats.vigor * (damageConfig.multiplier || 1);
            break;
        case 'lethality_scaling':
            damage = caster.combatStats.letalidade * (damageConfig.multiplier || 1);
            break;
        case 'flat':
            damage = damageConfig.baseValue || 0;
            break;
    }

    if (damage <= 0) return [];

    // Determine if it's a critical hit based on caster's stats
    const isCrit = !!(caster.combatStats.chanceCritica && Math.random() * 100 < caster.combatStats.chanceCritica);

    if (isCrit) {
        damage = Math.round(damage * (1 + (caster.combatStats.danoCritico || 50) / 100));
    }
    
    const roundedDamage = Math.round(damage);

    const enemiesToHit = potentialTargets.filter(e => e.isAlive && distanceToTarget(caster, e) <= radius);

    enemiesToHit.forEach(enemy => {
        const dmgTaken = enemy.takeDamage(roundedDamage, isCrit, caster);

        dispatcher.dispatchEvent('DAMAGE_TAKEN', { target: enemy, attacker: caster, amount: typeof dmgTaken === 'number' ? dmgTaken : 0, result: typeof dmgTaken === 'number' ? 'hit' : dmgTaken, isCrit: isCrit, abilityId: 'PASSIVE_ITEM_EFFECT' });

        if (typeof dmgTaken === 'number') {
            dispatcher.dispatchEvent('DAMAGE_DEALT', { attacker: caster, target: enemy, amount: dmgTaken, isCrit: isCrit, abilityId: 'PASSIVE_ITEM_EFFECT' });
            if (caster.isPlayer || enemy.isPlayer) {
                const damageColor = isCrit ? 'red' : 'white';
                results.push({ newDamageNumber: new DamageNumber(dmgTaken, enemy.x, enemy.y, damageColor) });
            }
        }
    });

    return results;
}

function executeApplyDebuffOnArea(effect: PassiveEffect, context: EffectContext): UpdateResult[] {
    const { caster, allHeroes, allEnemies } = context;
    const { radius, debuff: debuffTemplate } = effect.properties;

    if (!debuffTemplate) return [];

    // Determine the correct list of targets based on who the caster is.
    const potentialTargets = caster.isPartOfPlayerTeam() ? allEnemies : allHeroes;

    const enemiesToHit = potentialTargets.filter(e => e.isAlive && distanceToTarget(caster, e) <= radius);

    enemiesToHit.forEach(enemy => {
        enemy.applyDebuff({
            id: `${debuffTemplate.id}_${enemy.id}_${Date.now()}`,
            abilityId: debuffTemplate.id,
            name: debuffTemplate.name,
            icon: debuffTemplate.icon,
            durationMs: debuffTemplate.durationMs,
            remainingMs: debuffTemplate.durationMs,
            effects: { ...debuffTemplate.effects },
            appliedAt: Date.now(),
            isBuff: false,
            sourceEntityId: caster.id
        });
    });

    return []; // Applying debuffs doesn't usually create immediate update results like damage numbers.
}

export function executeEffect(effect: PassiveEffect, context: EffectContext): UpdateResult[] {
    switch (effect.type) {
        case 'deal_damage_on_area':
            return executeDealDamageOnArea(effect, context);
        case 'apply_debuff_on_area':
            return executeApplyDebuffOnArea(effect, context);
        default:
            return [];
    }
}