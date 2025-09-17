
import React from 'react';

interface DefeatScreenProps {
  onRetry: () => void;
  onMainMenu: () => void;
  onShowReport: () => void;
}

const DefeatScreen: React.FC<DefeatScreenProps> = ({ onRetry, onMainMenu, onShowReport }) => {
  return (
    <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col justify-center items-center z-40 p-4 font-fredoka backdrop-blur-sm">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-red-600 mb-4" style={{ textShadow: '0 0 15px rgba(239, 68, 68, 0.8)' }}>
          Você Perdeu
        </h1>
        <p className="text-lg text-text-muted mb-8">O que deseja fazer?</p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <button
            onClick={onRetry}
            className="w-56 text-lg py-3 px-6 rounded-lg border-2 border-border-game bg-accent text-accent-text cursor-pointer shadow-button-default active:translate-y-1 active:shadow-button-active hover:bg-accent-hover transition-all duration-100 ease-in-out"
          >
            Tentar Novamente
          </button>
          <button
            onClick={onMainMenu}
            className="w-56 text-lg py-3 px-6 rounded-lg border-2 border-border-game bg-brand-card text-text-light cursor-pointer shadow-md active:translate-y-1 hover:bg-brand-surface transition-all duration-100 ease-in-out"
          >
            Menu Principal
          </button>
          <button
            onClick={onShowReport}
            className="w-56 text-lg py-3 px-6 rounded-lg border-2 border-border-game bg-brand-card text-text-light cursor-pointer shadow-md active:translate-y-1 hover:bg-brand-surface transition-all duration-100 ease-in-out"
          >
            Relatório de Batalha
          </button>
        </div>
      </div>
    </div>
  );
};

export default DefeatScreen;
