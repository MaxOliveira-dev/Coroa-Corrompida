import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import type { PlayerData, ClassDataMap, ColiseumRanking, EquippedItems } from '../../types';
import { determineMainHeroClass } from '../../hooks/useGameFlow'; // We'll export this helper

interface ColiseumViewProps {
  playerData: PlayerData;
  userId: string;
  classes: ClassDataMap;
  onStartPvpBattle: (mode: '1v1' | '2v2' | '3v3') => void;
  onBack: () => void;
}

const ColiseumView: React.FC<ColiseumViewProps> = ({
  playerData,
  userId,
  classes,
  onStartPvpBattle,
  onBack,
}) => {
  const [ranking, setRanking] = useState<Omit<ColiseumRanking, 'main_hero_data' | 'player_id'> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchRanking = async () => {
      setLoading(true);
      try {
        let { data, error } = await supabase
          .from('coliseum_rankings')
          .select('player_name, rank_1v1, rank_2v2, rank_3v3')
          .eq('player_id', userId)
          .single();

        if (error && error.code === 'PGRST116') { // No row found, create one
          const defaultRanking = {
            player_id: userId,
            player_name: playerData.name,
            rank_1v1: 1000,
            rank_2v2: 1000,
            rank_3v3: 1000,
          };
          const { error: insertError } = await supabase.from('coliseum_rankings').insert(defaultRanking);
          if (insertError) throw insertError;
          setRanking(defaultRanking);
        } else if (error) {
          throw error;
        } else {
          setRanking(data);
        }
      } catch (error) {
        console.error("Error fetching or creating Coliseum ranking:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRanking();
  }, [userId, playerData.name]);

  const handleSaveHero = async () => {
    setSaving(true);
    try {
      const mainHeroClassKey = determineMainHeroClass(playerData, classes);
      const mainHeroData = {
        classKey: mainHeroClassKey,
        equipment: playerData.inventory.equipped,
      };

      const { error } = await supabase
        .from('coliseum_rankings')
        .upsert({ player_id: userId, player_name: playerData.name, main_hero_data: mainHeroData }, { onConflict: 'player_id' });

      if (error) throw error;
      alert("Herói de defesa salvo com sucesso!");
    } catch (error) {
      console.error("Error saving hero data:", error);
      alert("Falha ao salvar herói de defesa.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 flex flex-col h-full bg-brand-background text-text-light">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <button onClick={onBack} className="bg-brand-card hover:bg-brand-surface px-3 py-1 rounded-full text-sm font-semibold">
          &larr; Voltar
        </button>
        <h2 className="text-xl font-semibold text-center">Coliseu</h2>
        <div className="w-16"></div> {/* Spacer */}
      </div>

      {loading ? (
        <div className="flex-grow flex items-center justify-center">
            <p className="animate-pulse">Carregando rankings...</p>
        </div>
      ) : (
        <>
            <div className="bg-brand-surface p-4 rounded-lg mb-4 text-center">
                <h3 className="font-bold text-lg text-brand-primary mb-2">Seu Ranking</h3>
                <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                        <p className="font-semibold text-brand-secondary">1v1</p>
                        <p className="font-bold text-xl">{ranking?.rank_1v1 ?? 'N/A'}</p>
                    </div>
                    <div>
                        <p className="font-semibold text-brand-secondary">2v2</p>
                        <p className="font-bold text-xl">{ranking?.rank_2v2 ?? 'N/A'}</p>
                    </div>
                    <div>
                        <p className="font-semibold text-brand-secondary">3v3</p>
                        <p className="font-bold text-xl">{ranking?.rank_3v3 ?? 'N/A'}</p>
                    </div>
                </div>
            </div>

            <div className="flex-grow overflow-y-auto custom-scrollbar space-y-3 p-3">
                 <button
                    onClick={() => onStartPvpBattle('1v1')}
                    className="w-full text-left bg-brand-surface p-4 rounded-lg shadow-md border-2 border-brand-card transition-colors duration-200 ease-in-out hover:bg-brand-card hover:border-brand-primary group"
                 >
                    <div className="flex items-center space-x-4 w-full transition-transform duration-200 ease-in-out group-hover:scale-105">
                        <span className="text-5xl">🤺</span>
                        <div className="flex-grow">
                            <h3 className="text-lg font-bold text-text-light">Batalhar 1v1</h3>
                            <p className="text-sm text-brand-secondary">Um duelo de campeões.</p>
                        </div>
                    </div>
                </button>
                 <button
                    onClick={() => onStartPvpBattle('2v2')}
                    className="w-full text-left bg-brand-surface p-4 rounded-lg shadow-md border-2 border-brand-card transition-colors duration-200 ease-in-out hover:bg-brand-card hover:border-brand-primary group"
                 >
                    <div className="flex items-center space-x-4 w-full transition-transform duration-200 ease-in-out group-hover:scale-105">
                        <span className="text-5xl">⚔️</span>
                        <div className="flex-grow">
                            <h3 className="text-lg font-bold text-text-light">Batalhar 2v2</h3>
                            <p className="text-sm text-brand-secondary">Lute com um aliado aleatório.</p>
                        </div>
                    </div>
                </button>
                 <button
                    onClick={() => onStartPvpBattle('3v3')}
                    className="w-full text-left bg-brand-surface p-4 rounded-lg shadow-md border-2 border-brand-card transition-colors duration-200 ease-in-out hover:bg-brand-card hover:border-brand-primary group"
                 >
                    <div className="flex items-center space-x-4 w-full transition-transform duration-200 ease-in-out group-hover:scale-105">
                        <span className="text-5xl">🛡️</span>
                        <div className="flex-grow">
                            <h3 className="text-lg font-bold text-text-light">Batalhar 3v3</h3>
                            <p className="text-sm text-brand-secondary">Batalha de esquadrões completos.</p>
                        </div>
                    </div>
                </button>
            </div>

            <div className="mt-4 pt-4 border-t border-brand-surface">
                 <button
                    onClick={handleSaveHero}
                    disabled={saving}
                    className="w-full py-2.5 px-4 rounded-lg text-md font-bold transition-all duration-150 transform disabled:opacity-50 disabled:cursor-wait bg-brand-accent text-brand-accent-text hover:bg-accent-hover shadow-button-default active:translate-y-1"
                >
                    {saving ? 'Salvando...' : 'Salvar Herói de Defesa'}
                </button>
                <p className="text-xs text-center text-brand-secondary mt-2">
                    Seu herói e equipamentos atuais serão usados como 'fantasma' para outros jogadores enfrentarem.
                </p>
            </div>
        </>
      )}
    </div>
  );
};

export default ColiseumView;