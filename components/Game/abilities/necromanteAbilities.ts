import type { CombatCapable, UpdateResult, EventDispatcher } from '../entityInterfaces';
import type { Ability } from '../../../types';
import { distanceToTarget } from '../entityUtils';
import { DamageNumber } from '../entities/DamageNumber';
import { DeathEffect } from '../entities/DeathEffect';
import { SkeletonAlly } from '../entities/SkeletonAlly';
import type { HeroEntity } from '../entities/HeroEntity';

export const necromanteServosEsqueleticos = (caster: CombatCapable, ability: Ability, allHeroes: CombatCapable[], allEnemies: CombatCapable[], dispatcher: EventDispatcher): UpdateResult[] => {
    const results: UpdateResult[] = [];
    const props = ability.properties;
    if (!props) return [];

    const existingSummons = allHeroes.filter(ally => (ally as SkeletonAlly).master?.id === caster.id && ally.isAlive);

    if (existingSummons.length >= props.maxSummons) {
        if (props.frenzyBuff) {
            const buffTemplate = props.frenzyBuff;
            existingSummons.forEach(skeleton => {
                skeleton.applyBuff({
                    id: `${buffTemplate.id}_${skeleton.id}`, abilityId: buffTemplate.id, name: buffTemplate.name,
                    icon: buffTemplate.icon, durationMs: buffTemplate.durationMs, remainingMs: buffTemplate.durationMs,
                    effects: { ...buffTemplate.effects }, appliedAt: Date.now(), isBuff: true, sourceEntityId: caster.id,
                });
                results.push({ newVfx: { type: 'FRENZY_BUFF', target: skeleton, duration: buffTemplate.durationMs } });
            });
             if (caster.isPlayer) {
                results.push({ eventToDispatch: { type: 'NOTIFICATION_TEXT', payload: { text: "Frenesi Esquelético!", x: caster.x, y: caster.y - caster.size } } });
            }
        } else {
             if (caster.isPlayer) {
                results.push({ eventToDispatch: { type: 'NOTIFICATION_TEXT', payload: { text: "Máximo de servos atingido!", x: caster.x, y: caster.y - caster.size, color: '#ff6347' } } });
            }
            return [];
        }
    } else {
        const spawnX = caster.x + (Math.random() - 0.5) * 60;
        const spawnY = caster.y + (Math.random() - 0.5) * 60;
        const newAlly = new SkeletonAlly(spawnX, spawnY, caster as any, props.statTransferPercent, props.bonusDamagePercentCasterMissingHp);
        results.push({ eventToDispatch: { type: 'SUMMON_PERFORMED', payload: { caster: caster, summon: newAlly } } });
    }
    return results;
};

export const necromanteEscudoDeOssos = (caster: CombatCapable, ability: Ability, allHeroes: CombatCapable[], allEnemies: CombatCapable[], dispatcher: EventDispatcher): UpdateResult[] => {
    const results: UpdateResult[] = [];
    const props = ability.properties;
    if (!props) return [];
    const alliesToBuff = allHeroes.filter(a => (a as SkeletonAlly).master?.id === caster.id && a.isAlive);
    const hpCost = caster.currentHp * (props.hpCostCurrentHpPercent / 100);
    caster.currentHp = Math.max(1, caster.currentHp - hpCost);
    if (caster.isPlayer) {
        results.push({ newDamageNumber: new DamageNumber(`-${Math.round(hpCost)}`, caster.x, caster.y, 'red') });
    }
    results.push({ newVfx: { type: 'ESCUDO_DE_OSSOS_EXPLOSION', x: caster.x, y: caster.y, radius: props.radius } });
    const missingHp = caster.maxHp - caster.currentHp;
    const shieldAmount = caster.maxHp * (props.shieldFromMaxHpPercent / 100) + (missingHp > 0 ? missingHp * (props.shieldFromMissingHpPercent / 100) : 0);
    const roundedShieldAmount = Math.round(shieldAmount);
    if (roundedShieldAmount > 0 && props.buffs) {
        const entitiesToBuff = [caster, ...alliesToBuff];
        entitiesToBuff.forEach(entity => {
            entity.applyShield(roundedShieldAmount);
            results.push({ eventToDispatch: { type: 'SHIELD_APPLIED', payload: { caster: caster, target: entity, amount: roundedShieldAmount } } });
            caster.shieldingGranted += roundedShieldAmount;
            props.buffs.forEach((buffTemplate: any) => {
                entity.applyBuff({
                    id: `${buffTemplate.id}_${entity.id}`, abilityId: buffTemplate.id, name: buffTemplate.name,
                    icon: buffTemplate.icon, durationMs: buffTemplate.durationMs, remainingMs: buffTemplate.durationMs,
                    effects: { ...buffTemplate.effects }, appliedAt: Date.now(), isBuff: true, sourceEntityId: caster.id, targetEntityId: entity.id
                });
            });
            results.push({ newVfx: { type: 'ESCUDO_DE_OSSOS_BUFF', target: entity, duration: props.buffs.find((b: any) => b.id === 'BUFF_ESCUDO_DE_OSSOS')?.durationMs || 6000 } });
        });
    }
    return results;
};

export const necromanteExplosaoNecrotica = (caster: CombatCapable, ability: Ability, allHeroes: CombatCapable[], allEnemies: CombatCapable[], dispatcher: EventDispatcher): UpdateResult[] => {
    const results: UpdateResult[] = [];
    const props = ability.properties;
    if (!props) return [];
    const potentialTargets = (caster as HeroEntity).isOpponent ? allHeroes : allEnemies;
    const livingSkeletons = allHeroes.filter(a => (a as SkeletonAlly).master?.id === caster.id && a.isAlive);
    if (livingSkeletons.length === 0) {
        if (caster.isPlayer) {
            results.push({ eventToDispatch: { type: 'NOTIFICATION_TEXT', payload: { text: "Nenhum esqueleto para sacrificar!", x: caster.x, y: caster.y - caster.size, color: '#ff6347' } } });
        }
        return [];
    }
    const missingHp = caster.maxHp - caster.currentHp;
    const damage = caster.effectiveDamage + (caster.combatStats.letalidade * (props.damageLethalityMultiplier || 0)) + (missingHp > 0 ? missingHp * (props.damagePercentMissingHp / 100) : 0);
    livingSkeletons.forEach(skeleton => {
        results.push({ newVfx: { type: 'EXPLOSAO_NECROTICA', x: skeleton.x, y: skeleton.y, radius: props.radius } });
        const enemiesInArea = potentialTargets.filter(e => e.isAlive && distanceToTarget(skeleton, e) <= props.radius);
        enemiesInArea.forEach(enemy => {
            const oldHp = enemy.currentHp;
            const dmgTaken = enemy.takeDamage(damage, false, caster);
            results.push({ eventToDispatch: { type: 'DAMAGE_TAKEN', payload: { target: enemy, attacker: caster, amount: typeof dmgTaken === 'number' ? dmgTaken : 0, result: typeof dmgTaken === 'number' ? 'hit' : dmgTaken, isCrit: false, abilityId: ability.id } } });
            if (typeof dmgTaken === 'number') {
                results.push({ eventToDispatch: { type: 'DAMAGE_DEALT', payload: { attacker: caster, target: enemy, amount: dmgTaken, isCrit: false, abilityId: ability.id } } });
                results.push(...caster.afterDealingDamage(dmgTaken, enemy, potentialTargets));
            }
            if (caster.isPlayer || enemy.isPlayer) {
                if (typeof dmgTaken === 'number') results.push({ newDamageNumber: new DamageNumber(dmgTaken, enemy.x, enemy.y, 'white') });
            }
            if (enemy.currentHp <= 0 && oldHp > 0 && !enemy.deathEffectCreated) {
                results.push({ newEffect: new DeathEffect(enemy.x, enemy.y, enemy.isBoss ? '#C62828' : '#757575', enemy.isBoss ? 35 : 15, enemy.isBoss ? 60 : 30) });
                enemy.deathEffectCreated = true;
                results.push({ eventToDispatch: { type: 'ENTITY_DIED', payload: { victim: enemy, killer: caster } } });
            }
        });
        skeleton.currentHp = 0;
        skeleton.isAlive = false;
        results.push({ newEffect: new DeathEffect(skeleton.x, skeleton.y, '#39FF14', 10, 20, 'burst') });
        results.push({ eventToDispatch: { type: 'ENTITY_DIED', payload: { victim: skeleton, killer: caster } } });
    });
    return results;
};

export const necromanteAbsorverEssencia = (caster: CombatCapable, ability: Ability, allHeroes: CombatCapable[], allEnemies: CombatCapable[], dispatcher: EventDispatcher): UpdateResult[] => {
    const results: UpdateResult[] = [];
    const props = ability.properties;
    if (!props) return [];
    const livingSkeletons = allHeroes.filter(a => (a as SkeletonAlly).master?.id === caster.id && a.isAlive);
    if (livingSkeletons.length === 0) {
        if (caster.isPlayer) {
           results.push({ eventToDispatch: { type: 'NOTIFICATION_TEXT', payload: { text: "Nenhum esqueleto para absorver!", x: caster.x, y: caster.y - caster.size, color: '#ff6347' } } });
        }
        return [];
    }
    let totalHealAmount = 0;
    const missingHp = caster.maxHp - caster.currentHp;
    livingSkeletons.forEach(skeleton => {
        const healForThisSkeleton = (caster.effectiveDamage * (props.baseDamageMultiplier || 0)) + (missingHp > 0 ? missingHp * (props.missingHpMultiplier || 0) : 0);
        totalHealAmount += healForThisSkeleton;
        results.push({ newVfx: { type: 'ESSENCE_DRAIN', fromX: skeleton.x, fromY: skeleton.y, toX: caster.x, toY: caster.y, duration: 800 } });
        skeleton.currentHp = 0;
        skeleton.isAlive = false;
        results.push({ newEffect: new DeathEffect(skeleton.x, skeleton.y, '#39FF14', 10, 20, 'burst') });
        results.push({ eventToDispatch: { type: 'ENTITY_DIED', payload: { victim: skeleton, killer: caster } } });
    });
    const finalHealAmount = totalHealAmount * (1 + (caster.combatStats.curaRecebidaBonus || 0) / 100);
    results.push({ eventToDispatch: { type: 'HEAL_PERFORMED', payload: { caster: caster, target: caster, amount: finalHealAmount, isCrit: false } } });
    caster.currentHp = Math.min(caster.maxHp, caster.currentHp + finalHealAmount);
    caster.healingDone += finalHealAmount;
    if (caster.isPlayer) {
        results.push({ newDamageNumber: new DamageNumber(`+${Math.round(finalHealAmount)}`, caster.x, caster.y, 'green') });
    }
    results.push({ newVfx: { type: 'ABSORB_HEAL', target: caster } });
    const conditionalBuffProps = props.conditionalHotBuff;
    if (conditionalBuffProps && caster.activeBuffs.some(b => b.abilityId === conditionalBuffProps.requiredBuffId)) {
        const hotBuffTemplate = conditionalBuffProps.buff;
        const baseHealPerTick = caster.maxHp * ((hotBuffTemplate.effects.hot.healPercentOfMaxHp || 0) / 100);
        caster.applyBuff({
            id: `${hotBuffTemplate.id}_${caster.id}`, abilityId: hotBuffTemplate.id, name: hotBuffTemplate.name,
            icon: hotBuffTemplate.icon, durationMs: hotBuffTemplate.durationMs, remainingMs: hotBuffTemplate.durationMs,
            effects: { hot: { tickIntervalMs: hotBuffTemplate.effects.hot.tickIntervalMs, healPerTick: baseHealPerTick, sourceCasterId: caster.id } },
            appliedAt: Date.now(), isBuff: true, sourceEntityId: caster.id, targetEntityId: caster.id,
        });
    }
    return results;
};