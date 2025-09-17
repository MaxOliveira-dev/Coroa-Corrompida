import type { ClassDataMap } from '../types';
import {
    ADVENTURER_ABILITIES,
    WARRIOR_ABILITIES,
    MAGE_ABILITIES,
    ARCHER_ABILITIES,
    ASSASSIN_ABILITIES,
    GUARDIAN_ABILITIES,
    NECROMANCER_ABILITIES,
    DRUIDA_ABILITIES,
    CORRUPTED_PALADIN_ABILITIES,
    BARDO_ABILITIES,
} from './abilities';

export const CLASSES: ClassDataMap = {
    AVENTUREIRO: { name: 'Aventureiro', color: '#BDBDBD', bodyColor: '#757575', weapon: 'unarmed', hp: 1460, damage: 10, range: 40, attackSpeed: 1200, velocidadeMovimento: 1.2, abilities: ADVENTURER_ABILITIES },
    GUERREIRO: { name: 'Guerreiro', color: '#BCAAA4', bodyColor: '#4E342E', weapon: 'sword', hp: 1550, damage: 15, range: 40, attackSpeed: 1000, velocidadeMovimento: 1.5, abilities: WARRIOR_ABILITIES },
    MAGO: { name: 'Mago', color: '#90CAF9', bodyColor: '#1565C0', weapon: 'staff', hp: 1340, damage: 20, range: 200, attackSpeed: 1500, velocidadeMovimento: 1.0, abilities: MAGE_ABILITIES },
    ARQUEIRO: { name: 'Arqueiro', color: '#A5D6A7', bodyColor: '#2E7D32', weapon: 'bow', hp: 1370, damage: 12, range: 250, attackSpeed: 900, velocidadeMovimento: 1.2, abilities: ARCHER_ABILITIES },
    ASSASSINO: { name: 'Assassino', color: '#616161', bodyColor: '#212121', weapon: 'dagger', hp: 1310, damage: 25, range: 35, attackSpeed: 700, velocidadeMovimento: 1.8, abilities: ASSASSIN_ABILITIES },
    GUARDIÃO: { name: 'Guardião', color: '#E0E0E0', bodyColor: '#5D4037', weapon: 'shield', hp: 1850, damage: 8, range: 45, attackSpeed: 1200, velocidadeMovimento: 0.8, abilities: GUARDIAN_ABILITIES },
    NECROMANTE: { name: 'Necromante', color: '#A9A9A9', bodyColor: '#4A235A', weapon: 'staff', hp: 1590, damage: 12, range: 150, attackSpeed: 2000, velocidadeMovimento: 1.0, abilities: NECROMANCER_ABILITIES },
    DRUIDA: { name: 'Druida', color: '#689F38', bodyColor: '#33691E', weapon: 'staff', hp: 1580, damage: 10, range: 180, attackSpeed: 1800, velocidadeMovimento: 1.1, abilities: DRUIDA_ABILITIES },
    PALADINO_CORROMPIDO: { name: 'Paladino Corrompido', color: '#8E44AD', bodyColor: '#5B2C6F', weapon: 'hammer', hp: 1700, damage: 10, range: 45, attackSpeed: 1400, velocidadeMovimento: 0.9, abilities: CORRUPTED_PALADIN_ABILITIES },
    BARDO: { name: 'Bardo', color: '#81C784', bodyColor: '#388E3C', weapon: 'lute', hp: 1420, damage: 11, range: 150, attackSpeed: 1100, velocidadeMovimento: 1.7, abilities: BARDO_ABILITIES },
};
