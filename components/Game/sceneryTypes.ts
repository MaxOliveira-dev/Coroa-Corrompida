


import type { BiomeData } from '../../types';

export interface BaseSceneryElement {
  x: number;
  y: number;
  size: number;
  alpha: number;
  biomeName: keyof BiomeData;
}

export interface TreeSceneryElement extends BaseSceneryElement {
  item: 'tree';
  foliageWidthMultiplier?: number;
  cactus?: {
    numArms: number;
    arm1?: { heightRatio: number; yOffsetRatio: number; };
    arm2?: { heightRatio: number; yOffsetRatio: number; };
  };
}

export interface RockSceneryElement extends BaseSceneryElement {
  item: 'rock';
  rockPoints: { dx: number; dy: number }[];
}

export interface RiverSceneryElement {
    item: 'river';
    path: { x: number, y: number }[];
    width: number;
}

export interface PineTreeSceneryElement extends BaseSceneryElement {
    item: 'pine_tree';
}

export interface PuddleSceneryElement extends BaseSceneryElement {
    item: 'puddle';
    points: { dx: number, dy: number }[];
}

export interface FlowerSceneryElement extends BaseSceneryElement {
    item: 'flower';
    flowerType: 'pink' | 'white';
}

export type SceneryElement = TreeSceneryElement | RockSceneryElement | RiverSceneryElement | PineTreeSceneryElement | PuddleSceneryElement | FlowerSceneryElement;