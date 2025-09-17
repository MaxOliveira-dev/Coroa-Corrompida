import type { PlayerData as PlayerDataType } from '../types';

export const PLAYER_DATA: PlayerDataType = {
    name: "Rei Bárbaro",
    coins: 0,
    gems: 0,
    bestiary: {},
    baseStats: 
    {
        letalidade: 10
        ,vigor: 10
        ,resistencia: 5
        ,velocidadeAtaque: 0
        ,velocidadeMovimento: 1.2
        ,chanceCritica: 5
        ,danoCritico: 50,
        chanceEsquiva: 5
        ,vampirismo: 0
        ,chanceDeAcerto: 100
        ,poderDeCura: 10
        ,curaRecebidaBonus: 0
    },
    inventory: {
        equipped: { 
            weapon: null,
            armor: null,
            insignia: null,
            enchantment: null,
        },
        backpack: [ 
            null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null
        ]
    },
    progress: { FLORESTA: 1, NEVE: 1, DESERTO: 1, PANTANO: 1 },
    fragments: {}, 
    hasHadFirstWin: false,
    tutorial_progress: {
        saw_welcome_and_battle: false,
        saw_post_battle_loot: false,
        saw_forge_unlock: false,
        saw_hero_unlock: false,
        saw_bestiary_unlock: false,
        saw_market_unlock: false,
    },
};