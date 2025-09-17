import { Graphics, Container } from 'pixi.js';
import type { VisualEffectsManager } from '../VisualEffectsManager';
import type { CombatCapable } from '../entityInterfaces';

export function showModoOcultoSmoke(vfxManager: VisualEffectsManager, hero: CombatCapable): void {
    const smokeDuration = 800; // ms
    for (let i = 0; i < 15; i++) { // 15 puffs of smoke
        const particle = new Graphics();
        // start in a small radius around the hero
        particle.x = hero.x + (Math.random() - 0.5) * hero.size * 0.8;
        particle.y = hero.y + (Math.random() - 0.5) * hero.size * 0.8;
        
        let elapsed = 0;
        const puffDuration = smokeDuration * (0.6 + Math.random() * 0.4);
        const startSize = 5 + Math.random() * 5;
        const endSize = 20 + Math.random() * 15;
        const driftX = (Math.random() - 0.5) * 30; // pixels per second
        const driftY = -10 - Math.random() * 20; // drift up

        vfxManager.addEffect(particle, (deltaSeconds) => {
            elapsed += deltaSeconds * 1000;
            const progress = elapsed / puffDuration;
            if (progress >= 1) return false;

            particle.x += driftX * deltaSeconds;
            particle.y += driftY * deltaSeconds;

            const currentSize = startSize + (endSize - startSize) * progress;
            const alpha = 0.6 * (1 - progress);

            particle.clear();
            particle.beginFill(0x808080, alpha); // Grey smoke
            particle.drawCircle(0, 0, currentSize);
            particle.endFill();

            return true;
        }, puffDuration);
    }
}

export function showApunhalarTeleport(vfxManager: VisualEffectsManager, fromX: number, fromY: number, toX: number, toY: number): void {
    const totalDist = Math.hypot(toX - fromX, toY - fromY);
    const numParticles = Math.max(10, Math.floor(totalDist / 10));
    const duration = 200; // ms

    for(let i=0; i < numParticles; i++) {
        const particle = new Graphics();
        const pProgress = i / numParticles;
        particle.x = fromX + (toX - fromX) * pProgress;
        particle.y = fromY + (toY - fromY) * pProgress;
        
        let elapsed = 0;
        const pDuration = duration + Math.random() * 100;
        
        vfxManager.addEffect(particle, (delta) => {
            elapsed += delta * 1000;
            const progress = elapsed / pDuration;
            if (progress >= 1) return false;
            
            const size = (3 + Math.random() * 3) * (1-progress);
            const alpha = 0.8 * (1 - progress);
            
            particle.clear();
            particle.beginFill(0x212121, alpha); // Dark smoke/shadow color
            particle.drawCircle(0, 0, size);
            particle.endFill();
            
            return true;
        }, pDuration);
    }
}

export function showAgilidadeExtrema(vfxManager: VisualEffectsManager, caster: CombatCapable, durationMs: number): void {
    let elapsed = 0;
    let lastParticleTime = 0;
    const particleInterval = 50; // ms

    const afterImages: { g: Graphics, life: number, maxLife: number }[] = [];
    const container = new Container();
    vfxManager.addEffect(container, (deltaSeconds) => {
        elapsed += deltaSeconds * 1000;
        if (elapsed >= durationMs || !caster.isAlive) {
            afterImages.forEach(p => p.g.destroy());
            return false;
        }

        for (let i = afterImages.length - 1; i >= 0; i--) {
            const p = afterImages[i];
            p.life += deltaSeconds;
            if (p.life >= p.maxLife) {
                container.removeChild(p.g);
                p.g.destroy();
                afterImages.splice(i, 1);
                continue;
            }
            p.g.alpha = 0.5 * (1 - p.life / p.maxLife);
        }

        if (elapsed - lastParticleTime > particleInterval) {
            lastParticleTime = elapsed;
            const pGraphics = new Graphics();
            pGraphics.x = caster.x;
            pGraphics.y = caster.y;
            pGraphics.beginFill(0xCCCCCC, 1); // Light grey for after-image
            // This is a simplified representation; in a real game, you might draw a semi-transparent version of the character sprite.
            pGraphics.drawCircle(0, 0, caster.size * 0.5); 
            pGraphics.endFill();

            const particle = { g: pGraphics, life: 0, maxLife: 0.3 };
            afterImages.push(particle);
            container.addChild(pGraphics);
        }

        return true;
    }, durationMs);
}
