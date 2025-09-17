
import React from 'react';
import { Modal } from './Modal/Modal';
import PurchaseLootModal from './Modal/PurchaseLootModal';
import CombatReportModal from './Modal/CombatReportModal';
import PostBattleLootModal from './Modal/PostBattleLootModal';
import PostPvpBattleModal from './Modal/PostPvpBattleModal';
import DefeatScreen from './Game/DefeatScreen';

import { useGameFlow } from '../hooks/useGameFlow';
import { usePlayerActions } from '../hooks/usePlayerActions';

import type { ModalType, ModalPropsMap, PlayerData, PlayerFragments, TutorialProgress } from '../types';
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
  // Tutorial Props
  activeTutorialStep: keyof TutorialProgress | null;
  tutorialSubStep: number;
  advanceTutorialSubStep: () => void;
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
  activeTutorialStep,
  tutorialSubStep,
  advanceTutorialSubStep,
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

    case 'COMBAT_REPORT': {
        const combatReportProps = modal.props as ModalPropsMap['COMBAT_REPORT'];
        const handleClose = () => {
            // This is the correct place to handle tutorial advancement,
            // as it has the current, not stale, tutorialSubStep.
            if (activeTutorialStep === 'saw_post_battle_loot' && tutorialSubStep === 3) {
                advanceTutorialSubStep();
            }
            // The onBack prop now simply handles navigation back to the previous modal.
            combatReportProps.onBack();
        };

        return (
            <CombatReportModal
                report={combatReportProps.report}
                onClose={handleClose}
                heroesData={ALL_CLASSES}
            />
        );
    }
    
    case 'POST_BATTLE_LOOT': {
        const postBattleLootProps = modal.props as ModalPropsMap['POST_BATTLE_LOOT'];

        const handleProceed = () => {
            const currentBiomeKey = postBattleLootProps.biomeKey;
            startNextLevel(currentBiomeKey);
            closeModal();
        };
        const handleReturn = () => {
            returnToMenu();
            closeModal();
        }
        const handleShowReport = () => {
            if (activeTutorialStep === 'saw_post_battle_loot' && tutorialSubStep === 2) {
              advanceTutorialSubStep();
            }
            openModal('COMBAT_REPORT', { 
                report: postBattleLootProps.report,
                // The onBack callback is now simplified. It only handles re-opening the loot modal.
                // The tutorial advancement logic has been moved to the 'COMBAT_REPORT' case.
                onBack: () => openModal('POST_BATTLE_LOOT', postBattleLootProps)
            });
        };
        return (
            <PostBattleLootModal
                loot={postBattleLootProps.loot}
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