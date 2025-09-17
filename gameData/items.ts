import type { Item as ItemType, MarketItem } from '../types';

export const DROPPABLE_WEAPONS: ItemType[] = [
    { name: "Espada Velha", type: 'sword', icon: '🗡️', tier: 1, description: "Uma espada básica, mas confiável para um iniciante.", statBonuses: { danoCritico: 20, resistencia: 20, letalidade: 5, vigor: 5 }, equipsToClass: 'GUERREIRO' },
    { name: "Arco Élfico", type: 'bow', icon: '🏹', tier: 1, description: "Feito por elfos habilidosos. Leve e preciso.", statBonuses: { chanceCritica: 20, velocidadeAtaque: 20, danoCritico: 5, letalidade: 7 , vigor: 2}, equipsToClass: 'ARQUEIRO' },
    { name: "Cajado do Mago Aprendiz", type: 'staff', icon: '📍', tier: 1, description: "Um cajado simples para iniciantes na magia.", statBonuses: { danoCritico: 50, letalidade: 8, vigor: 2}, equipsToClass: 'MAGO' },
    { name: "Adaga Sombria", type: 'dagger', icon: '🔪', tier: 1, description: "Ideal para ataques rápidos e furtivos.", statBonuses: { velocidadeAtaque: 25, chanceCritica: 15, chanceEsquiva: 10,letalidade: 8, vigor: 2}, equipsToClass: 'ASSASSINO' },
    { name: "Escudo do Guardião", type: 'shield', icon: '🛡️', tier: 1, description: "Oferece proteção robusta contra ataques.", statBonuses: { resistencia: 40, vigor: 11 }, equipsToClass: 'GUARDIÃO' },
    { 
        name: "Cajado do Necromante", 
        type: 'staff', 
        icon: '☠️', 
        tier: 2, 
        description: "Um cajado imbuído com o poder da vida e da morte.", 
        statBonuses: { 
            vampirismo: 30, 
            vigor: 5, 
            letalidade: 5, 
            curaRecebidaBonus: 20 
        }, 
        equipsToClass: 'NECROMANTE' 
    },
    { 
        name: "Cajado da Natureza",
        type: 'staff',
        icon: '🌿',
        tier: 2,
        description: "Um cajado canalizando a força vital da própria terra.",
        statBonuses: {
            vigor: 4,
            letalidade: 4,
            resistencia: 5,  
            danoCritico: 25,
            chanceCritica: 15,
            curaRecebidaBonus: 15,
        },
        equipsToClass: 'DRUIDA',
    },
    {
        name: "Alaúde Encantado",
        type: 'lute',
        icon: '🪕',
        tier: 2,
        description: "Um alaúde que tece melodias de poder e cura, inspirando aliados e confundindo inimigos.",
        statBonuses: {
            letalidade: 2,
            poderDeCura: 5,
            vigor: 2,
            chanceCritica: 25,
            curaRecebidaBonus: 10,
            danoCritico: 20
        },
        equipsToClass: 'BARDO'
    },
    { 
        name: "Martelo Corrompido", 
        type: 'hammer', 
        icon: '🔆', 
        tier: 3, 
        description: "Um martelo pesado imbuído com poder sombrio que pulsa com energia vital.", 
        statBonuses: { vigor: 5, poderDeCura: 3, danoCritico: 10, curaRecebidaBonus: 20, resistencia: 30 }, 
        equipsToClass: 'PALADINO_CORROMPIDO' 
    },
    { 
        name: "Camisa", 
        type: 'armor', 
        icon: '👕', 
        tier: 1, 
        description: "Uma camisa confortável que, surpreendentemente, melhora seus reflexos e vitalidade.", 
        statBonuses: { vigor: 3, letalidade: 3, danoCritico: 10, poderDeCura: 2 } 
    },
    { 
        name: "Meias", 
        type: 'armor', 
        icon: '🧦', 
        tier: 1, 
        description: "Meias quentinhas que te deixam mais ágil e sortudo.", 
        statBonuses: { letalidade: 4, chanceCritica: 10, velocidadeAtaque: 10, chanceEsquiva: 10 } 
    },
    { 
        name: "Botas Rústicas", 
        type: 'armor', 
        icon: '🥾', 
        tier: 1, 
        description: "Botas de couro resistentes, perfeitas para longas jornadas e para aguentar pancada.", 
        statBonuses: { vigor: 5, poderDeCura: 3, resistencia: 10 } 
    },
    { 
        name: "Luvas", 
        type: 'armor', 
        icon: '🧤', 
        tier: 1, 
        description: "Luvas de couro que firmam o aperto, permitindo golpes mais fortes e precisos.", 
        statBonuses: { letalidade: 7, danoCritico: 10, chanceCritica: 5 } 
    },
    {
        name: "Quimono de Karatê",
        type: 'armor',
        icon: '🥋',
        tier: 3,
        description: "Ganha 4% de letalidade a cada segundo em combate (máx. 10 acúmulos). Ao atingir o máximo, recebe uma cura por segundo (50% da sua letalidade) por 5s, consumindo os acúmulos.",
        statBonuses: {
            vigor: 3,
            letalidade: 3,
            resistencia: 5,
            chanceDeAcerto: 15,
        },
        passiveAbility: {
            id: 'PASSIVE_KARATE_STANCE',
            // This is a custom trigger handled in HeroEntity.update
            trigger: 'ABILITY_CAST', 
            properties: {
                stackingBuff: {
                    id: 'BUFF_KARATE_STANCE_STACK',
                    name: 'Postura de Karatê',
                    icon: '🥋',
                    durationMs: 10000, 
                    maxStacks: 10,
                    effects: {
                        letalidadePercent: 4,
                    }
                },
                healingBuff: {
                    id: 'BUFF_KARATE_HEALING_STANCE',
                    name: 'Postura de Cura',
                    icon: '🥋',
                    durationMs: 5000,
                    effects: {
                        hot: {
                            tickIntervalMs: 1000,
                            healFromCasterLethalityMultiplier: 1.5,
                        }
                    }
                }
            }
        }
    },
    { 
        name: "Insígnia de Prata", 
        type: 'insignia', 
        icon: '🏅', 
        tier: 1, 
        description: "Uma insígnia simples que parece fortalecer o portador.", 
        statBonuses: { vigor: 5, poderDeCura: 5 } 
    },
    {
        name: "Beijo Duplo",
        type: 'insignia',
        icon: '💋',
        tier: 3,
        description: "Sua primeira habilidade utilizada no combate é repetida instantaneamente. Ao ativar, concede +20% de Letalidade por 4 segundos.",
        statBonuses: {
            letalidade: 9,
            chanceCritica: 5,
        },
        passiveAbility: {
            id: 'PASSIVE_BEIJO_DUPLO',
            trigger: 'ABILITY_CAST', // O gatilho é usar uma habilidade
            properties: {
                buff: {
                    id: 'BUFF_BEIJO_DUPLO',
                    name: 'Beijo Duplo',
                    icon: '💋',
                    durationMs: 4000,
                    effects: {
                        letalidadePercent: 20
                    }
                }
            }
        }
    },
    { 
        name: "Colar de Dente de Lobo", 
        type: 'necklace', // type 'necklace' maps to the 'enchantment' slot
        icon: '🦷', 
        tier: 1, 
        description: "Um colar feito de presas, inspira uma ferocidade predatória.", 
        statBonuses: { letalidade: 5, chanceCritica: 25 } 
    },
    {
        name: "Balão Vermelho",
        type: 'necklace', // type 'necklace' maps to the 'enchantment' slot
        icon: '🎈',
        tier: 3,
        description: "Ao receber dano, o balão enche. Com 5 acúmulos, ele estoura, causando dano (150% do Vigor) em área e enfraquecendo inimigos.",
        statBonuses: { vigor: 10 },
        passiveAbility: {
            id: 'PASSIVE_BALAO_VERMELHO',
            trigger: 'DAMAGE_TAKEN',
            properties: {
                maxStacks: 5,
                effects: [
                    {
                        type: 'deal_damage_on_area',
                        properties: {
                            radius: 120,
                            damage: {
                                type: 'vigor_scaling',
                                multiplier: 1.5,
                            }
                        }
                    },
                    {
                        type: 'apply_debuff_on_area',
                        properties: {
                            radius: 120,
                            debuff: {
                                id: 'DEBUFF_BALAO_VERMELHO',
                                name: 'Enfraquecido',
                                icon: '🎈',
                                durationMs: 3000,
                                effects: {
                                    letalidadePercent: -25,
                                    danoCriticoPercent: -25,
                                    chanceCriticaPercent: -25,
                                }
                            }
                        }
                    }
                ]
            }
        }
    },
    {
        name: "Amuleto da Agilidade",
        type: 'necklace',
        icon: '👣',
        tier: 3,
        description: "Ataques básicos concedem acúmulos de Agilidade (+3% Vel. Ataque) por 6s (máx. 6). Com 6 acúmulos, entra em Frenesi por 5s, e seus ataques causam dano em área adicional igual a 1% da vida máxima do alvo.",
        statBonuses: {
            velocidadeAtaque: 10,
            chanceCritica: 10,
            danoCritico: 10,
            letalidade: 3,
            chanceEsquiva: 5,
        },
        passiveAbility: {
            id: 'PASSIVE_AMULETO_AGILIDADE',
            trigger: 'BASIC_ATTACK_LANDED',
            properties: {
                stackingBuff: {
                    id: 'BUFF_AGILIDADE',
                    name: 'Agilidade',
                    icon: '👣',
                    durationMs: 6000,
                    maxStacks: 6,
                    effects: { velocidadeAtaquePercent: 3 }
                },
                frenzyBuff: {
                    id: 'BUFF_FRENESI_AGILIDADE',
                    name: 'Frenesi',
                    icon: '👣',
                    durationMs: 5000,
                    effects: {
                        onHitAoeDamage: {
                            radius: 80,
                            damagePercentTargetMaxHp: 1,
                            lethalityMultiplier: 0.0
                        }
                    }
                }
            }
        }
    },
    {
        name: "Folha de Bordo",
        type: 'necklace',
        icon: '🍁',
        tier: 3,
        description: "Ao curar um aliado, você concede a ele um escudo protetor equivalente a 8% da vida do alvo + 150% do seu poder de cura. Este efeito pode ocorrer apenas uma vez a cada 10 segundos.",
        statBonuses: {
            poderDeCura: 5,
            curaRecebidaBonus: 10,
            danoCritico: 10,
            vigor: 1
        },
        passiveAbility: {
            id: 'PASSIVE_FOLHA_DE_BORDO',
            trigger: 'HEAL_PERFORMED',
            properties: {
                shieldHpPercentTargetMaxHp: 2,
                shieldFromCasterPowerOfHealingMultiplier: 1.5,
                cooldownMs: 10000,
            }
        }
    },
    {
        name: "Cubo de Gelo",
        type: 'necklace',
        icon: '🧊',
        tier: 3,
        description: "Ao usar uma habilidade, seu próximo ataque causa dano adicional com base na sua Resistência e em 200% do seu Vigor, e aplica 'Toque Congelante', reduzindo a velocidade do alvo.",
        statBonuses: {
            vigor: 8,
            resistencia: 10,
        },
        passiveAbility: {
            id: 'PASSIVE_CUBO_DE_GELO',
            trigger: 'ABILITY_CAST',
            properties: {
                buff: {
                    id: 'BUFF_ATAQUE_GELIDO',
                    name: 'Ataque Gélido',
                    icon: '🧊',
                    durationMs: 5000, // 5 seconds to use the next attack
                    effects: {
                        nextAttackEnchanted: {
                            bonusDamageFromResistancePercent: true,
                            bonusDamageFromVigorMultiplier: 0.3,
                            applyDebuff: {
                                id: 'DEBUFF_TOQUE_CONGELANTE',
                                name: 'Toque Congelante',
                                icon: '🧊',
                                durationMs: 4000,
                                effects: {
                                    velocidadeMovimentoPercent: -30,
                                    velocidadeAtaquePercent: -30,
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    {
        name: "Invocar Ciclone",
        type: 'necklace',
        icon: '🌀',
        tier: 3,
        description: "Ao usar uma habilidade, seus próximos 3 ataques básicos são executados com um intervalo de apenas 300ms. Este efeito tem um tempo de recarga de 10 segundos.",
        statBonuses: {
            letalidade: 6,
            chanceCritica: 10,
            danoCritico: 10,
        },
        passiveAbility: {
            id: 'PASSIVE_INVOCAR_CICLONE',
            trigger: 'ABILITY_CAST',
            properties: {
                cooldownMs: 10000,
                buff: {
                    id: 'BUFF_INVOCAR_CICLONE',
                    name: 'Ciclone',
                    icon: '🌀',
                    durationMs: 5000, // Generous duration, removed by stacks
                    maxStacks: 3, // Used as hit counter
                    effects: {
                        overrideAttackIntervalMs: 300,
                    }
                }
            }
        }
    }
];

export const MARKET_ITEMS: MarketItem[] = [
    {
        id: 'caixa_fragmentos',
        name: 'Caixa de Fragmentos',
        icon: '🧰',
        description: 'Contém 10 fragmentos de itens aleatórios do tier 1.',
        contents: {
            fragmentTiers: [1],
            fragmentAmount: 10,
        },
        purchaseOptions: [
            { quantity: 1, cost: 1000, currency: 'coins' },
            { quantity: 10, cost: 9000, currency: 'coins' },
        ]
    },
    {
        id: 'envelope_misterioso',
        name: 'Envelope Misterioso',
        icon: '🧧',
        description: 'Contém 10 fragmentos de itens aleatórios do tier 2.',
        contents: {
            fragmentTiers: [2],
            fragmentAmount: 10,
        },
        purchaseOptions: [
            { quantity: 1, cost: 2000, currency: 'coins' },
            { quantity: 10, cost: 18000, currency: 'coins' },
        ]
    },
    {
        id: 'mochila_especial',
        name: 'Mochila Especial',
        icon: '🎒',
        description: 'Contém 10 fragmentos de itens aleatórios do tier 3 ou 4.',
        contents: {
            fragmentTiers: [3, 4],
            fragmentAmount: 10,
        },
        purchaseOptions: [
            { quantity: 1, cost: 5000, currency: 'coins' },
            { quantity: 10, cost: 45000, currency: 'coins' },
        ]
    },
    {
        id: 'presente_misterioso',
        name: 'Presente Misterioso',
        icon: '🎁',
        description: 'Contém 20 fragmentos de itens aleatórios do tier 4.',
        contents: {
            fragmentTiers: [4],
            fragmentAmount: 20,
        },
        purchaseOptions: [
            { quantity: 1, cost: 100, currency: 'gems' },
            { quantity: 10, cost: 900, currency: 'gems' },
        ]
    }
];