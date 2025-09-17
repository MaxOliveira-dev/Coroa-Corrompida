import type { CombatCapable, UpdateResult, EventDispatcher } from '../entityInterfaces';
import type { Ability } from '../../../types';
import { distanceToTarget } from '../entityUtils';
import { DamageNumber } from '../entities/DamageNumber';
import { DeathEffect } from '../entities/DeathEffect';
import type { HeroEntity } from '../entities/HeroEntity';

export const aventureiroSocoSerioHandler = (caster: CombatCapable, ability: Ability, allHeroes: CombatCapable[], allEnemies: CombatCapable[], dispatcher: EventDispatcher): UpdateResult[] => {
    const results: UpdateResult[] = [];
    const potentialTargets = (caster as HeroEntity).isOpponent ? allHeroes : allEnemies;
    const props = ability.properties;
    if (!props || !caster.target || !caster.target.isAlive) return [];

    // Add range check
    const distance = distanceToTarget(caster, caster.target);
    if (distance > caster.range) {
        return []; // Return empty array to signal failure (out of range)
    }

    const target = caster.target;
    const damage = caster.effectiveDamage + target.maxHp * (props.bonusDamagePercentTargetMaxHp / 100);
    const isCrit = Math.random() * 100 < caster.combatStats.chanceCritica;

    const oldHp = target.currentHp;
    const dmgTaken = target.takeDamage(damage, isCrit, caster);
    
    dispatcher.dispatchEvent('DAMAGE_TAKEN', { target: target, attacker: caster, amount: typeof dmgTaken === 'number' ? dmgTaken : 0, result: typeof dmgTaken === 'number' ? 'hit' : dmgTaken, isCrit: isCrit, abilityId: ability.id });
    if (typeof dmgTaken === 'number') {
        dispatcher.dispatchEvent('DAMAGE_DEALT', { attacker: caster, target: target, amount: dmgTaken, isCrit: isCrit, abilityId: ability.id });
        const afterDamageResults = caster.afterDealingDamage(dmgTaken, target, potentialTargets);
        results.push(...afterDamageResults);

        if (caster.isPlayer || target.isPlayer) {
            results.push({ newDamageNumber: new DamageNumber(dmgTaken, target.x, target.y, isCrit ? 'red' : 'white') });
        }
    } else if (dmgTaken === 'esquiva') {
        if (caster.isPlayer || target.isPlayer) {
            results.push({ newDamageNumber: new DamageNumber("Esquiva!", target.x, target.y, 'white') });
        }
    }

    if (target.currentHp <= 0 && oldHp > 0) {
         results.push({ newEffect: new DeathEffect(target.x, target.y, '#757575') });
         dispatcher.dispatchEvent('ENTITY_DIED', { victim: target, killer: caster });
    }
    
    results.push({ newVfx: { type: 'SOCO_SERIO_HIT', x: target.x, y: target.y } });

    return results;
};