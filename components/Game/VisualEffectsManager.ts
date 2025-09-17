import { Container } from 'pixi.js';

export interface ActiveEffect {
    displayObject: Container;
    update: (delta: number) => boolean; // Return true to keep, false to remove
    duration?: number; // Total duration in ms
    elapsed?: number; // Elapsed time in ms
    stop?: () => void; // Optional function to force stop an effect
}

export class VisualEffectsManager {
    private stage: Container;
    private activeEffects: ActiveEffect[] = [];

    constructor(stage: Container) {
        this.stage = stage;
    }

    public update(delta: number): void { // delta is time in ms
        const effectsToRemove: ActiveEffect[] = [];
        for (const effect of this.activeEffects) {
            if (effect.elapsed !== undefined && effect.duration !== undefined) {
                effect.elapsed += delta;
            }
            if (!effect.update(delta / 1000)) { // Pass delta in seconds for update logic
                effectsToRemove.push(effect);
            }
        }

        for (const effect of effectsToRemove) {
            this.stage.removeChild(effect.displayObject);
            effect.displayObject.destroy({ children: true });
            const index = this.activeEffects.indexOf(effect);
            if (index > -1) {
                this.activeEffects.splice(index, 1);
            }
        }
    }

    public addEffect(displayObject: Container, updateLogic: (deltaSeconds: number) => boolean, durationMs?: number): ActiveEffect {
        this.stage.addChild(displayObject);
        const effect: ActiveEffect = { 
            displayObject, 
            update: updateLogic,
            duration: durationMs,
            elapsed: durationMs ? 0 : undefined,
            stop: () => {
                if (effect.duration !== undefined) {
                    effect.elapsed = effect.duration; // Mark for cleanup on next update
                }
            }
        };
        this.activeEffects.push(effect);
        return effect;
    }
}
