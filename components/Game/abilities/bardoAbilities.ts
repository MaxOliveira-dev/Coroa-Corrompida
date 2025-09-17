import type { CombatCapable, UpdateResult, EventDispatcher } from '../entityInterfaces';
import type { Ability } from '../../../types';
import { distanceToTarget } from '../entityUtils';
import { DamageNumber } from '../entities/DamageNumber';
import { BARD_COMBOS } from '../../../gameData';
import type { HeroEntity } from '../entities/HeroEntity';

const applyBardComboBuff = (caster: HeroEntity, sequence: (1 | 2 | 3)[], allAllies: CombatCapable[], dispatcher: EventDispatcher): UpdateResult[] => {
    const sequenceKey = sequence.join('');
    const combo = BARD_COMBOS[sequenceKey];

    if (combo) {
        const buffDuration = sequenceKey === '123' ? 2000 : 10000;
        const comboEffects = JSON.parse(JSON.stringify(combo.effects));

        if (sequenceKey === '123') {
            if (comboEffects.bardoComboAura) {
                comboEffects.bardoComboAura.sourceCasterId = caster.id;
            }
            caster.applyBuff({
                id: `${combo.id}_${caster.id}`,
                abilityId: combo.id, name: combo.name, icon: combo.icon,
                durationMs: buffDuration, remainingMs: buffDuration,
                effects: comboEffects, appliedAt: Date.now(), isBuff: true,
                sourceEntityId: caster.id,
            });
        } else {
            const livingAllies = allAllies.filter(a => a.isAlive);
            if (comboEffects.hot) {
                comboEffects.hot.sourceCasterId = caster.id;
            }
            livingAllies.forEach(ally => {
                ally.applyBuff({
                    id: `${combo.id}_${ally.id}`,
                    abilityId: combo.id, name: combo.name, icon: combo.icon,
                    durationMs: buffDuration, remainingMs: buffDuration,
                    effects: comboEffects, appliedAt: Date.now(), isBuff: true,
                    sourceEntityId: caster.id,
                });
            });
        }
        
        return [{ eventToDispatch: { type: 'NOTIFICATION_TEXT', payload: { text: `Composição: ${combo.name}!`, x: caster.x, y: caster.y - caster.size } } }];
    }
    return [];
};

const handleBardNote = (caster: HeroEntity, ability: Ability, allHeroes: CombatCapable[], allEnemies: CombatCapable[], dispatcher: EventDispatcher): UpdateResult[] => {
    const results: UpdateResult[] = [];
    if (!caster.isComposing || !caster.compositionSequence) return results;

    const key = ability.properties?.compositionKey;
    if (!key || caster.compositionSequence.slice(-1)[0] === key) {
        caster.isComposing = false;
        caster.compositionSequence = [];
        results.push({ eventToDispatch: { type: 'NOTIFICATION_TEXT', payload: { text: "Composição quebrada!", x: caster.x, y: caster.y - caster.size, color: '#ff6347' } } });
        return results;
    }

    caster.compositionSequence.push(key);
    
    if (caster.compositionSequence.length === 3) {
        const potentialAllies = caster.isOpponent ? allEnemies : allHeroes;
        results.push(...applyBardComboBuff(caster, caster.compositionSequence as (1|2|3)[], potentialAllies, dispatcher));
        const comboColors = caster.compositionSequence.map(noteKey => {
            const noteAbility = caster.abilities.find(a => a.properties?.compositionKey === noteKey);
            return noteAbility?.properties?.compositionColor || '#FFFFFF';
        });
        results.push({ newVfx: { type: 'BARD_COMPOSITION_FINALE', target: caster, comboColors }});
        caster.isComposing = false;
        caster.compositionSequence = [];
    }
    
    return results;
};

export const bardoInicioDaComposicao = (caster: CombatCapable, ability: Ability, allHeroes: CombatCapable[], allEnemies: CombatCapable[], dispatcher: EventDispatcher): UpdateResult[] => {
    const heroCaster = caster as HeroEntity;
    heroCaster.isComposing = true;
    heroCaster.compositionSequence = [];
    heroCaster.abilityCooldowns['BARDO_ACORDE_DISSONANTE'] = 0;
    heroCaster.abilityCooldowns['BARDO_MELODIA_SERENA'] = 0;
    heroCaster.abilityCooldowns['BARDO_BALAUSTRADA_HARMONICA'] = 0;
    
    const results: UpdateResult[] = [];
    results.push({ eventToDispatch: { type: 'NOTIFICATION_TEXT', payload: { text: "Composição iniciada!", x: caster.x, y: caster.y - caster.size } } });
    results.push({ newVfx: { type: 'INICIO_DA_COMPOSICAO', target: caster, duration: 9000 }});
    return results;
};

export const bardoAcordeDissonante = (caster: CombatCapable, ability: Ability, allHeroes: CombatCapable[], allEnemies: CombatCapable[], dispatcher: EventDispatcher): UpdateResult[] => {
    const results: UpdateResult[] = [];
    const props = ability.properties;
    if (!props) return [];

    const potentialTargets = (caster as HeroEntity).isOpponent ? allHeroes : allEnemies;
    results.push(...handleBardNote(caster as HeroEntity, ability, allHeroes, allEnemies, dispatcher));

    const enemiesInArea = potentialTargets.filter(e => e.isAlive && distanceToTarget(caster, e) <= props.radius);
    if (enemiesInArea.length > 0) {
        let damage = caster.combatStats.letalidade * props.damageLethalityMultiplier;
        const isCrit = props.canCrit && (Math.random() * 100 < caster.combatStats.chanceCritica);
        if (isCrit) {
            damage = Math.round(damage * (1 + (caster.combatStats.danoCritico || 50) / 100));
        }
        enemiesInArea.forEach(enemy => {
            const dmgTaken = enemy.takeDamage(damage, isCrit, caster);
            dispatcher.dispatchEvent('DAMAGE_TAKEN', { target: enemy, attacker: caster, amount: typeof dmgTaken === 'number' ? dmgTaken : 0, result: typeof dmgTaken === 'number' ? 'hit' : dmgTaken, isCrit, abilityId: ability.id });
            if (typeof dmgTaken === 'number') {
                dispatcher.dispatchEvent('DAMAGE_DEALT', { attacker: caster, target: enemy, amount: dmgTaken, isCrit: isCrit, abilityId: ability.id });
                if (caster.isPlayer || enemy.isPlayer) {
                    results.push({ newDamageNumber: new DamageNumber(dmgTaken, enemy.x, enemy.y, isCrit ? 'red' : 'white') });
                }
            }
        });
    }
    results.push({ newVfx: { type: 'ACORDE_DISSONANTE', target: caster } });
    return results;
};

export const bardoMelodiaSerena = (caster: CombatCapable, ability: Ability, allHeroes: CombatCapable[], allEnemies: CombatCapable[], dispatcher: EventDispatcher): UpdateResult[] => {
    const results: UpdateResult[] = [];
    const props = ability.properties;
    if (!props) return [];
    
    const potentialAllies = (caster as HeroEntity).isOpponent ? allEnemies : allHeroes;

    let healAmount = caster.combatStats.poderDeCura * props.healPowerOfHealingMultiplier;
    const isCrit = props.canCrit && (Math.random() * 100 < caster.combatStats.chanceCritica);
    if (isCrit) {
        healAmount *= (1 + (caster.combatStats.danoCritico || 50) / 100);
    }
    const livingAllies = potentialAllies.filter(a => a.isAlive);
    livingAllies.forEach(ally => {
        const finalHealWithBonus = healAmount * (1 + (ally.combatStats.curaRecebidaBonus || 0) / 100);
        const roundedHeal = Math.round(finalHealWithBonus);
        const oldHp = ally.currentHp;
        ally.receiveHeal(roundedHeal, caster);
        const actualHeal = ally.currentHp - oldHp;
        caster.healingDone += actualHeal;
        dispatcher.dispatchEvent('HEAL_PERFORMED', { caster: caster, target: ally, amount: actualHeal, isCrit: isCrit });
        if (caster.isPlayer) {
            results.push({ newDamageNumber: new DamageNumber(`+${roundedHeal}`, ally.x, ally.y, isCrit ? '#2EE6D0' : 'green') });
        }
    });

    results.push({ newVfx: { type: 'MELODIA_SERENA', caster: caster, targets: livingAllies } });
    results.push(...handleBardNote(caster as HeroEntity, ability, allHeroes, allEnemies, dispatcher));
    return results;
};

export const bardoBalaustradaHarmonica = (caster: CombatCapable, ability: Ability, allHeroes: CombatCapable[], allEnemies: CombatCapable[], dispatcher: EventDispatcher): UpdateResult[] => {
    const results: UpdateResult[] = [];
    const props = ability.properties;
    if (!props) return [];

    const shieldAmount = caster.combatStats.poderDeCura * props.shieldPowerOfHealingMultiplier;
    const roundedShield = Math.round(shieldAmount);
    if (roundedShield <= 0) return [];
    
    const potentialAllies = (caster as HeroEntity).isOpponent ? allEnemies : allHeroes;
    const alliesToShield = potentialAllies.filter(a => a.isAlive);
    alliesToShield.forEach(ally => {
        ally.applyShield(roundedShield);
        caster.shieldingGranted += roundedShield;
        dispatcher.dispatchEvent('SHIELD_APPLIED', { caster: caster, target: ally, amount: roundedShield });
    });

    results.push({ newVfx: { type: 'BALAUSTRADA_HARMONICA', targets: alliesToShield } });
    results.push(...handleBardNote(caster as HeroEntity, ability, allHeroes, allEnemies, dispatcher));
    return results;
};