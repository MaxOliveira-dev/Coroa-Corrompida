import type { CombatCapable, UpdateResult, EventDispatcher } from '../entityInterfaces';
import type { Ability } from '../../../types';
import { distanceToTarget, getMultiShotTargets, isTargetInCone } from '../entityUtils';
import { DamageNumber } from '../entities/DamageNumber';
import { DeathEffect } from '../entities/DeathEffect';
import { Projectile } from '../entities/Projectile';
import type { HeroEntity } from '../entities/HeroEntity';

export const arqueiroDisparoPreciso = (caster: CombatCapable, ability: Ability, allHeroes: CombatCapable[], allEnemies: CombatCapable[], dispatcher: EventDispatcher): UpdateResult[] => {
    const results: UpdateResult[] = [];
    const props = ability.properties;
    if (!props || !caster.target || !caster.target.isAlive) return [];
    if (distanceToTarget(caster, caster.target) > caster.range * 1.2) return [];

    const potentialTargets = (caster as HeroEntity).isOpponent ? allHeroes : allEnemies;
    const lethalityMultiplier = props.damageLethalityMultiplier || 1.0;
    const projectileDamage = caster.effectiveDamage + (caster.combatStats.letalidade * lethalityMultiplier);
    
    const projectileOptions: any = { 
        color: '#A5D6A7', 
        size: 8, 
        debuffToApply: props.debuff, 
        sourceAbilityProperties: props,
        displayType: 'arrow',
        trailType: 'glitter'
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

export const arqueiroTiroMortal = (caster: CombatCapable, ability: Ability, allHeroes: CombatCapable[], allEnemies: CombatCapable[], dispatcher: EventDispatcher): UpdateResult[] => {
    const results: UpdateResult[] = [];
    const props = ability.properties;
    if (!props) return [];

    const potentialTargets = (caster as HeroEntity).isOpponent ? allHeroes : allEnemies;
    const enemiesWithDebuff = potentialTargets.filter(e => e.isAlive && e.activeDebuffs.some(d => d.abilityId === props.consumesDebuffId));

    if (enemiesWithDebuff.length === 0) return []; // No targets, don't use ability

    enemiesWithDebuff.forEach(enemy => {
        const debuff = enemy.activeDebuffs.find(d => d.abilityId === props.consumesDebuffId);
        if (!debuff) return;

        const stacks = debuff.stacks || 1;
        const missingHp = enemy.maxHp - enemy.currentHp;
        
        const damage = (caster.effectiveDamage * props.damagePerStackMultiplier * stacks) + (missingHp * (props.damagePercentMissingHp / 100));
        
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
            }
        }
        
        if (enemy.currentHp <= 0 && oldHp > 0) {
            results.push({ newEffect: new DeathEffect(enemy.x, enemy.y, '#757575') });
            dispatcher.dispatchEvent('ENTITY_DIED', { victim: enemy, killer: caster });
        }

        enemy.removeDebuff(props.consumesDebuffId);
        results.push({ newVfx: { type: 'TIRO_MORTAL_HIT', target: enemy } });
    });
    return results;
};

export const arqueiroDisparoMultiplo = (caster: CombatCapable, ability: Ability, allHeroes: CombatCapable[], allEnemies: CombatCapable[], dispatcher: EventDispatcher): UpdateResult[] => {
    const results: UpdateResult[] = [];
    const props = ability.properties;
    if (!props) return [];

    const potentialTargets = (caster as HeroEntity).isOpponent ? allHeroes : allEnemies;
    const casterAngle = Math.atan2((caster.target?.y || 0) - caster.y, (caster.target?.x || 0) - caster.x);
    const coneAngleRad = (props.coneAngle || 60) * (Math.PI / 180);
    const coneRange = caster.range;

    const enemiesInCone = potentialTargets.filter(e => e.isAlive && isTargetInCone(caster.x, caster.y, e.x, e.y, coneRange, coneAngleRad, casterAngle));
    
    if (enemiesInCone.length === 0) return [];

    const damage = caster.effectiveDamage + caster.combatStats.letalidade * (props.damageLethalityMultiplier || 0);

    enemiesInCone.forEach(enemy => {
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
            }
        }

        if (enemy.currentHp <= 0 && oldHp > 0) {
            results.push({ newEffect: new DeathEffect(enemy.x, enemy.y, '#757575') });
            dispatcher.dispatchEvent('ENTITY_DIED', { victim: enemy, killer: caster });
        }
    });
    
    results.push({ 
        newVfx: { 
            type: 'DISPARO_MULTIPLO', 
            x: caster.x, 
            y: caster.y,
            angle: casterAngle,
            coneAngle: props.coneAngle,
            numProjectiles: props.numProjectiles,
            range: coneRange
        } 
    });
    return results;
};

export const arqueiroHabilidadeEPrecisao = (caster: CombatCapable, ability: Ability, allHeroes: CombatCapable[], allEnemies: CombatCapable[], dispatcher: EventDispatcher): UpdateResult[] => {
    const props = ability.properties;
    if (!props) return [];

    caster.applyBuff({
        id: `${ability.id}_${caster.id}`,
        abilityId: ability.id,
        name: ability.name,
        icon: ability.icon,
        durationMs: ability.durationMs!,
        remainingMs: ability.durationMs!,
        effects: {
            rangePercent: props.rangePercent,
            velocidadeAtaquePercent: props.velocidadeAtaquePercent,
            multiShot: props.multiShot,
        },
        appliedAt: Date.now(),
        isBuff: true,
        sourceEntityId: caster.id
    });
    
    return [{ newVfx: { type: 'HABILIDADE_E_PRECISAO', target: caster, duration: ability.durationMs! } }];
};