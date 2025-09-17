import React from 'react';
import { Modal } from './Modal/Modal';
import PurchaseLootModal from './Modal/PurchaseLootModal';
import CombatReportModal from './Modal/CombatReportModal';
import PostBattleLootModal from './Modal/PostBattleLootModal';
import PostPvpBattleModal from './Modal/PostPvpBattleModal';
import DefeatScreen from './Game/DefeatScreen';

import { useGameFlow } from '../hooks/useGameFlow';
import { usePlayerActions } from '../hooks/usePlayerActions';

import type { ModalType, ModalPropsMap, PlayerData, PlayerFragments } from '../types';
import { DROPPABLE_WEAPONS, CLASSES as ALL_CLASSES } from '../gameData';

interface ModalManagerProps {
  modal: { type: ModalType | null; props: any };
  closeModal: () => void;
  // State and setters required by handlers
  playerData: PlayerData;
  setPlayerData: React.Dispatch<React.SetStateAction<PlayerData>>;
  // Direct handlers from other hooks
  returnToMenu: () => void;
  returnToColiseum: () => void; // Added this prop
  startNextLevel: (biomeKey: string) => void;
  openModal: <T extends ModalType>(type: T, props: ModalPropsMap[T]) => void;
}

const ModalManager: React.FC<ModalManagerProps> = ({
  modal,
  closeModal,
  playerData,
  setPlayerData,
  returnToMenu,
  returnToColiseum, // Receive the new function
  startNextLevel,
  openModal,
}) => {
  // FIX: Removed deprecated `setAppMessage` and `setPendingPurchaseLoot` props and passed the required `openModal` prop.
  const { handleClaimPurchaseLoot: originalHandleClaim } = usePlayerActions({
      playerData,
      setPlayerData,
      openModal,
      activeTutorialStep: null,
      tutorialSubStep: 0,
      advanceTutorialSubStep: () => {},
      setActiveTutorialStep: () => {},
      setTutorialSubStep: () => {},
  });

  if (!modal.type) {
    return null;
  }

  const handleClaimAndClose = () => {
      originalHandleClaim(modal.props.loot);
      closeModal();
  }

  switch (modal.type) {
    case 'APP_MESSAGE':
      return (
        <Modal
          title="Notificação"
          onClose={closeModal}
          buttons={[{ text: "OK", onClick: closeModal, styleType: 'default' }]}
        >
          <p className="text-text-light">{modal.props.message}</p>
        </Modal>
      );

    case 'PURCHASE_LOOT':
        return (
            <PurchaseLootModal
              loot={modal.props.loot}
              onClaim={handleClaimAndClose}
              allPossibleItems={DROPPABLE_WEAPONS}
            />
        );

    case 'COMBAT_REPORT':
        return (
            <CombatReportModal
                report={modal.props.report}
                onClose={modal.props.onBack}
                heroesData={ALL_CLASSES}
            />
        );
    
    case 'POST_BATTLE_LOOT': {
        const handleProceed = () => {
            const currentBiomeKey = modal.props.biomeKey;
            startNextLevel(currentBiomeKey);
            closeModal();
        };
        const handleReturn = () => {
            returnToMenu();
            closeModal();
        }
        const handleShowReport = () => {
            openModal('COMBAT_REPORT', { 
                report: modal.props.report,
                onBack: () => openModal('POST_BATTLE_LOOT', modal.props) 
            });
        };
        return (
            <PostBattleLootModal
                loot={modal.props.loot}
                onClose={handleProceed}
                onReturnToMenuClick={handleReturn}
                onShowReportClick={handleShowReport}
                allPossibleItems={DROPPABLE_WEAPONS}
            />
        );
    }
    
    case 'DEFEAT_SCREEN': {
        const handleRetry = () => {
            if(modal.props.biomeKey) {
                startNextLevel(modal.props.biomeKey);
            }
            closeModal();
        }
        const handleMainMenu = () => {
            returnToMenu();
            closeModal();
        }
        const handleShowReport = () => {
            openModal('COMBAT_REPORT', {
                report: modal.props.report,
                onBack: () => openModal('DEFEAT_SCREEN', modal.props)
            });
        };
        return (
            <DefeatScreen
                onRetry={handleRetry}
                onMainMenu={handleMainMenu}
                onShowReport={handleShowReport}
            />
        );
    }

    case 'POST_PVP_BATTLE': {
        const handleReturn = () => {
            returnToMenu();
            closeModal();
        }
        const handleReturnToColiseum = () => {
            returnToColiseum();
            closeModal();
        }
        const handleShowReport = () => {
            openModal('COMBAT_REPORT', {
                report: modal.props.report,
                onBack: () => openModal('POST_PVP_BATTLE', modal.props)
            });
        };
        return (
            <PostPvpBattleModal
                playerWon={modal.props.playerWon}
                rankChange={modal.props.rankChange}
                onReturnToMenuClick={handleReturn}
                onShowReportClick={handleShowReport}
                onReturnToColiseumClick={handleReturnToColiseum}
            />
        );
    }

    default:
      return null;
  }
};

export default ModalManager;
