import React from 'react';

interface PostPvpBattleModalProps {
  playerWon: boolean;
  rankChange: number;
  onReturnToMenuClick: () => void;
  onShowReportClick: () => void;
  onReturnToColiseumClick: () => void;
}

const PostPvpBattleModal: React.FC<PostPvpBattleModalProps> = ({ playerWon, rankChange, onReturnToMenuClick, onShowReportClick, onReturnToColiseumClick }) => {
  const title = playerWon ? "Vitória!" : "Derrota";
  const titleColor = playerWon ? "text-green-400" : "text-red-500";
  const rankChangeText = rankChange >= 0 ? `+${rankChange}` : rankChange;
  const rankChangeColor = rankChange > 0 ? "text-green-400" : (rankChange < 0 ? "text-red-500" : "text-text-muted");

  return (
    <div className="fixed inset-0 bg-modal-overlay-bg flex justify-center items-center z-50 p-4 font-fredoka">
      <div
        className="modal-content bg-modal-content-bg text-text-light p-6 pt-5 border-4 border-border-game rounded-lg shadow-xl w-full max-w-md flex flex-col gap-4 text-center"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pvp-result-title"
      >
        <h2 id="pvp-result-title" className={`text-3xl font-bold ${titleColor}`}>{title}</h2>
        
        <div className="modal-body my-4">
          <p className="text-lg text-text-light">Sua classificação mudou!</p>
          <p className={`text-5xl font-bold my-2 ${rankChangeColor}`}>{rankChangeText}</p>
        </div>
        
        <div className="button-group flex flex-col sm:flex-row justify-center items-center gap-3 pt-4 border-t border-slot-border">
          <button
            onClick={onShowReportClick}
            className="w-full sm:w-auto text-md py-2 px-6 rounded-lg border-2 border-border-game cursor-pointer shadow-button-default active:translate-y-0.5 active:shadow-button-active transition-all duration-100 ease-in-out bg-brand-card hover:bg-brand-surface text-text-light"
          >
            Relatório
          </button>
          <button
            onClick={onReturnToColiseumClick}
            className="w-full sm:w-auto text-md py-2 px-8 rounded-lg border-2 border-border-game cursor-pointer shadow-button-default active:translate-y-0.5 active:shadow-button-active transition-all duration-100 ease-in-out bg-accent hover:bg-accent-hover text-accent-text"
          >
            Voltar ao Coliseu
          </button>
          <button
            onClick={onReturnToMenuClick}
            className="w-full sm:w-auto text-xs py-2 px-4 rounded-lg border-2 border-transparent cursor-pointer transition-all duration-100 ease-in-out text-text-muted hover:text-text-light"
          >
            Menu Principal
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostPvpBattleModal;
