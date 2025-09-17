import type { BiomeData, EnemyTemplate } from '../types';
import type { Ability } from '../types';

/**
 * Generates the bestiary quest data dynamically based on enemy stats from the BIOMES object.
 * This makes balancing and adding new creatures easier.
 * @param biomes The main biome data object containing all enemies.
 * @returns A structured object with quest tiers for every unique enemy.
 */
function generateBestiaryQuests(biomes: BiomeData): { [enemyName: string]: { tiers: { required: number; reward: number }[] } } {
    const quests: { [enemyName: string]: { tiers: { required: number; reward: number }[] } } = {};
    const allEnemies = new Map<string, EnemyTemplate>();

    // Gather all unique enemies from biomes to avoid duplicates
    Object.values(biomes).forEach(biome => {
        [...biome.enemies, biome.boss].forEach(enemy => {
            if (enemy && !allEnemies.has(enemy.name)) {
                allEnemies.set(enemy.name, enemy);
            }
        });
    });

    // --- Tier and Reward Configuration ---
    const NORMAL_ENEMY_KILLS = [15, 40, 80, 150];
    const BOSS_KILLS = [1, 3, 5, 10];

    allEnemies.forEach(enemy => {
        let tiers: { required: number; reward: number }[];

        if (enemy.isBoss) {
            // Bosses have lower kill counts and rewards scaled differently due to their high stats
            const baseReward = Math.round(((enemy.baseHp / 40) + (enemy.baseDamage * 3)) / 5) * 5;
            tiers = [
                { required: BOSS_KILLS[0], reward: baseReward * 1 },
                { required: BOSS_KILLS[1], reward: baseReward * 2.5 },
                { required: BOSS_KILLS[2], reward: baseReward * 4 },
                { required: BOSS_KILLS[3], reward: baseReward * 8 },
            ];
        } else {
            // Normal enemies have higher kill counts and a standard reward formula
            const baseReward = Math.round(((enemy.baseHp / 8) + (enemy.baseDamage * 6)) / 5) * 5;
            tiers = [
                { required: NORMAL_ENEMY_KILLS[0], reward: baseReward * 1 },
                { required: NORMAL_ENEMY_KILLS[1], reward: baseReward * 2.5 },
                { required: NORMAL_ENEMY_KILLS[2], reward: baseReward * 5 },
                { required: NORMAL_ENEMY_KILLS[3], reward: baseReward * 10 },
            ];
        }
        
        // Clean up reward values to be integers rounded to the nearest 5 for a cleaner look
        const finalTiers = tiers.map(tier => ({
            ...tier,
            reward: Math.round(tier.reward / 5) * 5,
        }));

        quests[enemy.name] = { tiers: finalTiers };
    });

    return quests;
}


const GORILLA_BOSS_ABILITIES: Ability[] = [
    {
        id: 'BOSS_GORILA_SALTO_GIGANTE',
        name: 'Salto Gigante',
        icon: '🦍',
        description: 'O gorila salta e, após um breve período, aterrissa na área com mais alvos, causando dano massivo em área e atordoando os atingidos.',
        cooldownMs: 15000, // 15 second cooldown
        effectType: 'AREA_EFFECT', // This seems fitting
        targetType: 'AOE_AROUND_TARGET', // It targets an area
        properties: {
            jumpDurationMs: 1500,
            damageMultiplier: 3.50, // Increased from 0.70
            radius: 150, // a large radius
            stunDurationMs: 2000, // Added stun effect
        }
    },
    {
        id: 'BOSS_GORILA_MACHO_ALFA',
        name: 'Macho Alfa',
        icon: '😤',
        description: 'O gorila bate no peito por 2s, reduzindo o dano recebido em 50%. Depois, ganha +50% de letalidade por 12s.',
        cooldownMs: 20000,
        effectType: 'SELF_BUFF',
        targetType: 'SELF',
        properties: {
            channelDurationMs: 2000,
            channelBuff: {
                id: 'BUFF_MACHO_ALFA_CHANNEL',
                name: 'Peito de Aço',
                icon: '🛡️',
                durationMs: 2000,
                effects: { resistenciaFlat: 100 } // 100 resistance = 50% damage reduction
            },
            finalBuff: {
                id: 'BUFF_MACHO_ALFA_DAMAGE',
                name: 'Fúria Alfa',
                icon: '😤',
                durationMs: 12000,
                effects: { letalidadePercent: 50 }
            }
        }
    }
];

const SCORPION_KING_ABILITIES: Ability[] = [
    {
        id: 'BOSS_ESCORPIAO_TERROR_SUBTERRANEO',
        name: 'Terror Subterrâneo',
        icon: '🦂',
        description: 'Recua para longe, mergulha na areia e avança rapidamente, atordoando heróis no caminho. Emerge causando dano e aplicando um debuff de poeira que reduz o dano dos heróis.',
        cooldownMs: 12000,
        effectType: 'SELF_BUFF',
        targetType: 'NONE',
        properties: {
            channelDurationMs: 2000,
            channelBuff: {
                id: 'BUFF_TERROR_SUBTERRANEO_DIG',
                name: 'Escavando',
                icon: '⏳',
                durationMs: 2000,
                effects: { isInvulnerable: true }
            },
            retreatPhase: {
                durationMs: 1500,
                speedMultiplier: 2.5,
                retreatDistance: 350
            },
            chargePhase: {
                speedMultiplier: 3.5,
                collisionStunMs: 1500,
                knockbackDistance: 60,
                emergenceRadius: 120,
                emergenceDamageMultiplier: 3.5,
                emergenceDebuff: {
                    id: 'DEBUFF_DUST_CLOUD',
                    name: 'Nuvem de Poeira',
                    icon: '💨',
                    durationMs: 5000,
                    effects: { letalidadePercent: -40 }
                }
            }
        }
    }
];

const VENOM_SNAKE_BOSS_ABILITIES: Ability[] = [
    {
        id: 'BOSS_SERPENTE_CUSPE_VENENOSO',
        name: 'Cuspe Venenoso',
        icon: '🤮',
        description: 'Cospe uma bola de veneno que cria uma poça venenosa ao atingir o chão. Inimigos na poça recebem 4% de sua vida máxima como dano por segundo e têm sua resistência reduzida em 30%.',
        cooldownMs: 5000,
        effectType: 'AREA_EFFECT',
        targetType: 'NONE', // Custom targeting
        properties: {
            projectileSpeed: 3,
            puddleRadius: 120,
            puddleDurationMs: 8000,
            tickIntervalMs: 500,
            debuff: {
                id: 'DEBUFF_POCA_VENENOSA',
                name: 'Veneno da Poça',
                icon: '🤢',
                durationMs: 600, // Re-applied every second
                effects: {
                    resistenciaPercent: -30, // Reduces resistance by 30%
                    dot: {
                        tickIntervalMs: 500,
                        damagePercentOfTargetMaxHp: 3,
                    }
                }
            }
        }
    }
];

export const BIOMES: BiomeData = {
    FLORESTA: {
        name: "Floresta",
        description: "Uma floresta densa cheia de criaturas perigosas.",
        color: '#78B446',
        mapIconUrl: 'https://image.pollinations.ai/prompt/top%20down%20game%20map,%20lush%20green%20forest,%20cartoon%20style,%20vibrant,%20simple?width=100&height=100&seed=110',
        boss: { 
            name: "Gorila Ancião", 
            emoji: "🦍", 
            baseHp: 8000, 
            baseDamage: 55, 
            isBoss: true, 
            size: 40, 
            velocidadeMovimento: 1.1, 
            range: 40, 
            attackSpeed: 1200,
            abilities: GORILLA_BOSS_ABILITIES,
            baseStats: { letalidade: 55, vigor: 80, resistencia: 40, velocidadeAtaque: 0, velocidadeMovimento: 1.1, chanceCritica: 80, danoCritico: 30, chanceEsquiva: 5, vampirismo: 0, poderDeCura: 0, curaRecebidaBonus: 0 },
        },
        enemies: [
            { name: 'Leopardo Ágil', emoji: '🐆', baseHp: 150, baseDamage: 10, range: 35, attackSpeed: 800, velocidadeMovimento: 2.0, baseStats: { letalidade: 17, vigor: 15, resistencia: 5, velocidadeAtaque: 15, velocidadeMovimento: 1.5, chanceCritica: 45, danoCritico: 80, chanceEsquiva: 0, vampirismo: 0, poderDeCura: 0, curaRecebidaBonus: 0 } },
            { name: 'Coelho Saltitante', emoji: '🐇', baseHp: 140, baseDamage: 5, range: 25, attackSpeed: 700, velocidadeMovimento: 2.5, baseStats: { letalidade: 29, vigor: 12, resistencia: 0, velocidadeAtaque: 5, velocidadeMovimento: 1.5, chanceCritica: 5, danoCritico: 50, chanceEsquiva: 18, vampirismo: 0, poderDeCura: 0, curaRecebidaBonus: 0 } },
            { name: 'Aranha Venenosa', emoji: '🕷️', baseHp: 160, baseDamage: 8, range: 30, attackSpeed: 900, velocidadeMovimento: 1.6, baseStats: { letalidade: 35, vigor: 22, resistencia: 2, velocidadeAtaque: 10, velocidadeMovimento: 1.6, chanceCritica: 10, danoCritico: 50, chanceEsquiva: 0, vampirismo: 0, poderDeCura: 0, curaRecebidaBonus: 0 } },
            { name: 'Preguiça', emoji: '🦥', baseHp: 360, baseDamage: 10, range: 40, attackSpeed: 2000, velocidadeMovimento: 0.5, baseStats: { letalidade: 40, vigor: 33, resistencia: 20, velocidadeAtaque: -20, velocidadeMovimento: 1.0, chanceCritica: 5, danoCritico: 50, chanceEsquiva: 0, vampirismo: 0, poderDeCura: 0, curaRecebidaBonus: 0 } },
            { name: 'Orangotango', emoji: '🦧', baseHp: 320, baseDamage: 6, range: 40, attackSpeed: 1300, velocidadeMovimento: 1.0, baseStats: { letalidade: 20, vigor: 33, resistencia: 20, velocidadeAtaque: 0, velocidadeMovimento: 1.0, chanceCritica: 10, danoCritico: 50, chanceEsquiva: 0, vampirismo: 0, poderDeCura: 0, curaRecebidaBonus: 0 } },
            { name: 'Macaco', emoji: '🐒', baseHp: 150, baseDamage: 7, range: 30, attackSpeed: 800, velocidadeMovimento: 2.2, baseStats: { letalidade: 35, vigor: 17, resistencia: 0, velocidadeAtaque: 20, velocidadeMovimento: 1.5, chanceCritica: 5, danoCritico: 50, chanceEsquiva: 0, vampirismo: 0, poderDeCura: 0, curaRecebidaBonus: 0 } },
            { name: 'Arara', emoji: '🦜', baseHp: 120, baseDamage: 8, range: 180, attackSpeed: 1100, velocidadeMovimento: 1.8, baseStats: { letalidade: 22, vigor: 16, resistencia: 0, velocidadeAtaque: 0, velocidadeMovimento: 1.5, chanceCritica: 20, danoCritico: 50, chanceEsquiva: 0, vampirismo: 0, poderDeCura: 0, curaRecebidaBonus: 0 } },
            { name: 'Pássaro', emoji: '🐦', baseHp: 110, baseDamage: 9, range: 160, attackSpeed: 1000, velocidadeMovimento: 2.0, baseStats: { letalidade: 35, vigor: 16, resistencia: 0, velocidadeAtaque: 5, velocidadeMovimento: 1.5, chanceCritica: 15, danoCritico: 50, chanceEsquiva: 0, vampirismo: 0, poderDeCura: 0, curaRecebidaBonus: 0 } },
        ],
        scenery: ['tree', 'pine_tree', 'rock', 'flower', 'puddle', 'tree', 'rock', 'pine_tree', 'tree', 'rock', 'flower', 'tree', 'pine_tree', 'tree', 'puddle', 'rock', 'flower', 'tree', 'pine_tree']
    },
    NEVE: {
        name: "Neve",
        description: "Picos congelados habitados por feras resistentes ao frio.",
        color: '#D6EAF8',
        mapIconUrl: 'https://image.pollinations.ai/prompt/top%20down%20game%20map,%20snowy%20winter%20forest,%20cartoon%20style,%20pine%20trees,%20simple?width=100&height=100&seed=120',
        boss: { name: "Boneco de Neve", emoji: '⛄', baseHp: 8800, baseDamage: 45, isBoss: true, size: 45, velocidadeMovimento: 0.9, range: 200, attackSpeed: 1500, baseStats: { letalidade: 20, vigor: 60, resistencia: 40, velocidadeAtaque: -10, velocidadeMovimento: 0.9, chanceCritica: 10, danoCritico: 50, chanceEsquiva: 0, vampirismo: 0, poderDeCura: 0, curaRecebidaBonus: 0 } },
        enemies: [
            { name: 'Lobo de Gelo', emoji: '🐺', baseHp: 294, baseDamage: 18, range: 35, attackSpeed: 900, velocidadeMovimento: 1.9, baseStats: { letalidade: 12, vigor: 5, resistencia: 10, velocidadeAtaque: 10, velocidadeMovimento: 1.9, chanceCritica: 15, danoCritico: 60, chanceEsquiva: 10, vampirismo: 0, poderDeCura: 0, curaRecebidaBonus: 0 } },
            { name: 'Pinguim Bombardeiro', emoji: '🐧', baseHp: 168, baseDamage: 10, range: 200, attackSpeed: 1200, velocidadeMovimento: 1.2, baseStats: { letalidade: 10, vigor: 2, resistencia: 5, velocidadeAtaque: 0, velocidadeMovimento: 1.2, chanceCritica: 10, danoCritico: 50, chanceEsquiva: 5, vampirismo: 0, poderDeCura: 0, curaRecebidaBonus: 0 } },
            { name: 'Urso Polar', emoji: '🐻', baseHp: 504, baseDamage: 22, range: 40, attackSpeed: 1500, velocidadeMovimento: 0.9, baseStats: { letalidade: 15, vigor: 20, resistencia: 15, velocidadeAtaque: -5, velocidadeMovimento: 0.9, chanceCritica: 5, danoCritico: 50, chanceEsquiva: 0, vampirismo: 0, poderDeCura: 0, curaRecebidaBonus: 0 } },
            { name: 'Aranha da Neve', emoji: '🕷️', baseHp: 210, baseDamage: 18, range: 35, attackSpeed: 900, velocidadeMovimento: 1.8, baseStats: { letalidade: 15, vigor: 4, resistencia: 8, velocidadeAtaque: 10, velocidadeMovimento: 1.8, chanceCritica: 10, danoCritico: 50, chanceEsquiva: 10, vampirismo: 0, poderDeCura: 0, curaRecebidaBonus: 0 } },
            { name: 'Vírus Congelado', emoji: '🦠', baseHp: 350, baseDamage: 10, range: 30, attackSpeed: 1800, velocidadeMovimento: 0.7, baseStats: { letalidade: 5, vigor: 10, resistencia: 25, velocidadeAtaque: -15, velocidadeMovimento: 0.7, chanceCritica: 5, danoCritico: 50, chanceEsquiva: 0, vampirismo: 0, poderDeCura: 0, curaRecebidaBonus: 0 } },
            { name: 'Cervo das Neves', emoji: '🦌', baseHp: 245, baseDamage: 15, range: 35, attackSpeed: 1100, velocidadeMovimento: 2.1, baseStats: { letalidade: 5, vigor: 8, resistencia: 5, velocidadeAtaque: 0, velocidadeMovimento: 2.1, chanceCritica: 5, danoCritico: 50, chanceEsquiva: 25, vampirismo: 0, poderDeCura: 0, curaRecebidaBonus: 0 } },
            { name: 'Coruja da Neve', emoji: '🦉', baseHp: 175, baseDamage: 14, range: 220, attackSpeed: 1000, velocidadeMovimento: 1.9, baseStats: { letalidade: 10, vigor: 2, resistencia: 0, velocidadeAtaque: 10, velocidadeMovimento: 1.9, chanceCritica: 25, danoCritico: 60, chanceEsquiva: 15, vampirismo: 0, poderDeCura: 0, curaRecebidaBonus: 0 } },
            { name: 'Snowboarder Radical', emoji: '🏂', baseHp: 196, baseDamage: 16, range: 30, attackSpeed: 800, velocidadeMovimento: 2.8, baseStats: { letalidade: 8, vigor: 4, resistencia: 2, velocidadeAtaque: 20, velocidadeMovimento: 2.8, chanceCritica: 10, danoCritico: 50, chanceEsquiva: 35, vampirismo: 0, poderDeCura: 0, curaRecebidaBonus: 0 } },
        ],
        scenery: ['tree', 'rock', 'tree', 'rock', 'tree', 'tree', 'rock', 'tree', 'rock', 'tree', 'rock', 'rock', 'tree', 'rock', 'tree', 'rock']
    },
    DESERTO: {
        name: "Deserto",
        description: "Dunas escaldantes povoadas por criaturas peçonhentas e resistentes.",
        color: '#FDEBD0',
        mapIconUrl: 'https://image.pollinations.ai/prompt/top%20down%20game%20map,%20sandy%20desert%20with%20cactus,%20cartoon%20style,%20simple?width=100&height=100&seed=130',
        boss: { 
            name: "Escorpião Rei", 
            emoji: '🦂', 
            baseHp: 8000, 
            baseDamage: 72, 
            attackSpeed: 1100, 
            isBoss: true, 
            size: 50, 
            range: 40, 
            velocidadeMovimento: 1.2, 
            abilities: SCORPION_KING_ABILITIES,
            baseStats: { letalidade: 45, vigor: 40, resistencia: 35, velocidadeAtaque: 10, velocidadeMovimento: 1.2, chanceCritica: 20, danoCritico: 100, chanceEsquiva: 5, vampirismo: 0, poderDeCura: 0, curaRecebidaBonus: 0 },
            passiveAbility: {
                id: 'PASSIVE_VENENO_PETRIFICANTE',
                trigger: 'BASIC_ATTACK_LANDED',
                properties: {
                    debuff: {
                        id: 'DEBUFF_VENENO_PETRIFICANTE',
                        name: 'Veneno Petrificante',
                        icon: '☠️',
                        durationMs: 4000,
                        maxStacks: 4,
                        effects: {
                            dot: {
                                tickIntervalMs: 1000,
                                damagePercentOfTargetMaxHp: 2
                            }
                        }
                    },
                    stunAtMaxStacks: {
                        id: 'DEBUFF_PETRIFICADO',
                        name: 'Petrificado',
                        icon: '🗿',
                        durationMs: 2000,
                        effects: {
                            isImmobile: true,
                            resistanceReductionPercent: 50
                        }
                    }
                }
            }
        },
        enemies: [
            { name: 'Cobra Cascavel', emoji: '🐍', baseHp: 231, baseDamage: 18, range: 30, attackSpeed: 800, velocidadeMovimento: 1.6, baseStats: { letalidade: 20, vigor: 3, resistencia: 5, velocidadeAtaque: 25, velocidadeMovimento: 1.6, chanceCritica: 15, danoCritico: 50, chanceEsquiva: 15, vampirismo: 0, poderDeCura: 0, curaRecebidaBonus: 0 } },
            { name: 'Abutre Carniceiro', emoji: '🦅', baseHp: 189, baseDamage: 12, range: 35, attackSpeed: 700, velocidadeMovimento: 2.2, baseStats: { letalidade: 10, vigor: 2, resistencia: 0, velocidadeAtaque: 10, velocidadeMovimento: 2.2, chanceCritica: 20, danoCritico: 60, chanceEsquiva: 20, vampirismo: 0, poderDeCura: 0, curaRecebidaBonus: 0 } },
            { name: 'Lagarto de Comodo', emoji: '🦎', baseHp: 336, baseDamage: 15, range: 25, attackSpeed: 1000, velocidadeMovimento: 1.4, baseStats: { letalidade: 8, vigor: 12, resistencia: 12, velocidadeAtaque: 0, velocidadeMovimento: 1.4, chanceCritica: 5, danoCritico: 50, chanceEsquiva: 5, vampirismo: 0, poderDeCura: 0, curaRecebidaBonus: 0 } },
            { name: 'Dromedário', emoji: '🐪', baseHp: 455, baseDamage: 18, range: 40, attackSpeed: 1600, velocidadeMovimento: 1.0, baseStats: { letalidade: 5, vigor: 25, resistencia: 10, velocidadeAtaque: 0, velocidadeMovimento: 1.0, chanceCritica: 5, danoCritico: 50, chanceEsquiva: 0, vampirismo: 0, poderDeCura: 0, curaRecebidaBonus: 0 } },
            { name: 'Camelo', emoji: '🐫', baseHp: 490, baseDamage: 16, range: 40, attackSpeed: 1700, velocidadeMovimento: 0.9, baseStats: { letalidade: 5, vigor: 28, resistencia: 15, velocidadeAtaque: -5, velocidadeMovimento: 0.9, chanceCritica: 5, danoCritico: 50, chanceEsquiva: 0, vampirismo: 0, poderDeCura: 0, curaRecebidaBonus: 0 } },
        ],
         scenery: ['tree', 'rock', 'rock', 'tree', 'rock', 'tree', 'rock', 'rock', 'tree', 'rock', 'tree', 'rock', 'tree', 'rock', 'rock']
    },
    PANTANO: {
        name: "Pântano",
        description: "Um pântano lamacento e cheio de predadores perigosos.",
        color: '#556B2F', // Dark Olive Green
        mapIconUrl: 'https://image.pollinations.ai/prompt/top%20down%20game%20map,%20swamp%20with%20vines%20and%20murky%20water,%20cartoon%20style,%20simple?width=100&height=100&seed=140',
        boss: { 
            name: "Serpente Venenosa", 
            emoji: '🐍', 
            baseHp: 9500, 
            baseDamage: 65, 
            isBoss: true, 
            size: 55, 
            velocidadeMovimento: 1.0, 
            range: 220, 
            attackSpeed: 1800,
            abilities: VENOM_SNAKE_BOSS_ABILITIES,
            baseStats: { letalidade: 50, vigor: 55, resistencia: 25, velocidadeAtaque: 0, velocidadeMovimento: 1.0, chanceCritica: 35, danoCritico: 70, chanceEsquiva: 15, vampirismo: 0, poderDeCura: 0, curaRecebidaBonus: 0 },
            passiveAbility: {
                id: 'PASSIVE_BOTE_TOXICO',
                trigger: 'BASIC_ATTACK_LANDED',
                properties: {
                    onHitConditional: {
                        requiredDebuffId: 'DEBUFF_POCA_VENENOSA', // From the venom spit
                        guaranteedCrit: true,
                        applyDebuff: {
                            id: 'DEBUFF_TOXINA_MORTAL',
                            name: 'Toxina Mortal',
                            icon: '☣️',
                            durationMs: 3000,
                            effects: {
                                dot: {
                                    tickIntervalMs: 1000,
                                    damagePercentOfTargetMaxHp: 2,
                                }
                            }
                        },
                    }
                }
            }
        },
        enemies: [
            { name: 'Sapo Saltador', emoji: '🐸', baseHp: 196, baseDamage: 45, range: 30, attackSpeed: 800, velocidadeMovimento: 2.2, baseStats: { letalidade: 5, vigor: 4, resistencia: 2, velocidadeAtaque: 10, velocidadeMovimento: 2.2, chanceCritica: 5, danoCritico: 50, chanceEsquiva: 10, vampirismo: 0, poderDeCura: 0, curaRecebidaBonus: 0 } },
            { name: 'Víbora do Lodo', emoji: '🐍', baseHp: 266, baseDamage: 25, range: 35, attackSpeed: 900, velocidadeMovimento: 1.5, baseStats: { letalidade: 25, vigor: 5, resistencia: 5, velocidadeAtaque: 20, velocidadeMovimento: 1.5, chanceCritica: 15, danoCritico: 50, chanceEsquiva: 10, vampirismo: 0, poderDeCura: 0, curaRecebidaBonus: 0 } },
            { name: 'Salamandra Ácida', emoji: '🦎', baseHp: 224, baseDamage: 20, range: 180, attackSpeed: 1100, velocidadeMovimento: 1.4, baseStats: { letalidade: 15, vigor: 6, resistencia: 10, velocidadeAtaque: 5, velocidadeMovimento: 1.4, chanceCritica: 10, danoCritico: 50, chanceEsquiva: 5, vampirismo: 0, poderDeCura: 0, curaRecebidaBonus: 0 } },
            { name: 'Jacaré Sorrateiro', emoji: '🐊', baseHp: 385, baseDamage: 24, range: 40, attackSpeed: 1200, velocidadeMovimento: 1.2, baseStats: { letalidade: 20, vigor: 15, resistencia: 12, velocidadeAtaque: 0, velocidadeMovimento: 1.2, chanceCritica: 20, danoCritico: 60, chanceEsquiva: 5, vampirismo: 0, poderDeCura: 0, curaRecebidaBonus: 0 } },
            { name: 'Hipopótamo Agressivo', emoji: '🦛', baseHp: 630, baseDamage: 28, range: 40, attackSpeed: 1800, velocidadeMovimento: 0.8, baseStats: { letalidade: 20, vigor: 30, resistencia: 20, velocidadeAtaque: -10, velocidadeMovimento: 0.8, chanceCritica: 5, danoCritico: 50, chanceEsquiva: 0, vampirismo: 0, poderDeCura: 0, curaRecebidaBonus: 0 } },
            { name: 'Tartaruga Ancestral', emoji: '🐢', baseHp: 840, baseDamage: 15, range: 40, attackSpeed: 2200, velocidadeMovimento: 0.4, baseStats: { letalidade: 5, vigor: 40, resistencia: 30, velocidadeAtaque: -25, velocidadeMovimento: 0.4, chanceCritica: 5, danoCritico: 50, chanceEsquiva: 0, vampirismo: 0, poderDeCura: 0, curaRecebidaBonus: 0 } },
        ],
        scenery: ['tree', 'rock', 'river', 'tree', 'rock', 'river', 'rock']
    },
};

export const BESTIARY_QUESTS: { [enemyName: string]: { tiers: { required: number; reward: number }[] } } = generateBestiaryQuests(BIOMES);
