import type { CombatCapable, UpdateResult, EventDispatcher } from '../entityInterfaces';
import type { Ability } from '../../../types';
import { distanceToTarget, getMultiShotTargets } from '../entityUtils';
import { DamageNumber } from '../entities/DamageNumber';
import { DeathEffect } from '../entities/DeathEffect';
import { Projectile } from '../entities/Projectile';
import type { HeroEntity } from '../entities/HeroEntity';

export const magoBolaDeFogo = (caster: CombatCapable, ability: Ability, allHeroes: CombatCapable[], allEnemies: CombatCapable[], dispatcher: EventDispatcher): UpdateResult[] => {
    const results: UpdateResult[] = [];
    const props = ability.properties;
    if (!props || !caster.target || !caster.target.isAlive) return [];
    if (distanceToTarget(caster, caster.target) > caster.range * 1.2) return [];

    const potentialTargets = (caster as HeroEntity).isOpponent ? allHeroes : allEnemies;
    const lethalityMultiplier = props.damageLethalityMultiplier || 1.0;
    const projectileDamage = caster.effectiveDamage + (caster.combatStats.letalidade * lethalityMultiplier);
    
    const projectileOptions: any = { 
        color: '#FF4500', 
        size: 10, 
        debuffToApply: props.debuff, 
        sourceAbilityProperties: props,
        displayType: 'magic_orb',
        trailType: 'fire'
    };

    results.push({ newProjectile: new Projectile(caster.x, caster.y, caster, caster.target, projectileDamage, false, projectileOptions) });
    
    const multiShotBuff = caster.activeBuffs.find(b => b.effects.multiShot);
    if (multiShotBuff?.effects.multiShot) {
        const additionalTargets = getMultiShotTargets(caster, caster.target, potentialTargets, multiShotBuff.effects.multiShot.count);
        for (const additionalTarget of additionalTargets) {
            results.push({ newProjectile: new Projectile(caster.x, caster.y, caster, additionalTarget, projectileDamage, false, projectileOptions) });
        }
    }
    return results;
};

export const magoExplosaoMagica = (caster: CombatCapable, ability: Ability, allHeroes: CombatCapable[], allEnemies: CombatCapable[], dispatcher: EventDispatcher): UpdateResult[] => {
    caster.applyBuff({ 
        id: ability.id, 
        abilityId: ability.id, 
        name: ability.name, 
        icon: ability.icon, 
        durationMs: ability.durationMs || 5000, 
        remainingMs: ability.durationMs || 5000, 
        effects: { 
            nextAttackCrit: true, 
            nextAttackSplash: ability.properties?.nextAttackSplash 
        }, 
        appliedAt: Date.now(), 
        isBuff: true, 
        targetEntityId: caster.id, 
        sourceEntityId: caster.id 
    });
    return [{ newVfx: { type: 'EXPLOSAO_MAGICA_READY', target: caster, duration: ability.durationMs || 5000 } }];
};

export const magoIntelectoSurreal = (caster: CombatCapable, ability: Ability, allHeroes: CombatCapable[], allEnemies: CombatCapable[], dispatcher: EventDispatcher): UpdateResult[] => {
    const potentialAllies = (caster as HeroEntity).isOpponent ? allEnemies : allHeroes;
    const livingHeroes = potentialAllies.filter(ally => ally.isAlive);
    livingHeroes.forEach(ally => {
        ally.applyBuff({ 
            id: `${ability.id}_${ally.id}`, 
            abilityId: ability.id, 
            name: ability.name, 
            icon: ability.icon, 
            durationMs: ability.durationMs || 15000, 
            remainingMs: ability.durationMs || 15000, 
            effects: { 
                danoCriticoPercent: ability.properties?.danoCriticoPercent, 
                letalidadePercent: ability.properties?.letalidadePercent 
            }, 
            appliedAt: Date.now(), 
            isBuff: true, 
            sourceEntityId: caster.id, 
            targetEntityId: ally.id 
        });
    });
    return [{ newVfx: { type: 'INTELECTO_SURREAL', targets: livingHeroes } }];
};

export const magoExplosaoGelida = (caster: CombatCapable, ability: Ability, allHeroes: CombatCapable[], allEnemies: CombatCapable[], dispatcher: EventDispatcher): UpdateResult[] => {
    const results: UpdateResult[] = [];
    const props = ability.properties;
    const potentialTargets = (caster as HeroEntity).isOpponent ? allHeroes : allEnemies;
    const target = caster.target || potentialTargets.filter(e => e.isAlive).sort((a,b) => distanceToTarget(caster, a) - distanceToTarget(caster, b))[0];
    if (!props || !target) return [];

    results.push({ newVfx: { type: 'EXPLOSAO_GELIDA', x: target.x, y: target.y, radius: props.radius } });
    const enemiesInArea = potentialTargets.filter(e => e.isAlive && distanceToTarget(target, e) <= props.radius);
    const damage = caster.effectiveDamage + caster.combatStats.letalidade * props.damageLethalityMultiplier;

    enemiesInArea.forEach(enemy => {
        const oldHp = enemy.currentHp;
        const dmgTaken = enemy.takeDamage(damage, false, caster);
        
        dispatcher.dispatchEvent('DAMAGE_TAKEN', { target: enemy, attacker: caster, amount: typeof dmgTaken === 'number' ? dmgTaken : 0, result: typeof dmgTaken === 'number' ? 'hit' : dmgTaken, isCrit: false, abilityId: ability.id });
        if (typeof dmgTaken === 'number') {
            dispatcher.dispatchEvent('DAMAGE_DEALT', { attacker: caster, target: enemy, amount: dmgTaken, isCrit: false, abilityId: ability.id });
            const afterDamageResults = caster.afterDealingDamage(dmgTaken, enemy, potentialTargets);
            results.push(...afterDamageResults);
        }

        if (caster.isPlayer || enemy.isPlayer) {
            if (typeof dmgTaken === 'number') {
                results.push({ newDamageNumber: new DamageNumber(dmgTaken, enemy.x, enemy.y, 'white') });
            } else if (dmgTaken === 'esquiva') {
                results.push({ newDamageNumber: new DamageNumber("Esquiva!", enemy.x, enemy.y, 'white') });
            }
        }
        if (enemy.currentHp <= 0 && oldHp > 0) {
            results.push({ newEffect: new DeathEffect(enemy.x, enemy.y, '#757575') });
            dispatcher.dispatchEvent('ENTITY_DIED', { victim: enemy, killer: caster });
        }
        
        const debuffTemplate = props.debuff;
        enemy.applyDebuff({
             id: `${debuffTemplate.id}_${enemy.id}`, abilityId: debuffTemplate.id, name: debuffTemplate.name,
             icon: debuffTemplate.icon, durationMs: debuffTemplate.durationMs, remainingMs: debuffTemplate.durationMs,
             effects: { ...debuffTemplate.effects }, appliedAt: Date.now(), isBuff: false, sourceEntityId: caster.id
        });
    });
    return results;
};