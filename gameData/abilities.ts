import type { Ability, ActiveBuffDebuffEffect } from '../types';

const ADVENTURER_ABILITIES: Ability[] = [
    {
        id: 'AVENTUREIRO_SOCO_SERIO',
        name: 'Soco Sério',
        icon: '🤜',
        description: 'Um soco comum, causa dano baseado no seu dano base +2% da vida máxima do alvo.',
        cooldownMs: 5000,
        effectType: 'AOE_DAMAGE_DEBUFF', // Using this type for single-target instant damage, like Shield Bash
        targetType: 'SINGLE_ENEMY',
        properties: { 
            bonusDamagePercentTargetMaxHp: 2,
        }
    }
];

const WARRIOR_ABILITIES: Ability[] = [
    {
        id: 'GUERREIRO_INTERCEPTAR',
        name: 'Interceptar',
        icon: '🦶',
        description: 'Você corre em direção ao inimigo mais próximo numa velocidade 3x maior que a sua velocidade normal, ao chegar perto do inimigo o golpeia causando dano (dano base + 100% da letalidade + 50% do vigor), além disso atordoa o inimigo por 1,5 segundos. Essa habilidade sempre causa dano crítico.',
        cooldownMs: 10000,
        effectType: 'SELF_BUFF',
        targetType: 'NONE',
        durationMs: 2000,
        properties: {
            speedMultiplier: 3,
            onHitEffect: {
                lethalityMultiplier: 1,
                vigorMultiplier: 0.5,
                stunDurationMs: 1500,
                alwaysCrit: true,
            },
        },
    },
    {
        id: 'GUERREIRO_TORNADO_MORTAL',
        name: 'Tornado Mortal',
        icon: '🌪️',
        description: "Gira sua espada, causando dano (dano base + 70% letalidade + 30% vigor) a inimigos ao redor. Se a barra de fúria estiver cheia, a habilidade consome toda a fúria para causar dano crítico.",
        cooldownMs: 4000,
        effectType: 'AOE_DAMAGE_DEBUFF',
        targetType: 'AOE_AROUND_SELF',
        properties: {
            radius: 100,
            damageLethalityMultiplier: 0.7,
            damageVigorMultiplier: 0.3,
        }
    },
    {
        id: 'GUERREIRO_CORTE_CRESCENTE',
        name: 'Corte Crescente',
        icon: '🗡️',
        description: 'Um efeito de slash em formato de cone na frente do herói, que causa dano (80% Letalidade + 40% do Vigor) às unidades atingidas, além de aplicar um debuff "Corte Crescente" por 4 segundos, que reduz o dano que o alvo causa em 30% (acumula até 2x). Se essa habilidade for usada enquanto a barra de fúria estiver no máximo, lança ela duas vezes.',
        cooldownMs: 6000,
        effectType: 'AOE_DAMAGE_DEBUFF',
        targetType: 'CONE_ENEMY',
        properties: {
            coneAngle: 60,
            coneRange: 120,
            damageLethalityMultiplier: 0.8,
            damageVigorMultiplier: 0.4,
            debuff: {
                id: 'DEBUFF_CORTE_CRESCENTE',
                name: 'Corte Crescente',
                icon: '🗡️',
                durationMs: 4000,
                maxStacks: 2,
                effects: { letalidadePercent: -30 }
            },
            furySynergy: {
                castTwice: true
            }
        }
    },
    {
        id: 'GUERREIRO_REGENERACAO_DE_COMBATE',
        name: 'Regeneração de Combate',
        icon: '💔',
        description: "Cura-se instantaneamente, recebendo +30% de resistência e dano bônus nos ataques por 5s. Com Fúria máxima, consome-a toda para trocar a cura inicial por uma forte cura contínua e fazer com que seus ataques gerem o dobro de fúria.",
        cooldownMs: 10000,
        effectType: 'SELF_HEAL',
        targetType: 'SELF',
        properties: {
            instantHeal: {
                lethalityMultiplier: 0.6,
                vigorMultiplier: 0.5,
            },
            mainBuff: {
                id: 'BUFF_REGENERACAO_DE_COMBATE_MAIN',
                name: 'Regeneração de Combate',
                icon: '💔',
                durationMs: 5000,
                effects: { 
                    resistenciaPercent: 30,
                    bonusDamageOnAttackAsPercentOfMaxHp: 3,
                    furiaPerAttack: 1
                }
            },
            maxFuryHotBuff: {
                id: 'BUFF_REGENERACAO_DE_COMBATE_HOT',
                name: 'Fúria Regenerativa',
                icon: '💔',
                durationMs: 5000,
                effects: {
                    hot: {
                        tickIntervalMs: 1000,
                        healPercentOfMaxHp: 7,
                    }
                }
            },
            maxFuryBonusEffect: { 
                furiaPerAttack: 1 
            }
        }
    }
];

const ARCHER_ABILITIES: Ability[] = [
    {
        id: 'ARQUEIRO_DISPARO_PRECISO',
        name: 'Disparo Preciso',
        icon: '🎯',
        description: 'Atira uma flecha que causa dano (120% Letalidade) e aplica "Na Mira" 💢, reduzindo a defesa do alvo em 5%. Acumula até 5 vezes.',
        cooldownMs: 2000,
        effectType: 'PROJECTILE_DAMAGE',
        targetType: 'SINGLE_ENEMY',
        properties: { 
            damageLethalityMultiplier: 1.15,
            debuff: {
                id: 'DEBUFF_NA_MIRA',
                name: 'Na Mira',
                icon: '💢',
                durationMs: 8000,
                maxStacks: 5,
                effects: { resistanceReductionPercent: 5 }
            }
        }
    },
    {
        id: 'ARQUEIRO_TIRO_MORTAL',
        name: 'Tiro Mortal',
        icon: '☠️',
        description: 'Causa dano em todos os inimigos com "Na Mira" baseado nos acúmulos + 22% da vida perdida do alvo. Consome os acúmulos.',
        cooldownMs: 5000,
        effectType: 'AOE_DAMAGE_DEBUFF',
        targetType: 'NONE',
        properties: { 
            damagePerStackMultiplier: 1.5,
            damagePercentMissingHp: 12,
            consumesDebuffId: 'DEBUFF_NA_MIRA'
        }
    },
    {
        id: 'ARQUEIRO_DISPARO_MULTIPLO',
        name: 'Disparo Múltiplo',
        icon: '🔱',
        description: 'Dispara 5 flechas em cone que atravessam inimigos, causando dano (130% Letalidade).',
        cooldownMs: 6000,
        effectType: 'PROJECTILE_DAMAGE',
        targetType: 'CONE_ENEMY',
        properties: { 
            numProjectiles: 5,
            coneAngle: 60,
            damageLethalityMultiplier: 1.3,
            piercing: true
        }
    },
    {
        id: 'ARQUEIRO_HABILIDADE_E_PRECISAO',
        name: 'Habilidade e Precisão',
        icon: '🏹',
        description: 'Aumenta 100% seu alcance de ataque, aumenta 20% sua velocidade de ataque durante 5 segundos e enquanto o efeito do buff estiver ativo, ataques e habilidades que eram de alvo único, agora atingem até 3 alvos.',
        cooldownMs: 20000,
        effectType: 'SELF_BUFF',
        targetType: 'SELF',
        durationMs: 5000,
        properties: { 
            rangePercent: 100,
            velocidadeAtaquePercent: 20,
            multiShot: {
                count: 3
            }
        }
    }
];

const GUARDIAN_ABILITIES: Ability[] = [
    {
        id: 'GUARDIÃO_GOLPE_DE_ESCUDO',
        name: 'Golpe de Escudo',
        icon: '💫',
        description: 'Golpeia o inimigo, causando dano (10% da sua vida máxima + dano base) e atordoa o alvo por 2 segundos. Este ataque pode causar acerto crítico.',
        cooldownMs: 10000,
        effectType: 'AOE_DAMAGE_DEBUFF', // Using existing type, logic is handled by ID
        targetType: 'SINGLE_ENEMY',
        properties: {
            canCrit: true, 
            stunDurationMs: 2000, 
            bonusDamagePercentCasterMaxHp: 10,
        }
    },
    {
        id: 'GUARDIÃO_PROVOCAR',
        name: 'Provocar',
        icon: '🤬',
        description: 'Força inimigos próximos a te atacar e aumenta sua Resistência em 50 por 4 segundos.',
        cooldownMs: 8000,
        effectType: 'AOE_DAMAGE_DEBUFF', // Using existing type, custom logic applies
        targetType: 'AOE_AROUND_SELF',
        durationMs: 4000,
        properties: {
            resistanceBonusFlat: 50,
            radius: 150,
        }
    },
    {
        id: 'GUARDIÃO_FORCA_DE_BLOQUEIO',
        name: 'Força de Bloqueio',
        icon: '🛡️',
        description: 'Cria escudos orbitais que bloqueiam os próximos 2 ataques inimigos recebidos.',
        cooldownMs: 10000,
        effectType: 'SELF_BUFF',
        targetType: 'SELF',
        durationMs: 15000,
        properties: { blockCharges: 2 }
    },
    {
        id: 'GUARDIÃO_PROTEÇÃO_COMPARTILHADA',
        name: 'Proteção Compartilhada',
        icon: '🤝',
        description: 'Você e seus aliados ganham um escudo correspondente a 20% da sua vida máxima. Se sua vida estiver acima de 70%, você também ganha +50% de Vigor por 10 segundos.',
        cooldownMs: 15000,
        effectType: 'SELF_BUFF',
        targetType: 'NONE', // Affects all allies, not a specific target
        properties: {
            shieldHpPercentOfCasterMaxHp: 10,
            conditionalVigorBonusPercent: 60,
            healthThresholdPercent: 70,
            buffDurationMs: 10000,
        }
    }
];

const MAGE_ABILITIES: Ability[] = [
    {
        id: 'MAGO_BOLA_DE_FOGO',
        name: 'Bola de Fogo',
        icon: '🔥',
        description: 'Arremessa uma bola de fogo que causa dano (130% da letalidade) e aplica "Queimadura" por 6s. Queimadura causa dano por segundo (80% do dano base + 1% da vida total do alvo).',
        cooldownMs: 10000,
        effectType: 'PROJECTILE_DAMAGE',
        targetType: 'SINGLE_ENEMY',
        properties: {
            canCrit: true,    
            damageLethalityMultiplier: 1.5,
            debuff: {
                id: 'DEBUFF_QUEIMADURA',
                name: 'Queimadura',
                icon: '🔥',
                durationMs: 6000,
                effects: {
                    dot: { // This part is a template, the actual damage value is calculated on hit
                        tickIntervalMs: 1000,
                        damagePercentOfTargetMaxHp: 1,
                        damagePercentOfCasterDamage: 80
                    }
                }
            }
        }
    },
    {
        id: 'MAGO_EXPLOSAO_MAGICA',
        name: 'Explosão Mágica',
        icon: '💥',
        description: 'Seu próximo ataque causa dano crítico e atinge inimigos ao redor do alvo. Se o alvo estiver com "Queimadura", o efeito se espalha para os outros inimigos atingidos.',
        cooldownMs: 6000,
        effectType: 'ATTACK_MODIFIER',
        targetType: 'SELF',
        durationMs: 5000, // 5s window to perform the attack
        properties: {
            nextAttackCrit: true,
            nextAttackSplash: {
                radius: 80, // A small area
                damageMultiplier: 1.0, // Splash deals full damage
                spreadsDebuffId: 'DEBUFF_QUEIMADURA'
            }
        }
    },
    {
        id: 'MAGO_INTELECTO_SURREAL',
        name: 'Intelecto Surreal',
        icon: '🧙‍♂️',
        description: 'Você lança um buff poderoso nos aliados concedendo +50% em dano crítico e +30% Letalidade, duração 15 segundos.',
        cooldownMs: 20000,
        effectType: 'SELF_BUFF',
        targetType: 'NONE', // Affects all allies
        durationMs: 15000,
        properties: { 
            danoCriticoPercent: 50, 
            letalidadePercent: 30 
        }
    },
    {
        id: 'MAGO_EXPLOSAO_GELIDA',
        name: 'Explosão Gélida',
        icon: '❄️',
        description: 'Causa dano em área no alvo atual ou inimigo mais próximo (130% da letalidade), e aplica o efeito de lentidão nos alvos (-30% de velocidade no movimento e -50% na velocidade de ataque).',
        cooldownMs: 5000,
        effectType: 'AOE_DAMAGE_DEBUFF',
        targetType: 'AOE_AROUND_TARGET',
        properties: {
            canCrit: true,
            radius: 120,
            damageLethalityMultiplier: 1.3,
            debuff: {
                id: 'DEBUFF_LENTIDAO',
                name: 'Lentidão',
                icon: '🥶',
                durationMs: 5000,
                effects: { 
                    velocidadeMovimentoPercent: -30,
                    velocidadeAtaquePercent: -50
                }
            }
        }
    }
];

const ASSASSIN_ABILITIES: Ability[] = [
    {
        id: 'ASSASSINO_MODO_OCULTO',
        name: 'Modo Oculto',
        icon: '🐱‍👤',
        description: 'Você entra em estado furtivo, ficando invisível por 2,5 segundos. Durante esse período, nenhum inimigo consegue te ver, e você pode atacar e usar outras habilidades normalmente sem ser revelado.',
        cooldownMs: 15000,
        effectType: 'SELF_BUFF',
        targetType: 'SELF',
        durationMs: 2500,
        properties: {
            // No specific properties needed, the effect is handled by the buff system
        }
    },
    {
        id: 'ASSASSINO_GOLPE_DUPLO',
        name: 'Golpe Duplo',
        icon: '🤺',
        description: 'Atinge o inimigo com 2 golpes consecutivos, causando dano (130% da letalidade). Se você estiver em modo furtivo, esta habilidade causa dano crítico.',
        cooldownMs: 4000,
        effectType: 'AOE_DAMAGE_DEBUFF', // Using for direct damage
        targetType: 'SINGLE_ENEMY',
        properties: {
            range: 50,
            damageLethalityMultiplier: 0.6,
            numberOfHits: 2,
            hitIntervalMs: 200,
            critFromStealth: true,
        }
    },
    {
        id: 'ASSASSINO_APUNHALAR',
        name: 'Apunhalar',
        icon: '🔪',
        description: 'Teleporta para um inimigo, causando dano (Dano Base + 150% Letalidade) e aplicando "Apunhalado". Alvos "Apunhalados" recebem de 10% a 70% de dano aumentado do Assassino, com base na vida perdida do alvo (o bônus máximo é alcançado com 30% de vida ou menos). Causa dano crítico garantido se usado em modo furtivo.',
        cooldownMs: 8000,
        effectType: 'AOE_DAMAGE_DEBUFF',
        targetType: 'SINGLE_ENEMY',
        properties: {
            range: 250,
            damageLethalityMultiplier: 1.0,
            critFromStealth: true,
            debuff: {
                id: 'DEBUFF_APUNHALADO',
                name: 'Apunhalado',
                icon: '🩸',
                durationMs: 6000,
                effects: {}
            }
        }
    },
    {
        id: 'ASSASSINO_AGILIDADE_EXTREMA',
        name: 'Agilidade Extrema',
        icon: '👣',
        description: 'Você recebe +40% de chance de esquiva, +30% em velocidade de ataque e 30% em velocidade de movimento, durante 5 segundos. Se você estiver no modo furtivo, você ganha o dobro dos efeitos.',
        cooldownMs: 20000,
        effectType: 'SELF_BUFF',
        targetType: 'SELF',
        durationMs: 5000,
        properties: {
            chanceEsquivaPercent: 40,
            velocidadeAtaquePercent: 30,
            velocidadeMovimentoPercent: 30,
            stealthBonusMultiplier: 2,
        }
    }
];

const NECROMANCER_ABILITIES: Ability[] = [
    {
        id: 'NECROMANTE_SERVOS_ESQUELETICOS',
        name: 'Servos Esqueléticos',
        icon: '💀',
        description: 'Invoca um servo (💀) para lutar ao seu lado (máx. 3). O esqueleto possui 40% dos seus atributos e seus ataques causam dano bônus igual a 15% da sua vida perdida. Se você já tiver 3 servos, a habilidade concede "Frenesi Esquelético" ⚡ a todos eles por 8s, aumentando a velocidade de ataque em 100%.',
        cooldownMs: 3000,
        effectType: 'SUMMON',
        targetType: 'NONE',
        properties: {
            maxSummons: 3,
            statTransferPercent: 40,
            bonusDamagePercentCasterMissingHp: 15,
            frenzyBuff: {
                id: 'BUFF_FRENESI_ESQUELETICO',
                name: 'Frenesi Esquelético',
                icon: '⚡️',
                durationMs: 8000,
                effects: {
                    velocidadeAtaquePercent: 100
                }
            }
        }
    },
    {
        id: 'NECROMANTE_ESCUDO_DE_OSSOS',
        name: 'Escudo de Ossos',
        icon: '🦴',
        description: 'O necromante abdica de 30% da sua vida atual para conceder ao necromante e aos seus esqueletos um escudo equivalente a 5% da sua vida máxima + 20% da vida perdida. Além disso, os esqueletos e o necromante ganham um buff adicional "Poder Necro" ☠️, que faz com que os ataques causem dano por segundo (durante 3 segundos), equivalente a 12% da vida perdida do necromante + 5% da vida perdida do alvo.',
        cooldownMs: 8000,
        effectType: 'SELF_BUFF',
        targetType: 'NONE',
        properties: {
            radius: 100,
            hpCostCurrentHpPercent: 30,
            shieldFromMaxHpPercent: 5,
            shieldFromMissingHpPercent: 20,
            buffs: [
                {
                    id: 'BUFF_ESCUDO_DE_OSSOS',
                    name: 'Escudo de Ossos',
                    icon: '🦴',
                    durationMs: 6000,
                    effects: {},
                },
                {
                    id: 'BUFF_PODER_NECRO',
                    name: 'Poder Necro',
                    icon: '☠️',
                    durationMs: 6000,
                    effects: {
                        applyDotOnHit: {
                            id: 'DEBUFF_PODER_NECRO_DOT',
                            name: 'Decaindo',
                            icon: '☠️',
                            dotDurationMs: 3000,
                            dotTickIntervalMs: 1000,
                            dotDamagePercentCasterMissingHp: 8,
                            dotDamagePercentTargetMissingHp: 3,
                        },
                    },
                },
            ],
        },
    },
    {
        id: 'NECROMANTE_EXPLOSAO_NECROTICA',
        name: 'Explosão Necrótica',
        icon: '🔘',
        description: 'Sacrifica seus esqueletos com uma explosão ao redor deles, causando dano (150% letalidade + 8% vida perdida do necromante). Os esqueletos morrem no processo.',
        cooldownMs: 3000,
        effectType: 'AOE_DAMAGE_DEBUFF',
        targetType: 'NONE',
        properties: {
            canCrit: true,
            radius: 120, // Explosion radius around each skeleton
            damageLethalityMultiplier: 1.5,
            damagePercentMissingHp: 8,
        }
    },
    {
        id: 'NECROMANTE_ABSORVER_ESSENCIA',
        name: 'Absorver Essencia',
        icon: '🖤',
        description: "O necromante Absorve a essência de seus esqueletos, sacrificando-os e recuperando vida de acordo com a quantidade de esqueletos absorvidos (100% do dano base + 5% da vida perdida, por cada esqueleto). Se o necromante estiver com o Escudo de ossos, recebe uma cura a cada meio segundo (2% da vida máxima do necromante), por 5 segundos.",
        cooldownMs: 10000,
        effectType: 'SELF_HEAL',
        targetType: 'NONE',
        properties: {
            baseDamageMultiplier: 1.0,
            missingHpMultiplier: 0.05,
            conditionalHotBuff: {
                requiredBuffId: 'BUFF_ESCUDO_DE_OSSOS',
                buff: {
                    id: 'BUFF_ESSENCIA_REGENERADORA',
                    name: 'Essência Regeneradora',
                    icon: '🖤',
                    durationMs: 5000,
                    effects: {
                        hot: {
                            tickIntervalMs: 500,
                            healPercentOfMaxHp: 2,
                        }
                    }
                }
            }
        }
    }
];

const DRUIDA_ABILITIES: Ability[] = [
    {
        id: 'DRUIDA_ESSENCIA_DA_VIDA',
        name: 'Essência da Vida',
        icon: '🍃',
        description: 'Lança uma cura por segundo em você e em todos os aliados (1% da vida máxima do alvo) durante 4 segundos. Após 5 segundos, cria uma cura crítica em você e todos os aliados (1% da vida máxima do alvo + 10% da vida perdida).',
        cooldownMs: 8000,
        effectType: 'SELF_BUFF',
        targetType: 'NONE',
        properties: {
            hot: {
                id: 'BUFF_ESSENCIA_DA_VIDA_HOT',
                name: 'Essência da Vida',
                icon: '🍃',
                durationMs: 4000,
                tickIntervalMs: 1000,
                healPercentOfTargetMaxHp: 1
            },
            delayedHeal: {
                delayMs: 4500,
                healPercentOfTargetMaxHp: 1,
                healPercentOfTargetMissingHp: 10,
                canCrit: true
            }
        }
    },
    {
        id: 'DRUIDA_ENRAIZAR',
        name: 'Enraizar',
        icon: '🌿',
        description: 'Prende inimigos em uma área por 1,5s. Para cada inimigo atingido, invoca uma Árvore Viva que herda 10% dos seus atributos. Quando uma Árvore Viva é curada, ela causa dano em área (20% Letalidade) a inimigos próximos.',
        cooldownMs: 12000,
        effectType: 'AOE_DAMAGE_DEBUFF',
        targetType: 'AOE_AROUND_TARGET',
        properties: {
            radius: 100, // Radius of the initial rooting effect
            debuff: {
                id: 'DEBUFF_ENRAIZADO',
                name: 'Enraizado',
                icon: '🌿',
                durationMs: 1500,
                effects: {
                    isImmobile: true,
                }
            },
            summonOnHit: {
                type: 'LIVING_TREE',
                statTransferPercent: 10,
                onHealEffect: {
                    damageRadius: 60,
                    lethalityMultiplier: 0.2
                }
            }
        }
    },
    {
        id: 'DRUIDA_BENÇÃO_FLORESTA',
        name: 'Benção Floresta',
        icon: '🌳',
        description: 'Cura instantaneamente todos os aliados (1% da vida máxima + 4% da vida perdida). Se o alvo estiver sob efeito de Essência da vida, a cura é dobrada e aplica um efeito de cura por segundo (1% da vida máxima do alvo) e aumento de cura recebida bônus em 30%, durante 3 segundos. Esta habilidade pode criticar.',
        cooldownMs: 4000,
        effectType: 'SELF_BUFF',
        targetType: 'NONE',
        properties: {
            canCrit: true,
            instantHeal: {
                maxHpPercent: 1,
                missingHpPercent: 3
            },
            synergy: {
                requiredBuffId: 'BUFF_ESSENCIA_DA_VIDA_HOT',
                healMultiplier: 2,
                hotBuff: {
                    id: 'BUFF_BENÇÃO_FLORESTA_HOT',
                    name: 'Bênção da Floresta',
                    icon: '🌳',
                    durationMs: 3000,
                    effects: {
                        hot: {
                            tickIntervalMs: 1000,
                            healPercentOfMaxHp: 1,
                        }
                    }
                },
                healingReceivedBuff: {
                    id: 'BUFF_BENÇÃO_FLORESTA_HEAL_BONUS',
                    name: 'Cura Aprimorada',
                    icon: '🌿',
                    durationMs: 3000,
                    effects: {
                        curaRecebidaBonus: 15
                    }
                }
            }
        }
    },
    {
        id: 'DRUIDA_PODER_SELVAGEM',
        name: 'Poder Selvagem',
        icon: '🐾',
        description: 'Abençoa todos os aliados com o poder da natureza, concedendo +20% de Vigor (Vida Máx.), +15% de Resistência, +10% de Chance de Esquiva e +20% de Bônus de Cura Recebida por 8 segundos.',
        cooldownMs: 8000,
        effectType: 'SELF_BUFF',
        targetType: 'NONE', // Affects all allies
        durationMs: 8000,
        properties: { 
            vigorPercent: 20,
            resistenciaPercent: 15,
            chanceEsquivaPercent: 10,
            curaRecebidaBonusPercent: 20,
        }
    }
];

const CORRUPTED_PALADIN_ABILITIES: Ability[] = [
    {
        id: 'PALADINO_QUEBRA_LUZ',
        name: 'Quebra Luz',
        icon: '🔷',
        description: "Um golpe poderoso que causa dano (100% vigor + bônus da sua resistência). Nunca erra e não pode ser crítico. Gera 2 Corrupção. Se 'Benção Corrompida' estiver ativa, aplica um dano por segundo devastador.",
        cooldownMs: 3000,
        effectType: 'AOE_DAMAGE_DEBUFF', // for direct damage
        targetType: 'SINGLE_ENEMY',
        properties: {
            damageVigorMultiplier: 1.0,
            bonusDamageFromResistance: true, // Use the raw resistance value
            neverCrit: true,
            neverMiss: true,
            corruptionGain: 2,
            synergy: {
                requiredBuffId: 'BUFF_VIGOR_CORROMPIDO',
                applyDot: {
                    id: 'DEBUFF_QUEBRA_LUZ_DOT',
                    name: 'Luz Quebrada',
                    icon: '🔹',
                    durationMs: 5000,
                    effects: {
                        dot: { // This is a template; damage is calculated on application
                            tickIntervalMs: 1000,
                            // These are multipliers for the GameContainer logic
                            damageVigorMultiplier: 0.5,
                            damagePercentCasterMaxHp: 1,
                        }
                    }
                }
            }
        }
    },
    {
        id: 'PALADINO_ABSOLVICAO_CRUEL',
        name: 'Absolvição Cruel',
        icon: '🔅',
        description: "Cura você e seus aliados (120% do poder de cura + 2% da sua vida máxima). Se a Corrupção estiver cheia, consome toda ela para aplicar uma cura crítica e conceder cura por segundo (100% poder de cura + 0.5% da sua vida máxima) por 5s.",
        cooldownMs: 5000,
        effectType: 'SELF_BUFF',
        targetType: 'NONE',
        properties: {
            heal: {
                powerOfHealingMultiplier: 1.2,
                casterMaxHpPercent: 2,
            },
            corruptionSynergy: {
                makeHealCrit: true,
                applyHot: {
                    id: 'BUFF_ABSOLVICAO_CRUEL_HOT',
                    name: 'Absolvição Cruel',
                    icon: '🔅',
                    durationMs: 5000,
                    effects: {
                        hot: {
                            tickIntervalMs: 1000,
                            powerOfHealingMultiplier: 1.0,
                            casterMaxHpPercent: 0.5,
                        }
                    }
                }
            }
        }
    },
    {
        id: 'PALADINO_BENCAO_CORROMPIDA',
        name: 'Benção Corrompida',
        icon: '💜',
        description: "Cura você e os aliados (250% poder de cura + 10% da sua vida máxima). Esta cura sempre causa um acerto crítico, escalando com seu Dano Crítico. Concede a todos 'Benção Corrompida' (+30% resistência por 12s) e a si mesmo 'Vigor Corrompido' (+200% vigor por 4s).",
        cooldownMs: 18000,
        effectType: 'SELF_BUFF',
        targetType: 'NONE',
        properties: {
            heal: {
                powerOfHealingMultiplier: 2.5,
                casterMaxHpPercent: 10,
            },
            allyBuff: {
                id: 'BUFF_BENCAO_CORROMPIDA',
                name: 'Benção Corrompida',
                icon: '💜',
                durationMs: 12000,
                effects: { resistenciaPercent: 30 }
            },
            selfBuff: {
                id: 'BUFF_VIGOR_CORROMPIDO',
                name: 'Vigor Corrompido',
                icon: '🟣',
                durationMs: 4000,
                effects: { vigorPercent: 200 }
            }
        }
    },
    {
        id: 'PALADINO_JULGAMENTO_DISTORCIDO',
        name: 'Julgamento Distorcido',
        icon: '💠',
        description: "Consome toda a corrupção para aplicar um dano massivo no alvo (100% do vigor + 150% letalidade), aumentado em 20% por ponto de corrupção. Nunca erra e nunca causa acerto crítico.",
        cooldownMs: 25000,
        effectType: 'AOE_DAMAGE_DEBUFF', // for direct damage
        targetType: 'SINGLE_ENEMY',
        properties: {
            damageVigorMultiplier: 1.0,
            damageLethalityMultiplier: 1.5,
            damageBonusPerCorruptionPointPercent: 20,
            consumesAllCorruption: true,
            requiresCorruption: true,
            neverCrit: true,
            neverMiss: true,
        }
    }
];

const BARDO_ABILITIES: Ability[] = [
    {
        id: 'BARDO_ACORDE_DISSONANTE',
        name: 'Acorde Dissonante',
        icon: '🎶',
        description: 'Toca uma música agitada que causa dano em área (150% da Letalidade) a inimigos próximos. Esta habilidade pode causar acerto crítico.',
        cooldownMs: 3000,
        effectType: 'AOE_DAMAGE_DEBUFF',
        targetType: 'AOE_AROUND_SELF',
        properties: {
            radius: 120,
            damageLethalityMultiplier: 1.5,
            canCrit: true,
            compositionKey: 1, // Custom property to identify the ability for the combo
            compositionColor: '#C471ED', // Purple
        }
    },
    {
        id: 'BARDO_MELODIA_SERENA',
        name: 'Melodia Serena',
        icon: '🎵',
        description: 'Toca uma música calma que cura levemente (110% do Poder de Cura) todos os aliados. Esta habilidade pode causar acerto crítico.',
        cooldownMs: 2000,
        effectType: 'SELF_BUFF', // It's an AoE heal, SELF_BUFF is a good type for ally-wide effects.
        targetType: 'NONE',
        properties: {
            healPowerOfHealingMultiplier: 1.1,
            canCrit: true,
            compositionKey: 2, // Custom property
            compositionColor: '#76D7C4', // Green
        }
    },
    {
        id: 'BARDO_BALAUSTRADA_HARMONICA',
        name: 'Balaustrada Harmônica',
        icon: '🪕',
        description: 'Toca uma música inspiradora que concede um escudo a todos os aliados (200% do Poder de Cura).',
        cooldownMs: 3000,
        effectType: 'SELF_BUFF', // It's an AoE shield
        targetType: 'NONE',
        properties: {
            shieldPowerOfHealingMultiplier: 1.0,
            compositionKey: 3, // Custom property
            compositionColor: '#F7DC6F', // Yellow
        }
    },
    {
        id: 'BARDO_INICIO_DA_COMPOSICAO',
        name: 'Início da Composição',
        icon: '🎼',
        description: "Inicia uma composição musical, permitindo que as próximas 3 habilidades criem um efeito poderoso. Reseta o tempo de recarga das outras habilidades.\n\nCombos (afetam todos os aliados por 10s):\n🎶->🎵->🪕 (Fúria): +30% de Letalidade.\n🎶->🪕->🎵 (Certeiro): +30% de Chance Crítica.\n🎵->🎶->🪕 (Vida): Forte cura contínua.\n🎵->🪕->🎶 (Restauração): +30% de Poder de Cura.\n🪕->🎵->🎶 (Baluarte): +30% de Resistência.\n🪕->🎶->🎵 (Vigor): +30% de Vigor.",
        cooldownMs: 6000,
        effectType: 'SELF_BUFF',
        targetType: 'SELF',
        properties: {}
    },
];

export const BARD_COMBOS: { [key: string]: { id: string; name: string; icon: string; effects: ActiveBuffDebuffEffect } } = {
    '123': {
        id: 'BARD_COMBO_123',
        name: 'Onda Sonora Devastadora',
        icon: '🔊',
        effects: {
            bardoComboAura: {
                tickIntervalMs: 500,
                lethalityMultiplier: 1.5,
                missingHpPercentDamage: 15,
                radius: 150,
                sourceCasterId: 0 // Placeholder
            }
        }
    },
    '132': {
        id: 'BARD_COMBO_132',
        name: 'Ritmo Certeiro',
        icon: '🎯',
        effects: { chanceCriticaPercent: 30 }
    },
    '213': {
        id: 'BARD_COMBO_213',
        name: 'Melodia da Vida',
        icon: '💖',
        effects: {
            hot: {
                tickIntervalMs: 1000,
                healPercentOfTargetMissingHp: 3,
                healFromCasterPowerOfHealingMultiplier: 1.0,
                sourceCasterId: 0 // Placeholder, will be replaced in HeroEntity
            }
        }
    },
    '231': {
        id: 'BARD_COMBO_231',
        name: 'Hino da Restauração',
        icon: '✨',
        effects: { poderDeCuraPercent: 30 }
    },
    '321': {
        id: 'BARD_COMBO_321',
        name: 'Baluarte Protetor',
        icon: '🛡️',
        effects: { resistenciaPercent: 30 }
    },
    '312': {
        id: 'BARD_COMBO_312',
        name: 'Hino do Vigor',
        icon: '💪',
        effects: { vigorPercent: 30 }
    }
};

export {
    ADVENTURER_ABILITIES,
    WARRIOR_ABILITIES,
    ARCHER_ABILITIES,
    GUARDIAN_ABILITIES,
    MAGE_ABILITIES,
    ASSASSIN_ABILITIES,
    NECROMANCER_ABILITIES,
    DRUIDA_ABILITIES,
    CORRUPTED_PALADIN_ABILITIES,
    BARDO_ABILITIES
};
