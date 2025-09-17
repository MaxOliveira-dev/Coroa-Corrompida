

import React, { useState, useMemo } from 'react';
import type { PlayerData, Item as ItemType, BaseStats, ClassDataMap, Ability } from '../../types';
import { FORGE_COSTS_BY_TIER } from '../../gameData';

// --- Configuration ---
type ForgeCategory = 'ALL' | 'WEAPON' | 'ARMOR' | 'INSIGNIA' | 'AMULET';

const ITEM_TYPE_TO_CATEGORY: { [key: string]: ForgeCategory } = {
  'sword': 'WEAPON', 'axe': 'WEAPON', 'bow': 'WEAPON', 'staff': 'WEAPON', 'dagger': 'WEAPON', 'shield': 'WEAPON', 'hammer': 'WEAPON', 'lute': 'WEAPON',
  'armor': 'ARMOR',
  'insignia': 'INSIGNIA',
  'necklace': 'AMULET',
};

const CATEGORIES: { key: ForgeCategory; label: string; icon: string }[] = [
    { key: 'ALL', label: 'Todos', icon: '📜' },
    { key: 'WEAPON', label: 'Armas', icon: '⚔️' },
    { key: 'ARMOR', label: 'Equip.', icon: '🛡️' },
    { key: 'INSIGNIA', label: 'Insígnias', icon: '🏅' },
    { key: 'AMULET', label: 'Amuletos', icon: '💎' },
];

const TIER_FILTERS = [
    { tier: 0, label: 'Todos' },
    { tier: 1, label: 'Tier 1' },
    { tier: 2, label: 'Tier 2' },
    { tier: 3, label: 'Tier 3' },
    { tier: 4, label: 'Tier 4' },
];

// --- Helper Components ---
const formatStatName = (key: string): string => {
  const names: Record<string, string> = {
    letalidade: 'Letalidade', vigor: 'Vigor', resistencia: 'Resistência',
    velocidadeAtaque: 'Vel. Ataque', velocidadeMovimento: 'Vel. Movimento',
    chanceCritica: 'Chance Crítica', danoCritico: 'Dano Crítico',
    chanceEsquiva: 'Esquiva', vampirismo: 'Vampirismo',
    poderDeCura: 'Poder de Cura', curaRecebidaBonus: 'Cura Recebida',
  };
  return names[key] || key;
};

const getTierColor = (tier: number | undefined, type: 'text' | 'bg' | 'border' = 'text'): string => {
    if (!tier) return 'text-gray-400';
    return `${type}-item-tier-${tier}`;
};

// --- Main Component Props ---
interface ForgeTabProps {
  playerData: PlayerData;
  forgeableItems: ItemType[];
  onForgeItem: (itemToForge: ItemType) => void;
  onForgeAllItems: (itemsToForge: ItemType[]) => void;
  classes: ClassDataMap;
}

const ForgeTab: React.FC<ForgeTabProps> = ({ playerData, forgeableItems, onForgeItem, onForgeAllItems, classes }) => {
  const [view, setView] = useState<'grid' | 'details'>('grid');
  const [selectedItem, setSelectedItem] = useState<ItemType | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ForgeCategory>('ALL');
  const [selectedTier, setSelectedTier] = useState<number>(0);

  const filteredItems = useMemo(() => {
    return [...forgeableItems]
      .filter(item => {
        if (!item.tier) return false;
        if (selectedCategory !== 'ALL' && ITEM_TYPE_TO_CATEGORY[item.type] !== selectedCategory) return false;
        if (selectedTier !== 0 && item.tier !== selectedTier) return false;
        return true;
      })
      .sort((a, b) => {
          const requiredA = a.tier ? FORGE_COSTS_BY_TIER[a.tier] : Infinity;
          const currentA = playerData.fragments[a.name] || 0;
          const canForgeA = currentA >= requiredA;
          const progressA = requiredA > 0 ? currentA / requiredA : 0;

          const requiredB = b.tier ? FORGE_COSTS_BY_TIER[b.tier] : Infinity;
          const currentB = playerData.fragments[b.name] || 0;
          const canForgeB = currentB >= requiredB;
          const progressB = requiredB > 0 ? currentB / requiredB : 0;

          // 1. Sort by "Can Forge" status first (true comes before false)
          if (canForgeA !== canForgeB) {
            return canForgeA ? -1 : 1;
          }

          // 2. If both have same forge status, sort by progress percentage (descending)
          if (progressA !== progressB) {
            return progressB - progressA;
          }

          // 3. If progress is the same, sort by tier (ascending)
          if ((a.tier || 0) !== (b.tier || 0)) {
            return (a.tier || 0) - (b.tier || 0);
          }

          // 4. Finally, sort by name (alphabetical)
          return a.name.localeCompare(b.name);
      });
  }, [forgeableItems, selectedCategory, selectedTier, playerData.fragments]);
  
  const itemsReadyToForge = useMemo(() => {
    return forgeableItems.filter(item => {
        if (!item.tier) return false;
        const requiredFragments = FORGE_COSTS_BY_TIER[item.tier];
        const currentFragments = playerData.fragments[item.name] || 0;
        return currentFragments >= requiredFragments;
    });
  }, [forgeableItems, playerData.fragments]);

  const handleSelectRecipe = (item: ItemType) => {
    setSelectedItem(item);
    setView('details');
  };
  
  const handleForgeAll = () => {
    if (itemsReadyToForge.length > 0) {
      onForgeAllItems(itemsReadyToForge);
    }
  };

  // --- Render Detail View ---
  const renderDetailView = () => {
    if (!selectedItem) return null;

    const requiredFragments = selectedItem.tier ? FORGE_COSTS_BY_TIER[selectedItem.tier] : Infinity;
    const currentFragments = playerData.fragments[selectedItem.name] || 0;
    const canForge = currentFragments >= requiredFragments;
    const progressPercent = Math.min(100, (currentFragments / requiredFragments) * 100);
    const itemClass = selectedItem.equipsToClass ? classes[selectedItem.equipsToClass as keyof ClassDataMap] : null;

    return (
        <div className="flex flex-col h-full">
            <div className="flex-shrink-0 mb-4">
                <button
                    onClick={() => setView('grid')}
                    className="bg-brand-card hover:bg-brand-surface text-text-light px-3 py-1 rounded-full text-sm font-semibold"
                >
                    &larr; Voltar para a Forja
                </button>
            </div>
            <div className="flex-grow overflow-y-auto custom-scrollbar -mr-2 pr-2 space-y-4">
                {/* Item Header */}
                <div className="flex items-center gap-4 bg-brand-surface p-3 rounded-lg">
                    <div className={`flex-shrink-0 w-20 h-20 rounded-md flex justify-center items-center text-5xl shadow-md ${getTierColor(selectedItem.tier, 'bg')} border-2 ${getTierColor(selectedItem.tier, 'border')} border-opacity-50`}>
                        {selectedItem.icon}
                    </div>
                    <div className="flex-grow">
                        <h3 className={`font-bold text-2xl ${getTierColor(selectedItem.tier)}`}>{selectedItem.name}</h3>
                        <p className="text-md text-brand-secondary">Item Tier {selectedItem.tier}</p>
                    </div>
                </div>

                {/* Description & Stats */}
                <div className="bg-brand-surface p-3 rounded-lg space-y-3">
                    <p className="text-sm text-text-light italic">"{selectedItem.description}"</p>
                    {selectedItem.statBonuses && (
                        <div className="pt-2 border-t border-brand-card-locked space-y-1">
                            <h4 className="font-semibold text-brand-primary mb-1">Atributos</h4>
                            {(Object.entries(selectedItem.statBonuses) as [keyof BaseStats, number][]).map(([key, value]) => (
                                <div key={key} className="flex justify-between text-sm">
                                    <span className="text-brand-secondary">{formatStatName(key)}:</span>
                                    <span className="font-semibold text-green-400">
                                        {value > 0 ? '+' : ''}{value}{['velocidadeAtaque', 'chanceCritica', 'danoCritico', 'chanceEsquiva', 'vampirismo', 'curaRecebidaBonus'].includes(key) ? '%' : ''}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Class & Abilities */}
                {itemClass && (
                    <div className="bg-brand-surface p-3 rounded-lg space-y-2">
                        <h4 className="font-semibold text-brand-primary">Classe: {itemClass.name}</h4>
                        <div className="space-y-3">
                            {itemClass.abilities.map((ability: Ability) => (
                                <div key={ability.id} className="text-xs border-t border-brand-card-locked pt-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">{ability.icon}</span>
                                        <p className="font-semibold text-text-light">{ability.name}</p>
                                    </div>
                                    <p className="text-text-muted mt-1">{ability.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            {/* Forge Section */}
            <div className="flex-shrink-0 mt-auto pt-4 space-y-3">
                <div className="w-full">
                    <p className="text-sm text-text-muted text-center mb-1">Fragmentos Necessários: {currentFragments} / {requiredFragments}</p>
                    <div className="w-full bg-progress-bar-bg rounded-full h-3 overflow-hidden border border-brand-card-locked"><div className={`h-full rounded-full transition-all duration-300 ${getTierColor(selectedItem.tier, 'bg')}`} style={{ width: `${progressPercent}%` }}></div></div>
                </div>
                <button onClick={() => onForgeItem(selectedItem)} disabled={!canForge} className={`w-full py-3 px-4 rounded-lg text-lg font-bold transition-all duration-150 transform ${canForge ? 'bg-brand-accent text-brand-accent-text hover:bg-accent-hover shadow-button-default active:translate-y-1' : 'bg-brand-card-locked text-text-muted cursor-not-allowed'}`}>Forjar Item</button>
            </div>
        </div>
    );
  };

  // --- Render Grid View ---
  const renderGridView = () => (
    <>
      <h2 className="text-xl font-semibold text-text-light mb-4 text-center shrink-0">Forja de Equipamentos</h2>
      
      {/* Filters */}
      <div className="shrink-0 space-y-3 mb-3">
          <div className="flex justify-center gap-2 flex-wrap">
              {CATEGORIES.map(cat => {
                  const isActive = selectedCategory === cat.key;
                  return (<button key={cat.key} onClick={() => setSelectedCategory(cat.key)} className={`px-3 py-1.5 text-xs sm:px-4 sm:text-sm font-semibold rounded-full transition-colors duration-150 focus:outline-none flex items-center gap-1.5 ${isActive ? 'bg-brand-accent text-brand-accent-text shadow-md' : 'bg-brand-surface text-text-muted hover:bg-brand-card hover:text-text-light'}`} > {cat.icon} {cat.label} </button>)
              })}
          </div>
          <div className="flex justify-center gap-2 flex-wrap">
                {TIER_FILTERS.map(tierFilter => {
                    const isActive = selectedTier === tierFilter.tier;
                    const tierColorClass = tierFilter.tier > 0 ? getTierColor(tierFilter.tier) : 'text-brand-primary';
                    return (<button key={tierFilter.tier} onClick={() => setSelectedTier(tierFilter.tier)} className={`px-3 py-1 text-xs sm:text-sm font-semibold rounded-full transition-colors duration-150 focus:outline-none ${isActive ? `bg-brand-accent text-brand-accent-text shadow-md` : 'bg-brand-surface text-text-muted hover:bg-brand-card hover:text-text-light'}`} > <span className={isActive ? '' : tierColorClass}>{tierFilter.label}</span> </button>);
                })}
            </div>
      </div>

      {/* Grid of Recipes */}
      <div id="forge-grid-container" className="flex-grow overflow-y-auto custom-scrollbar -mr-2 pr-2">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredItems.map(item => {
                const requiredFragments = item.tier ? FORGE_COSTS_BY_TIER[item.tier] : Infinity;
                const currentFragments = playerData.fragments[item.name] || 0;
                const canForge = currentFragments >= requiredFragments;
                const progressPercent = requiredFragments > 0 ? Math.min(100, (currentFragments / requiredFragments) * 100) : 0;
                return (
                    <button key={item.name} onClick={() => handleSelectRecipe(item)} className={`relative p-2 rounded-lg text-left transition-all duration-150 border-2 group ${canForge ? 'bg-brand-card border-brand-accent shadow-lg' : 'bg-brand-card-locked border-brand-surface'}`}>
                        <div className={`aspect-square w-full rounded-md flex justify-center items-center text-5xl mb-2 transition-all duration-150 ${getTierColor(item.tier, 'bg')} bg-opacity-30 group-hover:bg-opacity-40`}>
                            {item.icon}
                        </div>
                        <h4 className={`font-semibold text-xs truncate ${getTierColor(item.tier)}`}>{item.name}</h4>
                        <div className="w-full bg-progress-bar-bg rounded-full h-2 my-1 overflow-hidden border border-brand-card-locked/50"><div className={`h-full rounded-full transition-all duration-300 ${getTierColor(item.tier, 'bg')}`} style={{ width: `${progressPercent}%` }}></div></div>
                        <p className="text-xs text-text-muted text-center">{currentFragments}/{requiredFragments}</p>
                        {canForge && (
                           <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-item-notification-bg rounded-full border-2 border-brand-background shadow-md flex items-center justify-center">
                              <span className="text-white text-xl leading-none -mt-0.5">!</span>
                           </div>
                        )}
                    </button>
                )
            })}
        </div>
        {filteredItems.length === 0 && (<p className="text-center text-text-muted text-sm p-8">Nenhuma receita encontrada para estes filtros.</p>)}
      </div>

       {/* Forge All Button */}
       <div className="flex-shrink-0 mt-auto pt-4">
            <button
                id="forge-all-button"
                onClick={handleForgeAll}
                disabled={itemsReadyToForge.length === 0}
                className="w-full py-2 px-4 rounded-lg text-md font-bold transition-all duration-150 transform disabled:opacity-50 disabled:cursor-not-allowed bg-button-success-bg hover:bg-button-success-hover-bg border-b-4 border-green-700 active:border-b-2 text-white"
            >
                Forjar Tudo ({itemsReadyToForge.length})
            </button>
        </div>
    </>
  );

  return (
    <div className="p-4 flex flex-col h-full bg-brand-background">
      {view === 'grid' ? renderGridView() : renderDetailView()}
    </div>
  );
};

export default ForgeTab;
