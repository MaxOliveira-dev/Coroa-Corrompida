
import React, { useState } from 'react';
import type { CombatReportData, ClassDataMap, ClassData, HeroCombatStat } from '../../types';
import SimpleTooltip from '../Tooltip/SimpleTooltip';

interface CombatReportModalProps {
    report: CombatReportData;
    onClose: () => void;
    heroesData: ClassDataMap;
}

interface StatBarProps {
    label: string;
    value: number;
    maxValue: number;
    color: string;
    icon: string;
    onShowTooltip: (text: string, event: React.MouseEvent) => void;
    onHideTooltip: () => void;
}

const StatBar: React.FC<StatBarProps> = ({ label, value, maxValue, color, icon, onShowTooltip, onHideTooltip }) => {
    const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
    const formattedValue = value > 1000 ? `${(value / 1000).toFixed(1)}k` : value.toFixed(0);

    return (
        <div className="flex items-center space-x-2 text-sm w-full">
            <span 
                className="w-6 text-center cursor-help"
                onMouseEnter={(e) => onShowTooltip(label, e)}
                onMouseLeave={onHideTooltip}
            >{icon}</span>
            <div className="flex-grow bg-brand-background rounded-full h-5 overflow-hidden border border-brand-card-locked shadow-inner">
                <div
                    className="h-full rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2"
                    style={{ width: `${percentage}%`, backgroundColor: color }}
                >
                </div>
            </div>
            <span className="w-12 text-right font-semibold">{formattedValue}</span>
        </div>
    );
};


const CombatReportModal: React.FC<CombatReportModalProps> = ({ report, onClose, heroesData }) => {
    const { heroStats, enemiesKilled } = report;
    const [simpleTooltipText, setSimpleTooltipText] = useState<string | null>(null);
    const [simpleTooltipVisible, setSimpleTooltipVisible] = useState<boolean>(false);
    const [simpleTooltipPosition, setSimpleTooltipPosition] = useState<{ x: number, y: number }>({ x: 0, y: 0 });

    const handleShowTooltip = (text: string, event: React.MouseEvent) => {
        setSimpleTooltipText(text);
        setSimpleTooltipPosition({ x: event.clientX, y: event.clientY });
        setSimpleTooltipVisible(true);
    };

    const handleHideTooltip = () => {
        setSimpleTooltipVisible(false);
        setSimpleTooltipText(null);
    };

    const deadHeroes = Object.values(heroStats).filter(h => h.isDead);
    const killedEnemiesEntries = Object.entries(enemiesKilled);

    const allStatValues = Object.values(heroStats).flatMap(s => [s.damageDealt, s.healingDone, s.shieldingGranted, s.damageTaken]);
    const maxStatValue = Math.max(1, ...allStatValues);
    
    const sortedHeroStats: [string, HeroCombatStat][] = Object.entries(heroStats).sort(([, a], [, b]) => b.damageDealt - a.damageDealt);

    return (
        <>
            <SimpleTooltip text={simpleTooltipText} visible={simpleTooltipVisible} position={simpleTooltipPosition} />
            <div 
                className="fixed inset-0 bg-modal-overlay-bg flex justify-center items-center z-50 p-4 font-fredoka"
                onClick={onClose} 
                role="dialog"
                aria-modal="true"
                aria-labelledby="combat-report-title"
            >
                <div
                    className="bg-modal-content-bg text-text-light p-5 border-4 border-border-game rounded-lg shadow-xl w-full max-w-2xl flex flex-col gap-4 max-h-[90vh]"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-2">
                        <h2 id="combat-report-title" className="text-2xl text-brand-accent font-semibold">Relatório de Combate</h2>
                        <button 
                            onClick={onClose} 
                            className="text-text-muted hover:text-text-light text-3xl font-bold"
                            aria-label="Fechar relatório"
                        >&times;</button>
                    </div>

                    {/* Main Content */}
                    <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 space-y-6">
                        {/* General Stats */}
                        <div className="bg-brand-surface p-3 rounded-lg">
                            <h3 className="text-lg font-semibold text-brand-primary mb-3">Dados Gerais</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <h4 className="font-medium text-brand-secondary mb-1">💀 Heróis Mortos</h4>
                                    <div className="flex flex-wrap gap-2 items-center min-h-[24px]">
                                        {deadHeroes.length > 0 ? deadHeroes.map(hero => (
                                            <span 
                                                key={hero.heroName} 
                                                className="text-2xl cursor-help" 
                                                onMouseEnter={(e) => handleShowTooltip(hero.heroName, e)}
                                                onMouseLeave={handleHideTooltip}
                                            >
                                                {heroesData[hero.heroName.toUpperCase() as keyof ClassDataMap]?.abilities[0]?.icon || '❓'}
                                            </span>
                                        )) : <span className="text-text-muted">Nenhum</span>}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-medium text-brand-secondary mb-1">🐾 Inimigos Mortos</h4>
                                    <div className="flex flex-wrap gap-x-3 gap-y-1 items-center min-h-[24px]">
                                        {killedEnemiesEntries.length > 0 ? killedEnemiesEntries.map(([name, data]) => (
                                            <div 
                                                key={name} 
                                                className="flex items-center cursor-help" 
                                                onMouseEnter={(e) => handleShowTooltip(name, e)}
                                                onMouseLeave={handleHideTooltip}
                                            >
                                                <span className="text-2xl">{data.emoji}</span>
                                                <span className="text-sm font-semibold ml-1">x{data.count}</span>
                                            </div>
                                        )) : <span className="text-text-muted">Nenhum</span>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Comparative Stats */}
                        <div>
                            <h3 className="text-lg font-semibold text-brand-primary mb-3">Dados Específicos</h3>
                            <div className="space-y-4">
                                {sortedHeroStats.map(([heroName, stats]) => {
                                    const heroClassData = heroesData[heroName.toUpperCase() as keyof ClassDataMap];
                                    return (
                                    <div key={heroName} className="bg-brand-surface p-3 rounded-lg">
                                        <div 
                                            className="flex items-center mb-2 cursor-help"
                                            onMouseEnter={(e) => handleShowTooltip(heroName, e)}
                                            onMouseLeave={handleHideTooltip}
                                        >
                                            <span className="text-3xl mr-2">{heroClassData?.abilities[0]?.icon || '❓'}</span>
                                            <h4 className="font-semibold text-text-light">{heroName}</h4>
                                        </div>
                                        <div className="space-y-1.5">
                                            <StatBar label="Dano Causado" value={stats.damageDealt} maxValue={maxStatValue} color="#ED8936" icon="🗡️" onShowTooltip={handleShowTooltip} onHideTooltip={handleHideTooltip} />
                                            <StatBar label="Cura Realizada" value={stats.healingDone} maxValue={maxStatValue} color="#48BB78" icon="🙌" onShowTooltip={handleShowTooltip} onHideTooltip={handleHideTooltip} />
                                            <StatBar label="Escudo Concedido" value={stats.shieldingGranted} maxValue={maxStatValue} color="#A0AEC0" icon="🛡️" onShowTooltip={handleShowTooltip} onHideTooltip={handleHideTooltip} />
                                            <StatBar label="Dano Recebido" value={stats.damageTaken} maxValue={maxStatValue} color="#E53E3E" icon="💥" onShowTooltip={handleShowTooltip} onHideTooltip={handleHideTooltip} />
                                        </div>
                                    </div>
                                )})}
                            </div>
                        </div>
                    </div>

                    <div className="button-group flex justify-end gap-3 pt-3 border-t border-slot-border">
                        <button
                            onClick={onClose}
                            className="text-md py-2 px-6 rounded-lg border-2 border-border-game cursor-pointer shadow-button-default active:translate-y-0.5 active:shadow-button-active transition-all duration-100 ease-in-out bg-accent hover:bg-accent-hover text-accent-text"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CombatReportModal;
