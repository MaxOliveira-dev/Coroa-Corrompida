import React from 'react';
import type { PlayerData, Item as ItemType, EquippedItems, MarketItem as MarketItemType, PurchaseOption, PlayerFragments, TutorialProgress, ClassDataMap, ModalType, ModalPropsMap } from '../types';
import { FORGE_COSTS_BY_TIER, ITEM_SELL_VALUE_BY_TIER, BESTIARY_QUESTS, DROPPABLE_WEAPONS } from '../gameData';

interface UsePlayerActionsProps {
    playerData: PlayerData;
    setPlayerData: React.Dispatch<React.SetStateAction<PlayerData>>;
    openModal: <T extends ModalType>(type: T, props: ModalPropsMap[T]) => void;
    activeTutorialStep: keyof TutorialProgress | null;
    tutorialSubStep: number;
    advanceTutorialSubStep: () => void;
    setActiveTutorialStep: React.Dispatch<React.SetStateAction<keyof TutorialProgress | null>>;
    setTutorialSubStep: React.Dispatch<React.SetStateAction<number>>;
}

const itemTypeToSlotKeyMap: { [itemType: string]: keyof EquippedItems | undefined } = {
    'sword': 'weapon', 'axe': 'weapon', 'bow': 'weapon', 'staff': 'weapon',
    'dagger': 'weapon', 'shield': 'weapon', 'hammer': 'weapon', 'lute': 'weapon',
    'armor': 'armor', 'insignia': 'insignia', 'necklace': 'enchantment',
};

export const usePlayerActions = ({
    playerData, setPlayerData, openModal,
    activeTutorialStep, tutorialSubStep, advanceTutorialSubStep,
    setActiveTutorialStep, setTutorialSubStep
}: UsePlayerActionsProps) => {

    const handleUpdatePlayerName = (newName: string) => {
        setPlayerData(prev => ({ ...prev, name: newName }));
    };

    const handleEquipFromBackpack = (itemIndex: number) => {
        setPlayerData(prev => {
            const backpack = [...prev.inventory.backpack];
            const equipped = { ...prev.inventory.equipped };
            const itemToEquip = backpack[itemIndex];

            if (!itemToEquip) return prev;

            const targetSlotKey = itemTypeToSlotKeyMap[itemToEquip.type];

            if (targetSlotKey) {
                const currentlyEquippedItem = equipped[targetSlotKey];
                equipped[targetSlotKey] = itemToEquip;
                backpack[itemIndex] = currentlyEquippedItem;
            } else {
                openModal('APP_MESSAGE', { message: `Não há slot compatível para ${itemToEquip.name}.` });
                return prev;
            }

            if (equipped[targetSlotKey] && equipped[targetSlotKey]?.hasNotification) {
                equipped[targetSlotKey] = { ...equipped[targetSlotKey]!, hasNotification: false };
            }

            return { ...prev, inventory: { ...prev.inventory, equipped, backpack } };
        });
        if (activeTutorialStep === 'saw_hero_unlock' && tutorialSubStep === 2) {
            advanceTutorialSubStep();
        }
    };

    const handleUnequipItem = (slotKey: keyof EquippedItems) => {
        setPlayerData(prev => {
            const equipped = { ...prev.inventory.equipped };
            const backpack = [...prev.inventory.backpack];
            const itemToUnequip = equipped[slotKey];

            if (!itemToUnequip) return prev;

            const emptySlotIndex = backpack.findIndex(slot => !slot || !slot.name);
            if (emptySlotIndex === -1) {
                openModal('APP_MESSAGE', { message: "Inventário cheio! Não é possível desequipar o item." });
                return prev;
            }

            backpack[emptySlotIndex] = itemToUnequip;
            equipped[slotKey] = null;

            return { ...prev, inventory: { ...prev.inventory, equipped, backpack } };
        });
    };

    const handleForgeItem = (itemToForge: ItemType) => {
        const isCompletingForgeTutorial = activeTutorialStep === 'saw_forge_unlock';

        setPlayerData(prev => {
            if (!itemToForge.tier) return prev;

            const requiredFragments = FORGE_COSTS_BY_TIER[itemToForge.tier];
            const currentFragments = prev.fragments[itemToForge.name] || 0;

            if (currentFragments < requiredFragments) {
                openModal('APP_MESSAGE', { message: `Fragmentos insuficientes para forjar ${itemToForge.name}.` });
                return prev;
            }

            const allPlayerItems = [...Object.values(prev.inventory.equipped), ...prev.inventory.backpack].filter(Boolean) as ItemType[];
            const hasDuplicate = allPlayerItems.some(item => item.name === itemToForge.name);

            if (!hasDuplicate) {
                if (prev.inventory.backpack.findIndex(slot => !slot || !slot.name) === -1) {
                    openModal('APP_MESSAGE', { message: "Inventário cheio! Libere espaço para forjar este novo item." });
                    return prev;
                }
            }

            const newFragments = { ...prev.fragments, [itemToForge.name]: currentFragments - requiredFragments };
            const newTutorialProgress = isCompletingForgeTutorial ? { ...prev.tutorial_progress, saw_forge_unlock: true } : prev.tutorial_progress;

            if (hasDuplicate) {
                const sellValue = ITEM_SELL_VALUE_BY_TIER[itemToForge.tier] || 0;
                openModal('APP_MESSAGE', { message: `Item repetido! ${itemToForge.name} foi vendido por ${sellValue}💰.` });
                return { ...prev, fragments: newFragments, coins: prev.coins + sellValue, tutorial_progress: newTutorialProgress };
            } else {
                const newBackpack = [...prev.inventory.backpack];
                const emptySlotIndex = newBackpack.findIndex(slot => !slot || !slot.name)!;
                newBackpack[emptySlotIndex] = { ...itemToForge, hasNotification: true, id: Date.now() };
                openModal('APP_MESSAGE', { message: `${itemToForge.name} forjado com sucesso!` });
                return { ...prev, fragments: newFragments, inventory: { ...prev.inventory, backpack: newBackpack }, tutorial_progress: newTutorialProgress };
            }
        });

        if (isCompletingForgeTutorial) {
            setActiveTutorialStep('saw_hero_unlock');
            setTutorialSubStep(0);
        }
    };

    const handleForgeAllItems = (itemsToForge: ItemType[]) => {
        const isCompletingForgeTutorial = activeTutorialStep === 'saw_forge_unlock';

        setPlayerData(prev => {
            const allPlayerItemNames = new Set([...Object.values(prev.inventory.equipped), ...prev.inventory.backpack].filter(Boolean).map(i => (i as ItemType).name));
            const nonDuplicateItemsToCreate = itemsToForge.filter(item => !allPlayerItemNames.has(item.name));
            const availableBackpackSlots = prev.inventory.backpack.filter(slot => !slot || !slot.name).length;

            if (nonDuplicateItemsToCreate.length > availableBackpackSlots) {
                openModal('APP_MESSAGE', { message: "Inventário cheio! Libere espaço para forjar todos os novos itens de uma vez." });
                return prev;
            }

            let newFragments = { ...prev.fragments };
            let newCoins = prev.coins;
            let newBackpack = [...prev.inventory.backpack];
            const forgedItems: string[] = [];
            const soldItems: { name: string, value: number }[] = [];

            for (const itemToForge of itemsToForge) {
                if (!itemToForge.tier) continue;
                const required = FORGE_COSTS_BY_TIER[itemToForge.tier];
                const current = newFragments[itemToForge.name] || 0;
                if (current < required) continue;

                newFragments[itemToForge.name] = current - required;
                if (allPlayerItemNames.has(itemToForge.name)) {
                    const sellValue = ITEM_SELL_VALUE_BY_TIER[itemToForge.tier] || 0;
                    newCoins += sellValue;
                    soldItems.push({ name: itemToForge.name, value: sellValue });
                } else {
                    const emptySlotIndex = newBackpack.findIndex(slot => !slot || !slot.name);
                    newBackpack[emptySlotIndex] = { ...itemToForge, hasNotification: true, id: Date.now() };
                    allPlayerItemNames.add(itemToForge.name);
                    forgedItems.push(itemToForge.name);
                }
            }

            let summary = "";
            if (forgedItems.length > 0) summary += `Itens forjados: ${forgedItems.join(', ')}. `;
            if (soldItems.length > 0) summary += `Itens repetidos vendidos por ${soldItems.reduce((acc, i) => acc + i.value, 0)}💰.`;
            openModal('APP_MESSAGE', { message: summary.trim() || "Nenhum item elegível para forjar." });
            
            const newTutorialProgress = isCompletingForgeTutorial ? { ...prev.tutorial_progress, saw_forge_unlock: true } : prev.tutorial_progress;
            return { ...prev, fragments: newFragments, coins: newCoins, inventory: { ...prev.inventory, backpack: newBackpack }, tutorial_progress: newTutorialProgress };
        });

        if (isCompletingForgeTutorial) {
            setActiveTutorialStep('saw_hero_unlock');
            setTutorialSubStep(0);
        }
    };

    const handleClaimBestiaryReward = (enemyName: string) => {
        const isCompletingTutorial = activeTutorialStep === 'saw_bestiary_unlock';

        setPlayerData(prev => {
            const entry = prev.bestiary[enemyName];
            const quest = BESTIARY_QUESTS[enemyName];
            if (!entry || !quest) return prev;

            const tier = quest.tiers[entry.claimedTier];
            if (!tier || entry.kills < tier.required) {
                openModal('APP_MESSAGE', { message: "Missão ainda não concluída!" });
                return prev;
            }

            const newBestiary = { ...prev.bestiary, [enemyName]: { ...entry, claimedTier: entry.claimedTier + 1 } };
            const newCoins = prev.coins + tier.reward;
            openModal('APP_MESSAGE', { message: `Recompensa de ${tier.reward}💰 coletada por caçar ${enemyName}!` });
            
            const newTutorialProgress = isCompletingTutorial ? { ...prev.tutorial_progress, saw_bestiary_unlock: true } : prev.tutorial_progress;
            return { ...prev, coins: newCoins, bestiary: newBestiary, tutorial_progress: newTutorialProgress };
        });

        if (isCompletingTutorial) {
            setActiveTutorialStep(null);
            setTutorialSubStep(0);
        }
    };

    const handlePurchaseMarketItem = (item: MarketItemType, option: PurchaseOption) => {
        const hasEnough = option.currency === 'coins' ? playerData.coins >= option.cost : playerData.gems >= option.cost;
        if (!hasEnough) {
            openModal('APP_MESSAGE', { message: `Recursos insuficientes para comprar ${item.name}.` });
            return;
        }

        const available = DROPPABLE_WEAPONS.filter(w => item.contents.fragmentTiers.includes(w.tier as any));
        if (available.length === 0) {
            openModal('APP_MESSAGE', { message: 'Não há itens elegíveis para esta caixa no momento.' });
            return;
        }

        const generated: PlayerFragments = {};
        const totalFragments = item.contents.fragmentAmount * option.quantity;
        for (let i = 0; i < totalFragments; i++) {
            const randomItem = available[Math.floor(Math.random() * available.length)];
            generated[randomItem.name] = (generated[randomItem.name] || 0) + 1;
        }

        setPlayerData(prev => {
            const newPlayerData = { ...prev };
            if (option.currency === 'coins') newPlayerData.coins -= option.cost;
            else newPlayerData.gems -= option.cost;
            return newPlayerData;
        });
        
        openModal('PURCHASE_LOOT', { loot: generated });
    };

    const originalHandleClaim = (loot: PlayerFragments) => {
        setPlayerData(prev => {
            const newFragments = { ...prev.fragments };
            for (const [itemName, quantity] of Object.entries(loot)) {
                newFragments[itemName] = (newFragments[itemName] || 0) + quantity;
            }
            return { ...prev, fragments: newFragments };
        });
    };

    return {
        handleUpdatePlayerName,
        handleEquipFromBackpack,
        handleUnequipItem,
        handleForgeItem,
        handleForgeAllItems,
        handleClaimBestiaryReward,
        handlePurchaseMarketItem,
        handleClaimPurchaseLoot: originalHandleClaim,
    };
};