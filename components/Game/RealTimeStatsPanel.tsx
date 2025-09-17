
import React, { useState } from 'react';
import type { RealTimeStat, CombatStats } from '../../types';

interface RealTimeStatsPanelProps {
  stats: RealTimeStat[];
  onClose: () => void;
}

const StatRow: React.FC<{ icon: string; label: string; value: string; }> = ({ icon, label, value }) => (
    <div className="flex justify-between items-center text-xs">
        <div className="flex items-center">
            <span className="text-sm mr-1.5">{icon}</span>
            <span className="text-text-muted">{label}</span>
        </div>
        <span className="font-semibold text-text-light">{value}</span>
    </div>
);

const DetailedStatsView: React.FC<{ combatStats: CombatStats }> = ({ combatStats }) => {
    const STATS_TO_DISPLAY: { key: keyof CombatStats; name: string; isPercentage?: boolean }[] = [
        { key: 'letalidade', name: 'Letalidade' },
        { key: 'vigor', name: 'Vigor' },
        { key: 'resistencia', name: 'Resistência' },
        { key: 'velocidadeAtaque', name: 'Vel. Ataque', isPercentage: true },
        { key: 'chanceCritica', name: 'Chance Crítica', isPercentage: true },
        { key: 'danoCritico', name: 'Dano Crítico', isPercentage: true },
        { key: 'chanceEsquiva', name: 'Esquiva', isPercentage: true },
        { key: 'vampirismo', name: 'Vampirismo', isPercentage: true },
        { key: 'poderDeCura', name: 'Poder de Cura' },
        { key: 'curaRecebidaBonus', name: 'Cura Recebida', isPercentage: true },
    ];

    return (
        <div className="mt-2 pt-2 border-t border-brand-card-locked/50 space-y-1">
             <h4 className="text-xs font-bold text-brand-secondary text-center mb-1">Atributos Atuais</h4>
             <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                {STATS_TO_DISPLAY.map(({ key, name, isPercentage }) => {
                    const value = combatStats[key] as number | undefined ?? 0;
                    return (
                        <div key={key} className="flex justify-between text-xs">
                            <span className="text-text-muted">{name}:</span>
                            <span className="font-semibold text-text-light">
                                {value.toFixed(0)}{isPercentage ? '%' : ''}
                            </span>
                        </div>
                    );
                })}
             </div>
        </div>
    );
};


const RealTimeStatsPanel: React.FC<RealTimeStatsPanelProps> = ({ stats, onClose }) => {
    const [expandedHeroId, setExpandedHeroId] = useState<number | null>(null);

    const toggleExpand = (id: number) => {
        setExpandedHeroId(prevId => prevId === id ? null : id);
    };

    const sortedStats = [...stats].sort((a, b) => b.damageDealt - a.damageDealt);

    return (
        <div className="absolute top-4 right-4 bg-brand-surface/90 backdrop-blur-sm p-2 sm:p-3 rounded-lg shadow-xl w-52 sm:w-64 border-2 border-brand-card z-40 pointer-events-auto">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm sm:text-md font-bold text-brand-primary">Estatísticas</h3>
                <button onClick={onClose} className="text-text-muted hover:text-white text-2xl">&times;</button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar pr-2 space-y-3">
                {sortedStats.map(s => {
                    const healthPercentage = s.maxHp > 0 ? (s.currentHp / s.maxHp) * 100 : 0;
                    const shieldPercentage = s.maxHp > 0 ? (s.shieldHp / s.maxHp) * 100 : 0;
                    const isExpanded = expandedHeroId === s.id;
                    return (
                        <div key={s.id} className="bg-brand-background/50 p-2 rounded-md">
                            <div className="flex items-center space-x-2 mb-2">
                                <span className="text-2xl">{s.icon}</span>
                                <div className="flex-grow">
                                    <span className="font-semibold text-sm text-text-light truncate" title={s.name}>{s.name}</span>
                                </div>
                                <button
                                    onClick={() => toggleExpand(s.id)}
                                    className="text-lg bg-brand-card hover:bg-brand-surface px-2 py-0.5 rounded-md text-text-muted hover:text-text-light transition-colors"
                                    aria-expanded={isExpanded}
                                    title={isExpanded ? "Ocultar atributos" : "Mostrar atributos"}
                                >
                                    {isExpanded ? '▲' : '▼'}
                                </button>
                            </div>
                            <div className="relative w-full bg-health-bar-bg rounded-full h-4 mb-2 border border-black/30 overflow-hidden">
                                <div className="absolute top-0 left-0 h-full bg-health-bar-hero rounded-full" style={{ width: `${healthPercentage}%` }} />
                                <div className="absolute top-0 left-0 h-full bg-blue-400/80 rounded-full" style={{ width: `${shieldPercentage}%` }} />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-[10px] font-bold text-white" style={{ textShadow: '1px 1px 1px #000' }}>
                                        {`${Math.ceil(s.currentHp)} / ${s.maxHp}`}
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <StatRow icon="⚔️" label="Dano Total" value={s.damageDealt.toFixed(0)} />
                                <StatRow icon="⏱️" label="DPS" value={s.dps.toFixed(1)} />
                                <StatRow icon="❤️‍🩹" label="Cura Total" value={s.healingDone.toFixed(0)} />
                                <StatRow icon="⏱️" label="HPS" value={s.hps.toFixed(1)} />
                                <StatRow icon="🛡️" label="Escudo Total" value={s.shieldingGranted.toFixed(0)} />
                                <StatRow icon="💥" label="Dano Recebido" value={s.damageTaken.toFixed(0)} />
                            </div>

                            {isExpanded && <DetailedStatsView combatStats={s.combatStats} />}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default RealTimeStatsPanel;