import React, { useState, useEffect } from 'react';
import type { PlayerData, ClassDataMap, BaseStats, ClassData, Item, EquippedItems, Ability, CombatStats } from '../../types';
import EquipmentSlot from './EquipmentSlot';
import HeroDisplay from './HeroDisplay';
import InventorySection from './InventorySection';
import StatsDetailView from './StatsDetailView'; 
import AbilitiesTab from './AbilitiesTab'; // New import
import { calculateFinalStatsForEntity } from '../Game/entityUtils';

interface HeroTabProps {
  playerData: PlayerData;
  classes: ClassDataMap;
  onUpdatePlayerName: (newName: string) => void; 
  onEquipFromBackpack: (itemIndex: number) => void;
  onUnequipItem: (slotKey: keyof EquippedItems) => void;
  onShowTooltip: (item: Item, event: React.MouseEvent) => void;
  onHideTooltip: () => void;
  onShowSimpleTooltip: (text: string, event: React.MouseEvent) => void; 
  onHideSimpleTooltip: () => void; 
}

export const calculateFinalStats = (playerData: PlayerData, classes: ClassDataMap): CombatStats & { hp: number; damage: number; abilities: Ability[]; weaponName?: string; } => {
    const equippedWeaponItem = playerData.inventory.equipped.weapon;
    
    let heroClassKey: keyof ClassDataMap = 'AVENTUREIRO'; 
    if (equippedWeaponItem && equippedWeaponItem.equipsToClass) {
        heroClassKey = equippedWeaponItem.equipsToClass as keyof ClassDataMap;
    } else if (equippedWeaponItem) {
        const weaponTypeToClassKey: { [key: string]: keyof ClassDataMap | undefined } = {
            'bow': 'ARQUEIRO', 'sword': 'GUERREIRO', 'axe': 'GUERREIRO',
            'staff': 'MAGO', 'dagger': 'ASSASSINO', 'shield': 'GUARDIÃO',
            'hammer': 'PALADINO_CORROMPIDO'
        };
        heroClassKey = weaponTypeToClassKey[equippedWeaponItem.type] || 'AVENTUREIRO';
    }
    
    // Defensively get the class, defaulting to Aventureiro to prevent crashes
    const heroClass = classes[heroClassKey] || classes['AVENTUREIRO'];

    // Use the centralized game engine function for stat calculation
    const combatStats = calculateFinalStatsForEntity(
        playerData.baseStats,
        heroClass,
        undefined, // enemyDetails
        1, // playerLevelScale (not applicable for UI, uses base item stats)
        playerData.inventory.equipped,
        [], // no buffs in menu
        [], // no debuffs in menu
        1  // threatLevel (not applicable for UI, uses base item stats)
    );

    // Explicitly construct the final object to ensure all properties, including colors from combatStats, are present.
    // This prevents issues where properties might be lost due to complex type assertions or spread operator behavior.
    const completeStats = {
        ...combatStats,
        hp: combatStats.maxHp,
        damage: combatStats.effectiveDamage,
        abilities: heroClass.abilities,
        weaponName: equippedWeaponItem?.name,
    };

    return completeStats;
};


const HeroTab: React.FC<HeroTabProps> = ({
  playerData,
  classes,
  onUpdatePlayerName, 
  onEquipFromBackpack,
  onUnequipItem,
  onShowTooltip, 
  onHideTooltip,
  onShowSimpleTooltip, 
  onHideSimpleTooltip  
}) => {
  const { inventory } = playerData; 
  const finalStats = calculateFinalStats(playerData, classes);
  const [activeSubTab, setActiveSubTab] = useState<'equipment' | 'status' | 'abilities'>('equipment');

  type UiSlotType = 'weapon' | 'armor' | 'insignia' | 'enchantment';

  const getEquippedItemForSlot = (uiSlotType: UiSlotType): Item | null => {
    switch (uiSlotType) {
      case 'weapon': return inventory.equipped.weapon;
      case 'armor': return inventory.equipped.armor;
      case 'insignia': return inventory.equipped.insignia;
      case 'enchantment': return inventory.equipped.enchantment;
      default: return null;
    }
  };

  const handleItemUnequip = (uiSlotType: UiSlotType) => {
    const slotKeyToUnequip = uiSlotType as keyof EquippedItems;
    if (inventory.equipped[slotKeyToUnequip]) {
      onUnequipItem(slotKeyToUnequip);
    }
  };

  const getSubTabButtonStyle = (tabName: 'equipment' | 'status' | 'abilities') => {
    const isActive = activeSubTab === tabName;
    return `py-2 px-4 text-sm font-semibold rounded-t-md transition-colors duration-150 focus:outline-none w-1/3
            ${isActive 
              ? 'bg-brand-surface text-brand-accent border-b-2 border-brand-accent' 
              : 'bg-brand-background text-text-muted hover:bg-brand-card hover:text-text-light'
            }`;
  };

  return (
    <div id="hero-content" className="flex flex-col h-full bg-hero-content-bg text-text-light custom-scrollbar overflow-y-auto">
      {/* Character Display Area */}
      <div className="bg-hero-area-bg p-3 md:p-4">
        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-start">
          <div className="flex flex-col gap-2 pt-8"> 
            <EquipmentSlot
              id="equip-weapon"
              slotType="weapon"
              item={getEquippedItemForSlot('weapon')}
              onClick={() => getEquippedItemForSlot('weapon') && handleItemUnequip('weapon')}
              ariaLabel="Arma equipada"
              onShowTooltip={onShowTooltip}
              onHideTooltip={onHideTooltip}
            />
            <EquipmentSlot
              id="equip-insignia"
              slotType="insignia"
              item={getEquippedItemForSlot('insignia')}
              onClick={() => getEquippedItemForSlot('insignia') && handleItemUnequip('insignia')}
              ariaLabel="Insígnia equipada"
              onShowTooltip={onShowTooltip}
              onHideTooltip={onHideTooltip}
            />
          </div>
          <div className="flex flex-col items-center pt-2">
            <HeroDisplay
              heroClassData={finalStats}
            />
            <h3
                id="hero-class-name"
                className="p-1 rounded-md mb-0 text-lg text-gray-700 font-fredoka font-semibold"
            >
                {finalStats.name || "Herói"}
            </h3>
            <div className="flex justify-center items-center space-x-4 mt-2">
              <div className="flex items-center text-red-500">
                <span className="text-lg mr-1">❤️</span>
                <span className="font-bold text-sm text-gray-700">
                  {finalStats.hp > 1000 ? `${(finalStats.hp / 1000).toFixed(2)}K` : finalStats.hp}
                </span>
              </div>
              <div className="flex items-center text-gray-600">
                <span className="text-lg mr-1">⚔️</span>
                <span className="font-bold text-sm text-gray-700">{finalStats.damage}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 pt-8"> 
            <EquipmentSlot
              id="equip-armor"
              slotType="armor"
              item={getEquippedItemForSlot('armor')}
              onClick={() => getEquippedItemForSlot('armor') && handleItemUnequip('armor')}
              ariaLabel="Armadura equipada"
              onShowTooltip={onShowTooltip}
              onHideTooltip={onHideTooltip}
            />
            <EquipmentSlot
              id="equip-enchantment"
              slotType="enchantment"
              item={getEquippedItemForSlot('enchantment')}
              onClick={() => getEquippedItemForSlot('enchantment') && handleItemUnequip('enchantment')}
              ariaLabel="Encantamento equipado"
              onShowTooltip={onShowTooltip}
              onHideTooltip={onHideTooltip}
            />
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation */}
      <div id="hero-tab-nav" className="flex sticky top-0 z-10 bg-brand-background shadow-sm">
        <button
          onClick={() => setActiveSubTab('equipment')}
          className={getSubTabButtonStyle('equipment')}
          aria-pressed={activeSubTab === 'equipment'}
        >
          Equipamento
        </button>
        <button
          onClick={() => setActiveSubTab('status')}
          className={getSubTabButtonStyle('status')}
          aria-pressed={activeSubTab === 'status'}
        >
          Status
        </button>
        <button
          onClick={() => setActiveSubTab('abilities')}
          className={getSubTabButtonStyle('abilities')}
          aria-pressed={activeSubTab === 'abilities'}
        >
          Habilidades
        </button>
      </div>
      
      {/* Content based on active sub-tab */}
      <div className="flex-grow p-3 bg-brand-background overflow-y-auto custom-scrollbar">
        {activeSubTab === 'equipment' && (
          <>
            <InventorySection
              backpack={inventory.backpack}
              onItemClick={onEquipFromBackpack}
              onShowTooltip={onShowTooltip}
              onHideTooltip={onHideTooltip}
            />
          </>
        )}
        {activeSubTab === 'status' && (
          <StatsDetailView 
            baseStats={playerData.baseStats} 
            finalStats={finalStats} 
            onShowSimpleTooltip={onShowSimpleTooltip} 
            onHideSimpleTooltip={onHideSimpleTooltip} 
          />
        )}
        {activeSubTab === 'abilities' && (
          <AbilitiesTab abilities={finalStats.abilities || []} />
        )}
      </div>
    </div>
  );
};

export default HeroTab;