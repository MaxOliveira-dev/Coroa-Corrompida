


export interface ModalButton {
  text: string;
  onClick: () => void;
  styleType: 'confirm' | 'cancel' | 'default';
  disabled?: boolean;
}

// ==================================
// MODAL MANAGER TYPES
// ==================================
export type ModalType = 'APP_MESSAGE' | 'PURCHASE_LOOT' | 'COMBAT_REPORT' | 'POST_BATTLE_LOOT' | 'DEFEAT_SCREEN' | 'POST_PVP_BATTLE';

export interface ModalPropsMap {
  APP_MESSAGE: { message: string };
  PURCHASE_LOOT: { loot: PlayerFragments };
  // FIX: Added 'onBack' callback to handle returning to the previous modal.
  COMBAT_REPORT: { report: CombatReportData; onBack: () => void; };
  // FIX: Added 'report' and 'biomeKey' to correctly pass data after a battle.
  POST_BATTLE_LOOT: { loot: PendingLoot; report: CombatReportData; biomeKey: string; };
  // FIX: Added 'report' to allow showing combat stats on the defeat screen.
  DEFEAT_SCREEN: { biomeKey: string | null; report: CombatReportData; };
  POST_PVP_BATTLE: { report: CombatReportData; playerWon: boolean; rankChange: number; };
}


export interface BaseStats {
    letalidade: number;
    vigor: number;
    resistencia: number;
    velocidadeAtaque: number; // This is a percentage modifier for attack speed
    velocidadeMovimento: number;
    chanceCritica: number;
    danoCritico: number;
    chanceEsquiva: number;
    chanceDeAcerto: number;
    vampirismo: number;
    poderDeCura: number; // Atributo plano que pode ser usado para escalar o poder de habilidades de cura.
    curaRecebidaBonus: number; // Increases healing received
}

// ==================================
// NEW EVENT SYSTEM types are moved to entityInterfaces.ts
// ==================================

export type PassiveAbilityTrigger = 'BASIC_ATTACK_LANDED' | 'HEAL_PERFORMED' | 'ABILITY_CAST' | 'DAMAGE_TAKEN';


// NOTE: PassiveAbility and Item interfaces are moved further down to resolve dependency order.


export interface EquippedItems {
    weapon: Item | null;
    armor: Item | null;
    insignia: Item | null;
    enchantment: Item | null;
}

export interface Inventory {
    equipped: EquippedItems;
    backpack: (Item | null)[];
}

export interface PlayerProgress {
    [key: string]: number;
    FLORESTA: number;
    NEVE: number;
    DESERTO: number;
    PANTANO: number;
}

export interface PlayerFragments {
    [itemName: string]: number;
}

export interface BestiaryEntry {
    kills: number;
    claimedTier: number; // The last tier the player has claimed reward for. Starts at 0.
}

export interface TutorialProgress {
  saw_welcome_and_battle: boolean;
  saw_post_battle_loot: boolean;
  saw_forge_unlock: boolean;
  saw_hero_unlock: boolean;
  saw_bestiary_unlock: boolean;
  saw_market_unlock: boolean;
}

export interface PlayerData {
    name: string;
    baseStats: BaseStats;
    inventory: Inventory;
    progress: PlayerProgress;
    fragments: PlayerFragments; 
    hasHadFirstWin: boolean; 
    coins: number;
    gems: number;
    bestiary: {
        [enemyName: string]: BestiaryEntry;
    };
    tutorial_progress: TutorialProgress;
}

export type AbilityEffectType = 'SELF_BUFF' | 'SELF_HEAL' | 'ATTACK_MODIFIER' | 'AOE_DAMAGE_DEBUFF' | 'CHANNELED_DAMAGE_AURA' | 'PROJECTILE_DAMAGE' | 'SUMMON' | 'AREA_EFFECT';
export type AbilityTargetType = 'SELF' | 'SINGLE_ENEMY' | 'CONE_ENEMY' | 'AOE_AROUND_SELF' | 'AOE_AROUND_TARGET' | 'NONE';

export interface Ability {
    id: string;
    name: string;
    icon: string;
    description: string;
    cooldownMs: number;
    effectType: AbilityEffectType;
    targetType: AbilityTargetType;
    durationMs?: number; // For buffs, debuffs, channeled effects
    properties?: Record<string, any>; // e.g., { damageMultiplier: 2, bonusDamagePercentTargetMaxHp: 10, radius: 100 }
}

export interface SimpleBuffDebuffEffect {
    // Stat modifications (percentage)
    letalidadePercent?: number;
    vigorPercent?: number;
    resistenciaPercent?: number;
    velocidadeAtaquePercent?: number;
    velocidadeMovimentoPercent?: number;
    chanceCriticaPercent?: number;
    danoCriticoPercent?: number;
    chanceEsquivaPercent?: number;
    chanceDeAcertoPercent?: number;
    curaRecebidaBonusPercent?: number;
    poderDeCuraPercent?: number;
    rangePercent?: number;
    
    // Stat modifications (flat)
    letalidadeFlat?: number;
    vigorFlat?: number;
    resistenciaFlat?: number;
    chanceDeAcertoFlat?: number;

    // Simple status effects
    isTaunted?: boolean;
    resistanceReductionPercent?: number;
    isImmobile?: boolean;
    isInvulnerable?: boolean;
    isInvisible?: boolean;
}

export interface ActiveBuffDebuffEffect {
    // Stat modifications (percentage)
    letalidadePercent?: number;
    vigorPercent?: number;
    resistenciaPercent?: number;
    velocidadeAtaquePercent?: number;
    velocidadeMovimentoPercent?: number;
    chanceCriticaPercent?: number; // Additive percentage points
    danoCriticoPercent?: number; // Additive percentage points
    chanceEsquivaPercent?: number; // Additive percentage points
    chanceDeAcertoPercent?: number;
    curaRecebidaBonusPercent?: number; // Additive percentage points
    poderDeCuraPercent?: number;
    rangePercent?: number;
    
    // Stat modifications (flat)
    letalidadeFlat?: number;
    vigorFlat?: number;
    resistenciaFlat?: number;
    chanceDeAcertoFlat?: number;
    // ... other flat stats if needed

    // Special effects
    isTaunted?: boolean;
    nextAttackCrit?: boolean; 
    nextAttackBonusDamagePercentTargetMaxHp?: number;
    resistanceReductionPercent?: number; // For debuffs like "Cortado"
    isImmobile?: boolean;
    isInvulnerable?: boolean;
    isInvisible?: boolean;
    blockCharges?: number; // Number of incoming attacks to block
    overrideAttackIntervalMs?: number;
    channeledDamageAura?: {
        tickIntervalMs: number;
        damageMultiplier: number; // Multiplier of caster's effectiveDamage
        isCrit: boolean;
        radius: number;
        lastTickTime?: number; // Internal state for ticking
    };
    dot?: {
        tickIntervalMs: number;
        damagePerTick: number; // Pre-calculated damage
        lastTickTime?: number; // Internal state for ticking
        sourceCasterId: number; // ID of the entity that applied the debuff
    };
    hot?: {
        tickIntervalMs: number;
        healPerTick?: number;
        healPercentOfTargetMissingHp?: number;
        healFromCasterPowerOfHealingMultiplier?: number;
        healFromCasterLethalityMultiplier?: number;
        lastTickTime?: number;
        sourceCasterId: number;
    };
    bardoComboAura?: {
        tickIntervalMs: number;
        lethalityMultiplier: number;
        missingHpPercentDamage: number;
        radius: number;
        lastTickTime?: number; // Internal state for ticking
        sourceCasterId: number;
    };
    nextAttackSplash?: {
        radius: number;
        damageMultiplier: number; // e.g. 1.0 for 100% of the main attack's damage
        spreadsDebuffId?: string;
    };
    bonusDamageFromMissingHpPercent?: number;
    bonusDamageOnAttackAsPercentOfMaxHp?: number; // New effect for Vigor de Batalha
    furiaPerAttack?: number; // New effect for Vigor de Batalha
    multiShot?: {
        count: number;
    };
    dashToTarget?: {
        targetId: number;
        speedMultiplier: number;
        onHitEffect: {
            lethalityMultiplier: number;
            vigorMultiplier: number;
            stunDurationMs: number;
            alwaysCrit: boolean;
            isDoubled?: boolean;
        };
    };
    nextAbilityDoubleDamage?: boolean;
    healCasterOnHitAsPercentOfMissingHp?: number;
    applyDotOnHit?: {
        id: string;
        name: string;
        icon: string;
        dotDurationMs: number;
        dotTickIntervalMs: number;
        dotDamagePercentCasterMissingHp: number;
        dotDamagePercentTargetMissingHp: number;
    };
    onHitAoeDamage?: {
        radius: number;
        damagePercentTargetMaxHp: number;
        lethalityMultiplier: number;
    };
    nextAttackEnchanted?: {
        bonusDamageFromResistancePercent?: boolean;
        bonusDamageFromVigorMultiplier?: number;
        applyDebuff?: {
            id: string;
            name: string;
            icon: string;
            durationMs: number;
            effects: SimpleBuffDebuffEffect;
        };
    };
    // Add other specific effects as needed
}

export interface ActiveBuffDebuff {
    id: string; // Unique instance id, can be abilityId if not stackable, or unique if stackable
    abilityId: string; // Source ability
    name: string;
    icon?: string;
    durationMs: number;
    remainingMs: number;
    effects: ActiveBuffDebuffEffect;
    appliedAt: number;
    sourceEntityId?: number; // ID of the caster
    targetEntityId?: number; // ID of the entity this is applied to
    isBuff: boolean; // True for buff, false for debuff
    stacks?: number; // Current number of stacks
    maxStacks?: number; // Maximum number of stacks
}


// This is a helper type for defining buff/debuff structures inside item properties.
interface PassiveBuffDefinition {
  id: string;
  name: string;
  icon: string;
  durationMs: number;
  maxStacks?: number;
  effects: Record<string, any>;
}

// A new interface to handle more flexible debuff/effect templates from passives
interface PassiveEffectTemplate {
    id: string;
    name: string;
    icon: string;
    durationMs: number;
    maxStacks?: number;
    effects: Record<string, any>;
}

// NEW: Generic Effect Definition for the new Effect System
export interface PassiveEffect {
    type: 'deal_damage_on_area' | 'apply_debuff_on_area';
    properties: {
        radius: number;
        // for damage
        damage?: {
            type: 'vigor_scaling' | 'lethality_scaling' | 'flat';
            multiplier?: number;
            baseValue?: number;
        };
        // for debuff
        debuff?: PassiveEffectTemplate;
    };
}


// This defines the known shapes of passive ability properties.
// Using an interface instead of a type alias for better compiler performance with complex types.
export interface PassiveAbilityProperties {
  stackingBuff?: PassiveBuffDefinition;
  frenzyBuff?: PassiveBuffDefinition;
  healingBuff?: PassiveBuffDefinition;
  shieldHpPercentTargetMaxHp?: number;
  shieldFromCasterPowerOfHealingMultiplier?: number;
  cooldownMs?: number;
  buff?: PassiveBuffDefinition;
  // FIX: Added 'debuff' property to allow defining debuffs applied by passive abilities, such as the Scorpion King's poison.
  debuff?: PassiveBuffDefinition;
  stunAtMaxStacks?: PassiveEffectTemplate;
  onHitConditional?: {
    requiredDebuffId: string;
    guaranteedCrit?: boolean;
    applyDebuff?: PassiveEffectTemplate;
  };
  maxStacks?: number;
  
  // NEW GENERIC SYSTEM
  effects?: PassiveEffect[];
}


export interface PassiveAbility {
    id: string;
    trigger: PassiveAbilityTrigger;
    properties: PassiveAbilityProperties;
}

export interface Item {
    id?: string | number;
    name: string;
    type: string; // e.g., 'sword', 'bow', 'helmet', 'boots', 'gauntlet', 'armor', 'shield', 'necklace', 'insignia', 'enchantment', 'hammer', 'lute'
    icon: string;
    hasNotification?: boolean;
    tier?: 1 | 2 | 3 | 4;
    description?: string;
    statBonuses?: Partial<BaseStats>; 
    equipsToClass?: keyof ClassDataMap; 
    passiveAbility?: PassiveAbility;
}


export interface ActiveArea {
    id: number;
    casterId: number;
    x: number;
    y: number;
    radius: number;
    remainingMs: number;
    allyBuffTemplate?: PassiveBuffDefinition;
    damageProperties?: {
        baseDamageMultiplier?: number;
        perEntityMultiplier?: number;
        tickIntervalMs: number;
        casterBaseDamage?: number;
        damagePercentOfCasterBaseDamage?: number;
        damagePercentOfCasterMissingHp?: number;
    };
    debuffTemplate?: any; // Added for venom puddle
    lastDamageTickTime?: number;
    vfx?: any;
}


export interface ClassData {
    name:string;
    color: string;
    bodyColor: string;
    weapon: string; 
    hp: number; 
    damage: number; 
    range: number;
    attackSpeed: number; 
    velocidadeMovimento: number; 
    abilities: Ability[];
}

export type ClassDataMap = {
    AVENTUREIRO: ClassData; 
    GUERREIRO: ClassData;
    MAGO: ClassData;
    ARQUEIRO: ClassData;
    ASSASSINO: ClassData;
    GUARDIÃO: ClassData;
    NECROMANTE: ClassData;
    DRUIDA: ClassData;
    PALADINO_CORROMPIDO: ClassData;
    BARDO: ClassData;
};

// FIX: Adding shared types for battle setup and loot to be used across multiple hooks and components.
export interface AllyTeamMember {
  classKey: keyof ClassDataMap;
  equipment: EquippedItems;
}

export interface BattleTeam {
  main: AllyTeamMember;
  allies: AllyTeamMember[];
}

export interface PendingLoot {
  fragments: PlayerFragments;
  coins?: number;
}


export interface EnemyTemplate {
    name: string;
    emoji: string;
    baseHp: number;
    baseDamage: number;
    range: number;
    attackSpeed: number; // ms
    velocidadeMovimento: number;
    size?: number;
    isBoss?: boolean;
    abilities?: Ability[];
    // Enemies can have base stats too, for debuff calculations or variety
    baseStats?: Partial<BaseStats>;
    passiveAbility?: PassiveAbility;
}

export interface Biome {
    name: string;
    description: string;
    color: string;
    mapIconUrl?: string;
    boss: EnemyTemplate;
    enemies: EnemyTemplate[];
    scenery: ('tree' | 'rock' | 'river' | 'pine_tree' | 'puddle' | 'flower')[];
}

export interface BiomeData {
    [key: string]: Biome;
}

export enum ActiveGameSubState {
    IDLE = 'IDLE',
    PLACEMENT = 'PLACEMENT',
    BATTLING = 'BATTLING',
    LEVEL_WON = 'LEVEL_WON',
    LEVEL_LOST = 'LEVEL_LOST',
}


export interface CombatStats extends BaseStats {
    currentHp: number;
    maxHp: number;
    effectiveDamage: number;

    name: string;
    range: number;
    attackIntervalMs: number; 

    color?: string;
    bodyColor?: string;
    weaponRepresentation?: string;
    emoji?: string;

    size?: number;
    isBoss?: boolean;
    isPlayer?: boolean;

    furia?: number;
    maxFuria?: number;

    isComposing?: boolean;
    compositionSequence?: (1 | 2 | 3)[];

    // These will be dynamically calculated based on rawBuffs/Debuffs
    // activeBuffs: ActiveBuffDebuff[]; 
    // activeDebuffs: ActiveBuffDebuff[];
}


export interface PlacementSlot {
    id?: string;
    x: number;
    y: number;
    occupied: boolean;
}

export interface Point {
    x: number;
    y: number;
}

export type ForgeCostTierMap = {
    [tier: number]: number;
};

// --- Combat Report Types ---
export interface HeroCombatStat {
    heroName: string; 
    isDead: boolean;
    damageDealt: number;
    healingDone: number;
    shieldingGranted: number;
    damageTaken: number;
}

export interface EnemyKillCount {
    [enemyName:string]: {
        emoji: string;
        count: number;
    }
}

export interface CombatReportData {
    heroStats: { [heroName: string]: HeroCombatStat }; 
    enemiesKilled: EnemyKillCount;
}

export interface PurchaseOption {
  quantity: 1 | 10;
  cost: number;
  currency: 'coins' | 'gems';
}

export interface MarketItem {
  id: string;
  name: string;
  icon: string;
  description: string;
  contents: {
    fragmentTiers: (1 | 2 | 3 | 4)[];
    fragmentAmount: number;
  };
  purchaseOptions: PurchaseOption[];
}

export interface RealTimeStat {
  id: number;
  name: string;
  icon: string;
  color: string;
  currentHp: number;
  maxHp: number;
  shieldHp: number;
  damageDealt: number;
  healingDone: number;
  shieldingGranted: number;
  damageTaken: number;
  dps: number;
  hps: number;
  combatStats: CombatStats;
}

export interface ColiseumRanking {
  player_id: string;
  player_name: string;
  rank_1v1: number;
  rank_2v2: number;
  rank_3v3: number;
  main_hero_data: {
    classKey: keyof ClassDataMap;
    equipment: EquippedItems;
  };
}


export type { BestiaryEntry as BestiaryEntryType, PlayerProgress as PlayerProgressType };