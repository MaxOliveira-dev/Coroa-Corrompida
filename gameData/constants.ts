import type { ForgeCostTierMap } from '../types';

export const FORGE_COSTS_BY_TIER: ForgeCostTierMap = {
    1: 10,
    2: 50,
    3: 100,
    4: 300,
};

export const ITEM_SELL_VALUE_BY_TIER: { [tier: number]: number } = {
    1: 10,
    2: 200,
    3: 1000,
    4: 3000,
};

export const ITEM_SCALING_FACTOR_PER_THREAT_LEVEL = 0.05; // 5% por nível de ameaça
export const ENEMY_STAT_SCALING_PER_THREAT_LEVEL = 0.04; // 4% de escala por nível
