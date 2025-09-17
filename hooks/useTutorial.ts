import { useState } from 'react';
import type { PlayerData, TutorialProgress } from '../types';

export const useTutorial = (playerData: PlayerData, setPlayerData: React.Dispatch<React.SetStateAction<PlayerData>>) => {
    const [activeTutorialStep, setActiveTutorialStep] = useState<keyof TutorialProgress | null>(null);
    const [tutorialSubStep, setTutorialSubStep] = useState<number>(0);

    const completeTutorialStep = (step: keyof TutorialProgress) => {
        setPlayerData(prev => ({
            ...prev,
            tutorial_progress: {
                ...prev.tutorial_progress,
                [step]: true
            }
        }));
        setActiveTutorialStep(null);
        setTutorialSubStep(0);
    };

    const advanceTutorialSubStep = () => {
        setTutorialSubStep(prev => prev + 1);
    };
    
    return { 
        activeTutorialStep, 
        tutorialSubStep, 
        completeTutorialStep, 
        advanceTutorialSubStep, 
        setActiveTutorialStep, 
        setTutorialSubStep 
    };
};