import { useState, useEffect, useCallback, useRef } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { PLAYER_DATA as defaultPlayerData, DROPPABLE_WEAPONS } from '../gameData';
import type { PlayerData as PlayerDataType, PlayerFragments, PlayerProgress, TutorialProgress, EquippedItems, Item as ItemType, BestiaryEntry } from '../types';

export const usePlayerData = (session: Session | null) => {
    const [playerData, setPlayerData] = useState<PlayerDataType>(defaultPlayerData);
    const [loading, setLoading] = useState(true);
    const saveDataTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    
    // Fetch user data
    useEffect(() => {
        if (session?.user) {
            setLoading(true);
            const fetchProfile = async () => {
                try {
                    const { data, error } = await supabase
                        .from('profiles')
                        .select('username, coins, gems, has_had_first_win, progress, fragments, bestiary, inventory_equipped, inventory_backpack, tutorial_progress')
                        .eq('id', session.user.id)
                        .single();
                    
                    if (error && error.code !== 'PGRST116') { // PGRST116: no rows found
                        throw error;
                    }
                    
                    if (data) {
                        // --- Item Synchronization Logic ---
                        const syncItemData = (item: ItemType | null, allItems: ItemType[]): ItemType | null => {
                            if (!item) return null;
                            const template = allItems.find(t => t.name === item.name);
                            if (!template) {
                                return item;
                            }

                            const syncedItem: ItemType = {
                                name: template.name,
                                type: template.type,
                                icon: template.icon,
                                tier: template.tier,
                                description: template.description,
                                statBonuses: template.statBonuses,
                                equipsToClass: template.equipsToClass,
                                passiveAbility: template.passiveAbility,
                                id: item.id,
                                hasNotification: item.hasNotification,
                            };
                            return syncedItem;
                        };


                        const equippedFromDb: any = (data.inventory_equipped as any) ?? defaultPlayerData.inventory.equipped;
                        const backpackFromDb: (ItemType | null)[] = (data.inventory_backpack as any) ?? defaultPlayerData.inventory.backpack;
                        
                        const syncedEquipped: EquippedItems = {
                            weapon: syncItemData(equippedFromDb.weapon, DROPPABLE_WEAPONS),
                            armor: syncItemData(equippedFromDb.armor, DROPPABLE_WEAPONS),
                            insignia: syncItemData(equippedFromDb.insignia || equippedFromDb.ring, DROPPABLE_WEAPONS),
                            enchantment: syncItemData(equippedFromDb.enchantment, DROPPABLE_WEAPONS),
                        };
                        
                        let syncedBackpack: (ItemType | null)[] = backpackFromDb.map(item => syncItemData(item, DROPPABLE_WEAPONS));

                        // Client-side migration to expand inventory for existing users
                        const TARGET_BACKPACK_SIZE = 90;
                        if (syncedBackpack.length < TARGET_BACKPACK_SIZE) {
                            const diff = TARGET_BACKPACK_SIZE - syncedBackpack.length;
                            syncedBackpack.push(...Array(diff).fill(null));
                        }
                        
                        const progressFromDb = data.progress as PlayerProgress | null;
                        const loadedProgress: PlayerProgress = {
                            FLORESTA: defaultPlayerData.progress.FLORESTA,
                            NEVE: defaultPlayerData.progress.NEVE,
                            DESERTO: defaultPlayerData.progress.DESERTO,
                            PANTANO: defaultPlayerData.progress.PANTANO,
                        };
                        if (progressFromDb) {
                            Object.assign(loadedProgress, progressFromDb);
                        }

                        const tutorialProgressFromDb = data.tutorial_progress as TutorialProgress | null;
                        const loadedTutorialProgress: TutorialProgress = {
                            ...defaultPlayerData.tutorial_progress,
                            ...(tutorialProgressFromDb || {}),
                        };

                        const loadedData: PlayerDataType = {
                            name: data.username || session.user.user_metadata.username || session.user.email?.split('@')[0] || defaultPlayerData.name,
                            coins: data.coins ?? defaultPlayerData.coins,
                            gems: data.gems ?? defaultPlayerData.gems,
                            hasHadFirstWin: data.has_had_first_win ?? defaultPlayerData.hasHadFirstWin,
                            progress: loadedProgress,
                            fragments: data.fragments as PlayerFragments ?? defaultPlayerData.fragments,
                            bestiary: data.bestiary as { [enemyName: string]: BestiaryEntry } ?? defaultPlayerData.bestiary,
                            inventory: {
                                equipped: syncedEquipped,
                                backpack: syncedBackpack,
                            },
                            baseStats: defaultPlayerData.baseStats,
                            tutorial_progress: loadedTutorialProgress,
                        };
                        setPlayerData(loadedData);
                    } else {
                        const newPlayerData = { ...defaultPlayerData, name: session.user.user_metadata.username || session.user.email?.split('@')[0] || 'Novo Herói' };
                        setPlayerData(newPlayerData);
                    }
                } catch (error) {
                    console.error('Error fetching profile:', error);
                    // Error message will be handled by the component that needs to show it
                    setPlayerData(defaultPlayerData); // Fallback to default on error
                } finally {
                    setLoading(false);
                }
            };
            fetchProfile();
        } else {
            setPlayerData(defaultPlayerData);
            setLoading(false);
        }
    }, [session]);
    
    // Save user data when it changes
    const saveData = useCallback(async (currentPlayerData: PlayerDataType) => {
        if (!session || !session.user || currentPlayerData === defaultPlayerData) {
            return;
        }
        try {
            const updates = {
                id: session.user.id,
                username: currentPlayerData.name,
                coins: currentPlayerData.coins,
                gems: currentPlayerData.gems,
                has_had_first_win: currentPlayerData.hasHadFirstWin,
                progress: currentPlayerData.progress,
                fragments: currentPlayerData.fragments,
                bestiary: currentPlayerData.bestiary,
                inventory_equipped: currentPlayerData.inventory.equipped,
                inventory_backpack: currentPlayerData.inventory.backpack,
                tutorial_progress: currentPlayerData.tutorial_progress,
                updated_at: new Date().toISOString(),
            };
            const { error } = await supabase.from('profiles').upsert([updates] as any);
            if (error) throw error;
        } catch (error) {
            console.error('Error saving progress:', error);
            // We can't set an app message here directly anymore. This error needs to be surfaced differently if required.
        }
    }, [session]);
    
    // Debounced save effect
    useEffect(() => {
        if (session && playerData !== defaultPlayerData) {
            if (saveDataTimeoutRef.current) {
                clearTimeout(saveDataTimeoutRef.current);
            }
            saveDataTimeoutRef.current = setTimeout(() => {
                saveData(playerData);
            }, 1500); // 1.5-second debounce delay
        }

        return () => {
            if (saveDataTimeoutRef.current) {
                clearTimeout(saveDataTimeoutRef.current);
            }
        };
    }, [playerData, session, saveData]);

    return { playerData, setPlayerData, loading };
};