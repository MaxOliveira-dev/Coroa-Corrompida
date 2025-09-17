import type { CombatCapable, UpdateResult, EventDispatcher } from '../entityInterfaces';
import type { Ability } from '../../../types';
import { distanceToTarget } from '../entityUtils';
import { DamageNumber } from '../entities/DamageNumber';
import { DeathEffect } from '../entities/DeathEffect';
import type { HeroEntity } from '../entities/HeroEntity';

export const guardiaoGolpeDeEscudo = (caster: CombatCapable, ability: Ability, allHeroes: CombatCapable[], allEnemies: CombatCapable[], dispatcher: EventDispatcher): UpdateResult[] => {
    const results: UpdateResult[] = [];
    const props = ability.properties;
    if (!props || !caster.target || !caster.target.isAlive) return [];

    const potentialTargets = (caster as HeroEntity).isOpponent ? allHeroes : allEnemies;
    const distance = distanceToTarget(caster, caster.target);
    if (distance > caster.range) {
        return []; // Out of range
    }

    const target = caster.target;
    const damage = caster.maxHp * (props.bonusDamagePercentCasterMaxHp / 100) + caster.effectiveDamage;
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

    target.applyDebuff({
        id: `stun_${target.id}_shieldbash`, abilityId: 'GUARDIÃO_GOLPE_DE_ESCUDO_STUN', name: 'Atordoado',
        icon: '💫', durationMs: props.stunDurationMs, remainingMs: props.stunDurationMs,
        effects: { isImmobile: true }, appliedAt: Date.now(), isBuff: false, sourceEntityId: caster.id,
    });
    
    results.push({ newVfx: { type: 'SHIELD_BASH_IMPACT', x: target.x, y: target.y } });
    results.push({ newVfx: { type: 'STUN', target: target, duration: props.stunDurationMs } });
    
    return results;
};

export const guardiaoProvocar = (caster: CombatCapable, ability: Ability, allHeroes: CombatCapable[], allEnemies: CombatCapable[], dispatcher: EventDispatcher): UpdateResult[] => {
    const results: UpdateResult[] = [];
    const props = ability.properties;
    if (!props) return [];

    const potentialTargets = (caster as HeroEntity).isOpponent ? allHeroes : allEnemies;

    caster.applyBuff({
        id: `provoke_self_${caster.id}`, abilityId: 'GUARDIÃO_PROVOCAR_SELF', name: 'Provocar',
        icon: '🤬', durationMs: ability.durationMs!, remainingMs: ability.durationMs!,
        effects: { resistenciaFlat: props.resistanceBonusFlat }, appliedAt: Date.now(), isBuff: true, sourceEntityId: caster.id,
    });

    const enemiesInArea = potentialTargets.filter(e => e.isAlive && distanceToTarget(caster, e) <= props.radius);
    enemiesInArea.forEach(enemy => {
        enemy.applyDebuff({
            id: `taunt_${enemy.id}_from_${caster.id}`, abilityId: 'GUARDIÃO_PROVOCAR_TAUNT', name: 'Provocado',
            icon: '🤬', durationMs: ability.durationMs!, remainingMs: ability.durationMs!,
            effects: { isTaunted: true }, appliedAt: Date.now(), isBuff: false, sourceEntityId: caster.id,
        });
    });
    
    results.push({ newVfx: { type: 'TAUNT', target: caster, radius: props.radius } });
    
    return results;
};

export const guardiaoForcaDeBloqueio = (caster: CombatCapable, ability: Ability, allHeroes: CombatCapable[], allEnemies: CombatCapable[], dispatcher: EventDispatcher): UpdateResult[] => {
    caster.applyBuff({ 
        id: ability.id, 
        abilityId: ability.id, 
        name: ability.name, 
        icon: ability.icon, 
        durationMs: ability.durationMs || 15000, 
        remainingMs: ability.durationMs || 15000, 
        effects: { blockCharges: ability.properties?.blockCharges || 2 }, 
        appliedAt: Date.now(), 
        isBuff: true, 
        sourceEntityId: caster.id, 
        targetEntityId: caster.id 
    });
    return [];
};

export const guardiaoProtecaoCompartilhada = (caster: CombatCapable, ability: Ability, allHeroes: CombatCapable[], allEnemies: CombatCapable[], dispatcher: EventDispatcher): UpdateResult[] => {
    const shieldAmount = caster.maxHp * ((ability.properties?.shieldHpPercentOfCasterMaxHp || 0) / 100);
    const potentialAllies = (caster as HeroEntity).isOpponent ? allEnemies : allHeroes;
    const livingHeroes = potentialAllies.filter(ally => ally.isAlive);
    
    livingHeroes.forEach(ally => {
        ally.applyShield(shieldAmount);
        dispatcher.dispatchEvent('SHIELD_APPLIED', { caster: caster, target: ally, amount: shieldAmount });
    });
    
    caster.shieldingGranted += shieldAmount * livingHeroes.length;
    
    const healthThreshold = (ability.properties?.healthThresholdPercent || 0) / 100 || 0.7;
    if (caster.currentHp / caster.maxHp > healthThreshold) {
        caster.applyBuff({ 
            id: `${ability.id}_vigor`, 
            abilityId: ability.id, 
            name: 'Vigor Extra', 
            icon: '❤️‍🔥', 
            durationMs: ability.properties?.buffDurationMs || 6000, 
            remainingMs: ability.properties?.buffDurationMs || 6000, 
            effects: { vigorPercent: ability.properties?.conditionalVigorBonusPercent || 50 }, 
            appliedAt: Date.now(), 
            isBuff: true, 
            sourceEntityId: caster.id, 
            targetEntityId: caster.id 
        });
    }
    
    return [{ newVfx: { type: 'PROTECAO_COMPARTILHADA', targets: livingHeroes } }];
};