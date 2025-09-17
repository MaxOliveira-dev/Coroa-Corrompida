import type { CombatCapable, UpdateResult, EventDispatcher } from '../entityInterfaces';
import type { Ability } from '../../../types';
import { distanceToTarget } from '../entityUtils';
import { DamageNumber } from '../entities/DamageNumber';
import { LivingTreeAlly } from '../entities/SkeletonAlly';
import type { HeroEntity } from '../entities/HeroEntity';

export const druidaEssenciaDaVida = (caster: CombatCapable, ability: Ability, allHeroes: CombatCapable[], allEnemies: CombatCapable[], dispatcher: EventDispatcher): UpdateResult[] => {
    const results: UpdateResult[] = [];
    const props = ability.properties;
    if (!props) return [];
    
    const potentialAllies = (caster as HeroEntity).isOpponent ? allEnemies : allHeroes;
    const livingAllies = potentialAllies.filter(a => a.isAlive);

    const hotProps = props.hot;
    if (hotProps) {
        livingAllies.forEach(ally => {
            const healPerTick = ally.maxHp * (hotProps.healPercentOfTargetMaxHp / 100);
            ally.applyBuff({
                id: `${hotProps.id}_${ally.id}`, abilityId: hotProps.id, name: hotProps.name, icon: hotProps.icon,
                durationMs: hotProps.durationMs, remainingMs: hotProps.durationMs,
                effects: { hot: { tickIntervalMs: hotProps.tickIntervalMs, healPerTick, sourceCasterId: caster.id } },
                appliedAt: Date.now(), isBuff: true, sourceEntityId: caster.id, targetEntityId: ally.id,
            });
            results.push({ newVfx: { type: 'ESSENCIA_DA_VIDA', target: ally, duration: hotProps.durationMs } });
        });
    }

    const delayedHealProps = props.delayedHeal;
    if (delayedHealProps) {
        dispatcher.addDelayedAction(delayedHealProps.delayMs, () => {
            const actionResults: UpdateResult[] = [];
            const stillAliveAllies = potentialAllies.filter(a => a.isAlive);

            stillAliveAllies.forEach(ally => {
                const missingHp = ally.maxHp - ally.currentHp;
                let healAmount = (ally.maxHp * (delayedHealProps.healPercentOfTargetMaxHp / 100)) +
                                 (missingHp > 0 ? missingHp * (delayedHealProps.healPercentOfTargetMissingHp / 100) : 0);
                
                let isCrit = false;
                if (delayedHealProps.canCrit && (Math.random() * 100 < caster.combatStats.chanceCritica)) {
                    isCrit = true;
                    healAmount *= (1 + (caster.combatStats.danoCritico || 50) / 100);
                }
                
                const finalHealWithBonus = healAmount * (1 + (ally.combatStats.curaRecebidaBonus || 0) / 100);
                const roundedHeal = Math.round(finalHealWithBonus);
                
                const oldHp = ally.currentHp;
                ally.receiveHeal(roundedHeal, caster);
                const actualHeal = ally.currentHp - oldHp;
                caster.healingDone += actualHeal;

                dispatcher.dispatchEvent('HEAL_PERFORMED', { caster, target: ally, amount: roundedHeal, isCrit: isCrit });

                if (caster.isPlayer || ally.isPlayer) { 
                    actionResults.push({ 
                        newDamageNumber: new DamageNumber(`+${roundedHeal}`, ally.x, ally.y, isCrit ? '#2EE6D0' : 'green') 
                    });
                }
                actionResults.push({ newVfx: { type: 'ESSENCIA_DA_VIDA_CRIT_HEAL', target: ally } });
            });
            return actionResults;
        });
    }
    return results;
};

export const druidaEnraizar = (caster: CombatCapable, ability: Ability, allHeroes: CombatCapable[], allEnemies: CombatCapable[], dispatcher: EventDispatcher): UpdateResult[] => {
    const results: UpdateResult[] = [];
    const props = ability.properties;
    if (!props) return [];

    const MAX_LIVING_TREES = 4;
    
    const potentialTargets = (caster as HeroEntity).isOpponent ? allHeroes : allEnemies;
    const potentialAllies = (caster as HeroEntity).isOpponent ? allEnemies : allHeroes;
    
    const target = caster.target || potentialTargets.filter(e => e.isAlive).sort((a,b) => distanceToTarget(caster, a) - distanceToTarget(caster, b))[0];
    if (!target) return [];

    const enemiesInArea = potentialTargets.filter(e => e.isAlive && distanceToTarget(target, e) <= props.radius);
    if (enemiesInArea.length === 0) return [];
    
    let currentTrees = potentialAllies.filter(a => a instanceof LivingTreeAlly && a.master.id === caster.id && a.isAlive).length;
    let maxTreesNotificationSent = false;

    enemiesInArea.forEach(enemy => {
        const debuffTemplate = props.debuff;
        enemy.applyDebuff({
             id: `${debuffTemplate.id}_${enemy.id}_${Date.now()}`,
             abilityId: debuffTemplate.id, name: debuffTemplate.name,
             icon: debuffTemplate.icon, durationMs: debuffTemplate.durationMs, remainingMs: debuffTemplate.durationMs,
             effects: { ...debuffTemplate.effects }, appliedAt: Date.now(), isBuff: false, sourceEntityId: caster.id
        });
        results.push({ newVfx: { type: 'STUN', target: enemy, duration: debuffTemplate.durationMs } });
        
        const summonProps = props.summonOnHit;
        if (summonProps) {
            if (currentTrees < MAX_LIVING_TREES) {
                const spawnX = enemy.x + (Math.random() - 0.5) * 30;
                const spawnY = enemy.y + (Math.random() - 0.5) * 30;
                const newTree = new LivingTreeAlly(spawnX, spawnY, caster as any, summonProps.statTransferPercent, summonProps.onHealEffect);
                results.push({ eventToDispatch: { type: 'SUMMON_PERFORMED', payload: { caster: caster, summon: newTree } }});
                currentTrees++;
            } else if (!maxTreesNotificationSent) {
                 if (caster.isPlayer) {
                    results.push({ eventToDispatch: { type: 'NOTIFICATION_TEXT', payload: { text: "Máximo de árvores atingido!", x: caster.x, y: caster.y - caster.size, color: '#ff6347' } } });
                }
                maxTreesNotificationSent = true;
            }
        }
    });
    return results;
};

export const druidaBencaoFloresta = (caster: CombatCapable, ability: Ability, allHeroes: CombatCapable[], allEnemies: CombatCapable[], dispatcher: EventDispatcher): UpdateResult[] => {
    const results: UpdateResult[] = [];
    const props = ability.properties;
    if (!props) return [];

    const potentialAllies = (caster as HeroEntity).isOpponent ? allEnemies : allHeroes;
    const livingAllies = potentialAllies.filter(a => a.isAlive);

    livingAllies.forEach(ally => {
        const missingHp = ally.maxHp - ally.currentHp;
        let healAmount = (ally.maxHp * (props.instantHeal.maxHpPercent / 100)) +
                         (missingHp > 0 ? missingHp * (props.instantHeal.missingHpPercent / 100) : 0);

        let isCrit = false;
        if (props.canCrit && (Math.random() * 100 < caster.combatStats.chanceCritica)) {
            isCrit = true;
            healAmount *= (1 + (caster.combatStats.danoCritico || 50) / 100);
        }

        const hasSynergyBuff = ally.activeBuffs.some(b => b.abilityId === props.synergy.requiredBuffId);
        if (hasSynergyBuff) {
            healAmount *= props.synergy.healMultiplier;

            const hotBuffTemplate = props.synergy.hotBuff;
            if (hotBuffTemplate) {
                const healPerTick = ally.maxHp * (hotBuffTemplate.effects.hot.healPercentOfMaxHp / 100);
                ally.applyBuff({
                    id: `${hotBuffTemplate.id}_${ally.id}`, abilityId: hotBuffTemplate.id, name: hotBuffTemplate.name, icon: hotBuffTemplate.icon,
                    durationMs: hotBuffTemplate.durationMs, remainingMs: hotBuffTemplate.durationMs,
                    effects: { hot: { tickIntervalMs: hotBuffTemplate.effects.hot.tickIntervalMs, healPerTick, sourceCasterId: caster.id } },
                    appliedAt: Date.now(), isBuff: true, sourceEntityId: caster.id, targetEntityId: ally.id,
                });
            }

            const healBonusBuffTemplate = props.synergy.healingReceivedBuff;
            if (healBonusBuffTemplate) {
                 ally.applyBuff({
                    id: `${healBonusBuffTemplate.id}_${ally.id}`, abilityId: healBonusBuffTemplate.id, name: healBonusBuffTemplate.name, icon: healBonusBuffTemplate.icon,
                    durationMs: healBonusBuffTemplate.durationMs, remainingMs: healBonusBuffTemplate.durationMs,
                    effects: { ...healBonusBuffTemplate.effects }, appliedAt: Date.now(), isBuff: true, sourceEntityId: caster.id, targetEntityId: ally.id,
                });
            }
        }
        
        const finalHealWithBonus = healAmount * (1 + (ally.combatStats.curaRecebidaBonus || 0) / 100);
        const roundedHeal = Math.round(finalHealWithBonus);

        const oldHp = ally.currentHp;
        ally.receiveHeal(roundedHeal, caster);
        const actualHeal = ally.currentHp - oldHp;
        caster.healingDone += actualHeal;

        dispatcher.dispatchEvent('HEAL_PERFORMED', { caster: caster, target: ally, amount: roundedHeal, isCrit: isCrit });

        if (caster.isPlayer || ally.isPlayer) {
            const healColor = isCrit ? '#2EE6D0' : 'green';
            results.push({ newDamageNumber: new DamageNumber(`+${roundedHeal}`, ally.x, ally.y, healColor) });
        }
        results.push({ newVfx: { type: 'BENCAO_FLORESTA', target: ally, isSynergy: hasSynergyBuff, isCrit: isCrit } });
    });
    return results;
};

export const druidaPoderSelvagem = (caster: CombatCapable, ability: Ability, allHeroes: CombatCapable[], allEnemies: CombatCapable[], dispatcher: EventDispatcher): UpdateResult[] => {
    const results: UpdateResult[] = [];
    const potentialAllies = (caster as HeroEntity).isOpponent ? allEnemies : allHeroes;
    const livingAllies = potentialAllies.filter(a => a.isAlive);
    livingAllies.forEach(ally => {
       ally.applyBuff({
           id: `${ability.id}_${ally.id}`, abilityId: ability.id, name: ability.name, icon: ability.icon,
           durationMs: ability.durationMs!, remainingMs: ability.durationMs!,
           effects: { 
               vigorPercent: ability.properties?.vigorPercent,
               resistenciaPercent: ability.properties?.resistenciaPercent,
               chanceEsquivaPercent: ability.properties?.chanceEsquivaPercent,
               curaRecebidaBonusPercent: ability.properties?.curaRecebidaBonusPercent,
           },
           appliedAt: Date.now(), isBuff: true, sourceEntityId: caster.id, targetEntityId: ally.id
       });
       results.push({ newVfx: { type: 'PODER_SELVAGEM', target: ally, duration: ability.durationMs! } });
    });
    return results;
};