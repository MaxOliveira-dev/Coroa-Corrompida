import type { CombatCapable, UpdateResult, EventDispatcher } from '../entityInterfaces';
import type { Ability } from '../../../types';
import { distanceToTarget } from '../entityUtils';
import { DamageNumber } from '../entities/DamageNumber';
import type { HeroEntity } from '../entities/HeroEntity';

export const paladinoQuebraLuz = (caster: CombatCapable, ability: Ability, allHeroes: CombatCapable[], allEnemies: CombatCapable[], dispatcher: EventDispatcher): UpdateResult[] => {
    const results: UpdateResult[] = [];
    const props = ability.properties;
    if (!props || !caster.target || !caster.target.isAlive || distanceToTarget(caster, caster.target) > caster.range) {
        return [];
    }
    const potentialTargets = (caster as HeroEntity).isOpponent ? allHeroes : allEnemies;
    const target = caster.target;
    const damage = caster.effectiveDamage + (caster.combatStats.vigor * (props.damageVigorMultiplier || 0)) + (props.bonusDamageFromResistance ? caster.combatStats.resistencia : 0);
    const dmgTaken = target.takeDamage(damage, false, caster, { neverMiss: true });

    dispatcher.dispatchEvent('DAMAGE_TAKEN', { target, attacker: caster, amount: typeof dmgTaken === 'number' ? dmgTaken : 0, result: typeof dmgTaken === 'number' ? 'hit' : dmgTaken, isCrit: false, abilityId: ability.id });

    if (typeof dmgTaken === 'number') {
        results.push({ newDamageNumber: new DamageNumber(Math.round(dmgTaken), target.x, target.y, 'white') });
        results.push(...caster.afterDealingDamage(dmgTaken, target, potentialTargets));
        dispatcher.dispatchEvent('DAMAGE_DEALT', { attacker: caster, target, amount: dmgTaken, isCrit: false, abilityId: ability.id });
    }

    if (caster.corruption !== undefined && caster.maxCorruption !== undefined && props.corruptionGain) {
        caster.corruption = Math.min(caster.maxCorruption, caster.corruption + props.corruptionGain);
    }

    const synergyProps = props.synergy;
    if (synergyProps && caster.activeBuffs.some(b => b.abilityId === synergyProps.requiredBuffId)) {
        const dotTemplate = synergyProps.applyDot;
        const dotEffectsTemplate = dotTemplate.effects.dot;
        const damagePerTick = (caster.combatStats.vigor * (dotEffectsTemplate.damageVigorMultiplier || 0)) + (caster.maxHp * (dotEffectsTemplate.damagePercentCasterMaxHp / 100));
        target.applyDebuff({
            id: `${dotTemplate.id}_${target.id}_${Date.now()}`, abilityId: dotTemplate.id, name: dotTemplate.name, icon: dotTemplate.icon,
            durationMs: dotTemplate.durationMs, remainingMs: dotTemplate.durationMs, isBuff: false, sourceEntityId: caster.id, targetEntityId: target.id, appliedAt: Date.now(),
            effects: { dot: { tickIntervalMs: dotEffectsTemplate.tickIntervalMs, damagePerTick: Math.max(1, Math.round(damagePerTick)), sourceCasterId: caster.id } }
        });
    }
    results.push({ newVfx: { type: 'QUEBRA_LUZ', target: caster.target } });
    return results;
};

export const paladinoAbsolvicaoCruel = (caster: CombatCapable, ability: Ability, allHeroes: CombatCapable[], allEnemies: CombatCapable[], dispatcher: EventDispatcher): UpdateResult[] => {
    const results: UpdateResult[] = [];
    const props = ability.properties;
    if (!props || !props.heal) return [];
    
    const potentialAllies = (caster as HeroEntity).isOpponent ? allEnemies : allHeroes;
    const allAlliesAndSelf = potentialAllies.filter(a => a.isAlive);
    const isMaxCorruption = caster.corruption !== undefined && caster.maxCorruption !== undefined && caster.corruption >= caster.maxCorruption;
    let healAmount = (caster.combatStats.poderDeCura * props.heal.powerOfHealingMultiplier) + (caster.maxHp * (props.heal.casterMaxHpPercent / 100));
    if (isMaxCorruption) {
        if (caster.corruption !== undefined) caster.corruption = 0;
        healAmount *= (1 + (caster.combatStats.danoCritico || 50) / 100);
        const synergyProps = props.corruptionSynergy;
        if (synergyProps?.applyHot) {
            const hotTemplate = synergyProps.applyHot;
            const hotEffectsTemplate = hotTemplate.effects.hot;
            const baseHealPerTick = (caster.combatStats.poderDeCura * (hotEffectsTemplate.powerOfHealingMultiplier || 0)) + (caster.maxHp * (hotEffectsTemplate.casterMaxHpPercent / 100));
            allAlliesAndSelf.forEach(ally => {
                ally.applyBuff({
                    id: `${hotTemplate.id}_${ally.id}_${Date.now()}`, abilityId: hotTemplate.id, name: hotTemplate.name, icon: hotTemplate.icon,
                    durationMs: hotTemplate.durationMs, remainingMs: hotTemplate.durationMs, isBuff: true, sourceEntityId: caster.id, targetEntityId: ally.id, appliedAt: Date.now(),
                    effects: { hot: { tickIntervalMs: hotEffectsTemplate.tickIntervalMs, healPerTick: Math.max(1, Math.round(baseHealPerTick)), sourceCasterId: caster.id } }
                });
            });
        }
    }
    const healColor = isMaxCorruption ? '#2EE6D0' : 'green';
    allAlliesAndSelf.forEach(ally => {
        const finalHealWithBonus = healAmount * (1 + (ally.combatStats.curaRecebidaBonus || 0) / 100);
        const roundedHeal = Math.round(finalHealWithBonus);
        const oldHp = ally.currentHp;
        ally.receiveHeal(roundedHeal, caster);
        const actualHeal = ally.currentHp - oldHp;
        caster.healingDone += actualHeal;

        dispatcher.dispatchEvent('HEAL_PERFORMED', { caster: caster, target: ally, amount: roundedHeal, isCrit: isMaxCorruption });
        results.push({ newDamageNumber: new DamageNumber(`+${roundedHeal}`, ally.x, ally.y, healColor) });
    });
    results.push({ newVfx: { type: 'ABSOLVICAO_CRUEL', targets: allAlliesAndSelf, isCrit: isMaxCorruption } });
    return results;
};

export const paladinoBencaoCorrompida = (caster: CombatCapable, ability: Ability, allHeroes: CombatCapable[], allEnemies: CombatCapable[], dispatcher: EventDispatcher): UpdateResult[] => {
    const results: UpdateResult[] = [];
    const props = ability.properties;
    if (!props || !props.heal || !props.allyBuff || !props.selfBuff) return [];
    
    const potentialAllies = (caster as HeroEntity).isOpponent ? allEnemies : allHeroes;
    const allAlliesAndSelf = potentialAllies.filter(a => a.isAlive);
    let healAmount = (caster.combatStats.poderDeCura * props.heal.powerOfHealingMultiplier) + (caster.maxHp * (props.heal.casterMaxHpPercent / 100));
    healAmount *= (1 + (caster.combatStats.danoCritico || 50) / 100);
    const allyBuffTemplate = props.allyBuff;
    allAlliesAndSelf.forEach(ally => {
        const finalHealWithBonus = healAmount * (1 + (ally.combatStats.curaRecebidaBonus || 0) / 100);
        const roundedHeal = Math.round(finalHealWithBonus);

        const oldHp = ally.currentHp;
        ally.receiveHeal(roundedHeal, caster);
        const actualHeal = ally.currentHp - oldHp;
        caster.healingDone += actualHeal;

        dispatcher.dispatchEvent('HEAL_PERFORMED', { caster: caster, target: ally, amount: roundedHeal, isCrit: true });
        results.push({ newDamageNumber: new DamageNumber(`+${roundedHeal}`, ally.x, ally.y, '#2EE6D0') });
        
        ally.applyBuff({
            id: `${allyBuffTemplate.id}_${ally.id}`, abilityId: allyBuffTemplate.id, name: allyBuffTemplate.name, icon: allyBuffTemplate.icon,
            durationMs: allyBuffTemplate.durationMs, remainingMs: allyBuffTemplate.durationMs, effects: { ...allyBuffTemplate.effects },
            appliedAt: Date.now(), isBuff: true, sourceEntityId: caster.id, targetEntityId: ally.id,
        });
    });
    const selfBuffTemplate = props.selfBuff;
    caster.applyBuff({
        id: `${selfBuffTemplate.id}_${caster.id}`, abilityId: selfBuffTemplate.id, name: selfBuffTemplate.name, icon: selfBuffTemplate.icon,
        durationMs: selfBuffTemplate.durationMs, remainingMs: selfBuffTemplate.durationMs, effects: { ...selfBuffTemplate.effects },
        appliedAt: Date.now(), isBuff: true, sourceEntityId: caster.id, targetEntityId: caster.id,
    });
    results.push({ newVfx: { type: 'BENCAO_CORROMPIDA', targets: allAlliesAndSelf } });
    return results;
};

export const paladinoJulgamentoDistorcido = (caster: CombatCapable, ability: Ability, allHeroes: CombatCapable[], allEnemies: CombatCapable[], dispatcher: EventDispatcher): UpdateResult[] => {
    const results: UpdateResult[] = [];
    const props = ability.properties;
    if (!props || !caster.target || !caster.target.isAlive || (caster.corruption || 0) <= 0 || distanceToTarget(caster, caster.target) > caster.range) {
        return [];
    }
    const potentialTargets = (caster as HeroEntity).isOpponent ? allHeroes : allEnemies;
    const target = caster.target;
    const currentCorruption = caster.corruption || 0;
    const baseDamage = caster.effectiveDamage + (caster.combatStats.vigor * (props.damageVigorMultiplier || 0)) + (caster.combatStats.letalidade * (props.damageLethalityMultiplier || 0));
    const bonusMultiplier = 1 + (currentCorruption * (props.damageBonusPerCorruptionPointPercent || 0) / 100);
    const finalDamage = baseDamage * bonusMultiplier;
    const dmgTaken = target.takeDamage(finalDamage, false, caster, { neverMiss: true });
    
    dispatcher.dispatchEvent('DAMAGE_TAKEN', { target, attacker: caster, amount: typeof dmgTaken === 'number' ? dmgTaken : 0, result: typeof dmgTaken === 'number' ? 'hit' : dmgTaken, isCrit: false, abilityId: ability.id });

    if (typeof dmgTaken === 'number') {
        results.push({ newDamageNumber: new DamageNumber(Math.round(dmgTaken), target.x, target.y, 'white') });
        results.push(...caster.afterDealingDamage(dmgTaken, target, potentialTargets));
        dispatcher.dispatchEvent('DAMAGE_DEALT', { attacker: caster, target, amount: dmgTaken, isCrit: false, abilityId: ability.id });
    }
    if (caster.corruption !== undefined) caster.corruption = 0;
    results.push({ newVfx: { type: 'JULGAMENTO_DISTORCIDO', target: caster.target } });
    return results;
};