import type { Point, CombatStats as CombatStatsType, ActiveBuffDebuff, Ability, ActiveArea } from '../../types';
import type { Projectile } from './entities/Projectile';
import type { DamageNumber } from './entities/DamageNumber';
import type { DeathEffect } from './entities/DeathEffect';
import type { calculateFinalStatsForEntity } from './entityUtils';

export type { Point } from '../../types';

// ==================================
// MOVED FROM types.ts
// ==================================

export interface AreaIndicatorData {
    x: number;
    y: number;
    radius: number;
    remainingMs: number;
    initialMs: number;
}

export interface UpdateResult {
    newProjectile?: Projectile;
    newDamageNumber?: DamageNumber;
    newEffect?: DeathEffect;
    lifeStolen?: number;
    newVfx?: { type: 'SOCO_SERIO_HIT' | 'FRENZY_GLOW' | 'FRENZY_BUFF' | 'VIGOR_DE_BATALHA' | 'TORNADO_MORTAL' | 'REGENERACAO_DE_BATALHA' | 'INTERCEPTAR_TRAIL' | 'MACHO_ALFA_CHANNEL' | 'POWER_UP' | 'GORILLA_STOMP' | 'STUN' | 'EXPLOSAO_MAGICA_READY' | 'INTELECTO_SURREAL' | 'EXPLOSAO_GELIDA' | 'MODO_OCULTO_SMOKE' | 'APUNHALAR_TELEPORT' | 'AGILIDADE_EXTREMA' | 'SHIELD_BASH_IMPACT' | 'TAUNT' | 'PROTECAO_COMPARTILHADA' | 'ESSENCIA_DA_VIDA' | 'ESSENCIA_DA_VIDA_CRIT_HEAL' | 'BENCAO_FLORESTA' | 'PODER_SELVAGEM' | 'TIRO_MORTAL_HIT' | 'DISPARO_MULTIPLO' | 'HABILIDADE_E_PRECISAO' | 'QUEBRA_LUZ' | 'ABSOLVICAO_CRUEL' | 'BENCAO_CORROMPIDA' | 'JULGAMENTO_DISTORCIDO' | 'ESCUDO_DE_OSSOS_EXPLOSION' | 'ESCUDO_DE_OSSOS_BUFF' | 'EXPLOSAO_NECROTICA' | 'ESSENCE_DRAIN' | 'ABSORB_HEAL' | 'FREEZING_TOUCH' | 'CONE_SLASH' | 'SCORPION_DIG' | 'SCORPION_EMERGE' | 'VENOM_PUDDLE' | 'ACORDE_DISSONANTE' | 'MELODIA_SERENA' | 'BALAUSTRADA_HARMONICA' | 'INICIO_DA_COMPOSICAO' | 'BARD_COMPOSITION_FINALE' | 'RED_BALLOON_EXPLOSION' | 'INVOCAR_CICLONE_BUFF'; caster?: CombatCapable, target?: CombatCapable, targets?: CombatCapable[], duration?: number, x?: number, y?: number, radius?: number, isMaxFury?: boolean, color?: string, fromX?: number, fromY?: number, toX?: number, toY?: number, isSynergy?: boolean, isCrit?: boolean, angle?: number, coneAngle?: number, numProjectiles?: number, range?: number, comboColors?: string[] };
    eventToDispatch?: GameEvent;
    newAreaIndicator?: AreaIndicatorData;
    newActiveArea?: ActiveArea;
}

export interface EventDispatcher {
  dispatchEvent(type: GameEventType, payload: any): void;
  addDelayedAction(delayMs: number, action: () => UpdateResult[]): void;
}

export type GameEventType = 
  | 'ENTITY_DIED'
  | 'ABILITY_CAST'
  | 'BASIC_ATTACK_PERFORMED'
  | 'DAMAGE_DEALT'
  | 'DAMAGE_TAKEN'
  | 'HEAL_PERFORMED'
  | 'SHIELD_APPLIED'
  | 'SUMMON_PERFORMED'
  | 'NOTIFICATION_TEXT';

// Payload Interfaces
export interface EventPayload_ENTITY_DIED { killer: CombatCapable; victim: CombatCapable; }
export interface EventPayload_ABILITY_CAST { caster: CombatCapable; ability: Ability; target?: CombatCapable; }
export interface EventPayload_BASIC_ATTACK_PERFORMED { attacker: CombatCapable; target: CombatCapable; }
export interface EventPayload_DAMAGE_DEALT { attacker: CombatCapable; target: CombatCapable; amount: number; isCrit: boolean; abilityId?: string; isDot?: boolean; isBasicAttack?: boolean; }
export interface EventPayload_DAMAGE_TAKEN { target: CombatCapable; attacker: CombatCapable | undefined; amount: number; result: 'hit' | 'dodge' | 'block'; isCrit: boolean; abilityId?: string; isBasicAttack?: boolean; isDot?: boolean; }
export interface EventPayload_HEAL_PERFORMED { caster: CombatCapable; target: CombatCapable; amount: number; isCrit: boolean; }
export interface EventPayload_SHIELD_APPLIED { caster: CombatCapable; target: CombatCapable; amount:number; }
export interface EventPayload_SUMMON_PERFORMED { caster: CombatCapable; summon: CombatCapable; }


export interface GameEvent {
  type: GameEventType;
  payload: any; // Use specific payload types when creating/handling
}

export interface CombatCapable {
    id: number;
    x: number;
    y: number;
    combatStats: CombatStatsType; // Using the return type of the actual function
    currentHp: number;
    shieldHp: number;
    maxHp: number;
    effectiveDamage: number;
    range: number;
    attackIntervalMs: number;
    movementSpeed: number;

    furia?: number;
    maxFuria?: number;
    isComposing?: boolean;
    compositionSequence?: (1 | 2 | 3)[];
    // FIX: Add missing properties for Paladin's Corruption resource
    corruption?: number;
    maxCorruption?: number;

    color?: string;
    bodyColor?: string;
    size: number;
    isBoss?: boolean;
    isPlayer?: boolean; // Added isPlayer property

    isAlive: boolean;
    target: CombatCapable | null;
    lastAttackTime: number;
    attackAnimProgress: number;
    deathEffectCreated: boolean;

    damageDealt: number;
    healingDone: number;
    shieldingGranted: number;
    damageTaken: number;

    lastPosition: Point | null;
    stuckFrameCounter: number;
    isProbingUnstuck: boolean;
    probeAngleOffset: number;
    probeFrameCounter: number;

    activeBuffs: ActiveBuffDebuff[];
    activeDebuffs: ActiveBuffDebuff[];

    abilities: Ability[];
    abilityCooldowns: { [abilityId: string]: number };

    applyShield(amount: number): void;
    receiveHeal(amount: number, sourceCaster: CombatCapable): void;
    takeDamage(amount: number, isCrit?: boolean, attacker?: CombatCapable, options?: { neverMiss?: boolean }): number | 'esquiva' | 'bloqueado';
    findTarget(potentialTargets: CombatCapable[]): void;
    // FIX: Update return type to include optional debuffOnHit property for melee attacks with special effects.
    attack(): { damageDealt: number, isCrit: boolean, projectile?: Projectile, debuffOnHit?: any } | null;
    // FIX: Update return type to include optional debuffOnHit property for melee attacks with special effects.
    performAttack(): { damageDealt: number, isCrit: boolean, projectile?: Projectile, debuffOnHit?: any } | null;
    updateAnimation(): void;
    // FIX: Add missing method to interface
    afterDealingDamage(damageDealt: number, target: CombatCapable, allEnemies: CombatCapable[]): UpdateResult[];
    update(deltaTime: number, heroes: CombatCapable[], enemies: CombatCapable[], canvasSize: { width: number; height: number; }): { results: UpdateResult[], abilityToTrigger?: string };
    useAbility(ability: Ability, allHeroes: CombatCapable[], allEnemies: CombatCapable[], dispatcher: EventDispatcher): UpdateResult[];
    draw(ctx: CanvasRenderingContext2D, isPreview?: boolean, isDragged?: boolean): void;
    drawHealthBar(ctx: CanvasRenderingContext2D): void;
    recalculateStats(): void;
    applyBuff(buff: ActiveBuffDebuff): void;
    applyDebuff(debuff: ActiveBuffDebuff): void;
    removeDebuff(abilityId: string): void;
    handleEvent(event: GameEvent, dispatcher: EventDispatcher, allHeroes: CombatCapable[], allEnemies: CombatCapable[]): UpdateResult[];
    isPartOfPlayerTeam(): boolean;
}