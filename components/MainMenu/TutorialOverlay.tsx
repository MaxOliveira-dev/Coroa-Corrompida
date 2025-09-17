

import React, { useState, useEffect, useMemo } from 'react';
import type { TutorialProgress } from '../../types';

interface TutorialStepConfig {
    targetId: string;
    text: string;
    position: 'top' | 'bottom' | 'left' | 'right';
    isCompletingStep?: boolean;
    isModal?: boolean;
    requireInteraction?: boolean;
}

interface TutorialOverlayProps {
    step: keyof TutorialProgress | null;
    subStep: number;
    onNext: () => void;
    onComplete: (step: keyof TutorialProgress) => void;
    bestiaryClaimableCount: number;
    forgeableItemCount: number;
    onSetNav: (nav: 'Batalhar' | 'Forjar' | 'Herói' | 'Mercado') => void;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ step, subStep, onNext, onComplete, bestiaryClaimableCount, forgeableItemCount, onSetNav }) => {
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    const TUTORIAL_CONFIG: { [key in keyof TutorialProgress]?: TutorialStepConfig[] } = useMemo(() => ({
        saw_welcome_and_battle: [
            { targetId: '', text: 'Bem-vindo ao Coroa Corrompida! Siga este guia para aprender os conceitos básicos.', position: 'bottom', isModal: true },
            { targetId: 'nav-Batalhar', text: 'Tudo começa na batalha. Clique aqui para ver os modos de jogo.', position: 'top', requireInteraction: true },
            { targetId: 'gamemode-explorar', text: 'Selecione "Explorar Biomas" para enfrentar inimigos e ganhar recompensas.', position: 'bottom', requireInteraction: true },
            { targetId: 'explore-card-FLORESTA', text: 'Vamos começar na Floresta! Clique em "Explorar" para iniciar a sua primeira batalha.', position: 'bottom', isCompletingStep: true, requireInteraction: true },
        ],
        saw_post_battle_loot: [
            { targetId: '', text: 'Parabéns pela sua primeira vitória! Aqui estão suas recompensas.', position: 'bottom', isModal: true },
            { targetId: 'loot-items-list', text: 'Você ganhou Fragmentos de Itens e Moedas.', position: 'bottom' },
            { targetId: 'loot-report-button', text: 'Para ver as estatísticas da batalha, clique em "Ver Relatório".', position: 'top', requireInteraction: true },
            { targetId: 'combat-report-close-button', text: 'Este relatório mostra seu desempenho. Clique em Fechar para continuar.', position: 'top', requireInteraction: true },
            { targetId: 'loot-return-button', text: 'Ótimo! Agora, para usar seus fragmentos, clique em "Voltar ao Menu".', position: 'top', isCompletingStep: true, requireInteraction: true },
        ],
        saw_forge_unlock: [
            { targetId: '', text: `Você ganhou Fragmentos! Com ${forgeableItemCount} item(ns) pronto(s) para forjar, o menu da Forja foi desbloqueado.`, position: 'bottom', isModal: true },
            { targetId: 'nav-Forjar', text: 'Acesse a Forja para criar novos equipamentos e ficar mais forte.', position: 'top', requireInteraction: true },
            { targetId: 'forge-grid-container', text: 'Aqui estão as receitas que você pode criar. Itens com a barra de progresso cheia estão prontos para serem forjados.', position: 'bottom' },
            { targetId: 'forge-all-button', text: 'Você pode forjar itens individualmente ou todos de uma vez. Vamos forjar tudo!', position: 'top', isCompletingStep: true, requireInteraction: true },
        ],
        saw_hero_unlock: [
            { targetId: '', text: 'Item forjado! O menu do Herói foi desbloqueado para que você possa equipá-lo.', position: 'bottom', isModal: true },
            { targetId: 'nav-Herói', text: 'Acesse o menu do Herói para gerenciar seus equipamentos, status e habilidades.', position: 'top', requireInteraction: true },
            { targetId: 'inv-slot-0', text: 'Este é o seu inventário. Clique em um item para equipá-lo.', position: 'top', requireInteraction: true },
            { targetId: 'equip-weapon', text: 'Este é um slot de equipamento. Itens equipados fortalecem seu herói. Para desequipar um item, basta clicar nele.', position: 'bottom' },
            { targetId: 'hero-tab-nav', text: 'Aqui você pode alternar para ver seus Status detalhados ou suas Habilidades de classe. Explore quando quiser!', position: 'bottom', isCompletingStep: true },
        ],
        saw_bestiary_unlock: [
            { targetId: '', text: `Você completou ${bestiaryClaimableCount} missão(ões) de caça! O Bestiário foi desbloqueado.`, position: 'bottom', isModal: true },
            { targetId: 'nav-Batalhar', text: 'O Bestiário pode ser acessado a partir da tela de Batalha. Clique aqui para começar.', position: 'top', requireInteraction: true },
            { targetId: 'gamemode-explorar', text: "O Bestiário está na tela de Exploração. Selecione 'Explorar Biomas' para continuar.", position: 'bottom', requireInteraction: true },
            { targetId: 'bestiary-button', text: 'Agora, clique no ícone do Bestiário para ver suas missões de caça.', position: 'bottom', requireInteraction: true },
            { targetId: 'claim-reward-Leopardo Ágil', text: 'Missões concluídas podem ser resgatadas aqui. Colete sua recompensa!', position: 'top', isCompletingStep: true, requireInteraction: true },
        ],
        saw_market_unlock: [
            { targetId: '', text: 'Você acumulou moedas suficientes para visitar o Mercado! Ele foi desbloqueado.', position: 'bottom', isModal: true },
            { targetId: 'nav-Mercado', text: 'Acesse o Mercado para comprar caixas de fragmentos e acelerar seu progresso.', position: 'top', requireInteraction: true },
            { targetId: 'market-item-caixa_fragmentos', text: 'Você pode comprar caixas com Moedas 💰 ou Gemas 💎. Experimente quando quiser!', position: 'bottom', isCompletingStep: true },
        ]
    }), [bestiaryClaimableCount, forgeableItemCount]);

    const currentStepConfig = step ? TUTORIAL_CONFIG[step]?.[subStep] : null;

    useEffect(() => {
        if (currentStepConfig && !currentStepConfig.isModal) {
            // A short delay can help ensure the element is rendered and laid out after a tab switch
            const timer = setTimeout(() => {
                const el = document.getElementById(currentStepConfig.targetId);
                if (el) {
                    setTargetRect(el.getBoundingClientRect());
                    el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
                } else {
                    setTargetRect(null);
                }
            }, 50);
            return () => clearTimeout(timer);
        } else {
            setTargetRect(null);
        }
    }, [step, subStep, currentStepConfig]);

    if (!step || !currentStepConfig) {
        return null;
    }
    
    const { text, position, isModal, requireInteraction } = currentStepConfig;

    const handleNext = () => {
        if (currentStepConfig.isCompletingStep) {
            onComplete(step);
        } else {
            onNext();
        }
    };
    
    const tooltipPositionStyle: React.CSSProperties = {};
    const arrowPositionStyle: React.CSSProperties = {};

    if (targetRect && !isModal) {
        const spacing = 15;
        const arrowSize = 10;
        const tooltipCenterX = targetRect.left + targetRect.width / 2;
        const tooltipCenterY = targetRect.top + targetRect.height / 2;
        
        if (position === 'bottom') {
            tooltipPositionStyle.top = `${targetRect.bottom + spacing + arrowSize}px`;
            tooltipPositionStyle.left = `${tooltipCenterX}px`;
            tooltipPositionStyle.transform = 'translateX(-50%)';
            arrowPositionStyle.top = `${targetRect.bottom + spacing}px`;
            arrowPositionStyle.left = `${tooltipCenterX}px`;
            arrowPositionStyle.transform = 'translateX(-50%) rotate(180deg)';
        } else if (position === 'top') {
            tooltipPositionStyle.top = `${targetRect.top - spacing - arrowSize}px`;
            tooltipPositionStyle.left = `${tooltipCenterX}px`;
            tooltipPositionStyle.transform = 'translateX(-50%) translateY(-100%)';
            arrowPositionStyle.top = `${targetRect.top - spacing}px`;
            arrowPositionStyle.left = `${tooltipCenterX}px`;
            arrowPositionStyle.transform = 'translateX(-50%) translateY(-100%)';
        } else if (position === 'left') {
            tooltipPositionStyle.top = `${tooltipCenterY}px`;
            tooltipPositionStyle.left = `${targetRect.left - spacing - arrowSize}px`;
            tooltipPositionStyle.transform = 'translateY(-50%) translateX(-100%)';
            arrowPositionStyle.top = `${tooltipCenterY}px`;
            arrowPositionStyle.left = `${targetRect.left - spacing}px`;
            arrowPositionStyle.transform = 'translateY(-50%) translateX(-100%) rotate(-90deg)';
        } else if (position === 'right') {
            tooltipPositionStyle.top = `${tooltipCenterY}px`;
            tooltipPositionStyle.left = `${targetRect.right + spacing + arrowSize}px`;
            tooltipPositionStyle.transform = 'translateY(-50%)';
            arrowPositionStyle.top = `${tooltipCenterY}px`;
            arrowPositionStyle.left = `${targetRect.right + spacing}px`;
            arrowPositionStyle.transform = 'translateY(-50%) rotate(90deg)';
        }
    }

    const PADDING = 4;
    
    return (
        <div className="fixed inset-0 z-[100] pointer-events-none">
            {/* Overlay Logic */}
            {targetRect ? (
                <>
                    {/* The four overlay divs create a "hole" for clicks */}
                    <div className="fixed bg-black/70 backdrop-blur-sm pointer-events-auto" style={{ left: 0, top: 0, width: '100%', height: `${targetRect.top - PADDING}px` }} />
                    <div className="fixed bg-black/70 backdrop-blur-sm pointer-events-auto" style={{ left: 0, top: `${targetRect.bottom + PADDING}px`, width: '100%', bottom: 0 }} />
                    <div className="fixed bg-black/70 backdrop-blur-sm pointer-events-auto" style={{ left: 0, top: `${targetRect.top - PADDING}px`, width: `${targetRect.left - PADDING}px`, height: `${targetRect.height + PADDING * 2}px` }} />
                    <div className="fixed bg-black/70 backdrop-blur-sm pointer-events-auto" style={{ left: `${targetRect.right + PADDING}px`, top: `${targetRect.top - PADDING}px`, right: 0, height: `${targetRect.height + PADDING * 2}px` }} />
                </>
            ) : (
                 // A single overlay for modals or steps without a target
                 <div className="absolute inset-0 bg-black/70 backdrop-blur-sm pointer-events-auto" />
            )}

            {/* Highlighted Border (only if there is a target) */}
            {targetRect && (
                <div
                    className="fixed rounded-lg transition-all duration-300 border-2 border-brand-accent animate-pulse"
                    style={{
                        left: targetRect.left - PADDING,
                        top: targetRect.top - PADDING,
                        width: targetRect.width + PADDING * 2,
                        height: targetRect.height + PADDING * 2,
                    }}
                />
            )}

            {/* Tooltip Box */}
            <div
                className={`fixed z-[101] p-4 rounded-lg shadow-xl bg-brand-surface border-2 border-brand-accent text-sm text-text-light transition-opacity duration-300 w-64 pointer-events-auto ${isModal ? 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2' : ''}`}
                style={isModal ? {} : tooltipPositionStyle}
                role="tooltip"
            >
                <p className="mb-4">{text}</p>
                {!requireInteraction && (
                    <button onClick={handleNext} className="w-full bg-brand-accent text-brand-accent-text font-bold py-2 px-4 rounded-lg shadow-lg transition-colors hover:bg-accent-hover">
                        {currentStepConfig.isCompletingStep ? 'Entendi!' : 'Próximo'}
                    </button>
                )}
            </div>

            {/* Arrow */}
            {!isModal && targetRect && (
                <div
                    className="fixed z-[101] text-brand-accent text-4xl animate-bounce pointer-events-none"
                    style={arrowPositionStyle}
                >
                    ▲
                </div>
            )}
        </div>
    );
};

export default TutorialOverlay;
