import { Graphics } from 'pixi.js';
import type { VisualEffectsManager } from '../VisualEffectsManager';

export function showSocoSerioHit(vfxManager: VisualEffectsManager, targetX: number, targetY: number): void {
    for (let i = 0; i < 15; i++) { // 15 blood particles
        const particle = new Graphics();
        particle.x = targetX;
        particle.y = targetY;
        const speed = 90 + Math.random() * 150; // pixels per second
        const angle = Math.random() * Math.PI * 2;
        const particleVx = Math.cos(angle) * speed;
        const particleVy = Math.sin(angle) * speed;
        const particleDuration = 0.4 + Math.random() * 0.3; // in seconds
        let particleElapsed = 0;

        vfxManager.addEffect(particle, (deltaSeconds) => {
            particleElapsed += deltaSeconds;
            if (particleElapsed >= particleDuration) return false;

            particle.x += particleVx * deltaSeconds;
            particle.y += particleVy * deltaSeconds;
            
            const pProgress = particleElapsed / particleDuration;
            const pAlpha = 1 - pProgress;
            const pSize = (1 + Math.random() * 2) * (1 - pProgress);

            particle.clear();
            particle.beginFill(0x8B0000, pAlpha * 0.9); // Dark red for blood
            particle.drawCircle(0, 0, pSize);
            particle.endFill();
            return true;
        }, particleDuration * 1000);
    }
}
