import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { VisualEffectsManager } from '../VisualEffectsManager';
import type { CombatCapable } from '../entityInterfaces';

export function showPowerUp(vfxManager: VisualEffectsManager, caster: CombatCapable, color: string = '#FFD700'): void {
    const numParticles = 30;
    const duration = 1200; // ms

    for (let i = 0; i < numParticles; i++) {
        const particle = new Graphics();
        particle.x = caster.x + (Math.random() - 0.5) * caster.size * 0.5;
        particle.y = caster.y;
        
        const pDuration = duration * (0.5 + Math.random() * 0.5);
        let elapsed = 0;
        const driftX = (Math.random() - 0.5) * 20; // pixels per second
        const floatSpeed = -40 - Math.random() * 30;

        vfxManager.addEffect(particle, (delta) => {
            elapsed += delta * 1000;
            const progress = elapsed / pDuration;
            if (progress >= 1 || !caster.isAlive) return false;

            particle.x += driftX * delta;
            particle.y += floatSpeed * delta;
            
            const alpha = Math.sin((1 - progress) * Math.PI);
            const size = (1 + Math.random() * 2) * alpha;

            particle.clear();
            particle.beginFill(color, alpha);
            particle.drawCircle(0, 0, size);
            particle.endFill();

            return true;
        }, pDuration);
    }
}

export function showStunEffect(vfxManager: VisualEffectsManager, target: CombatCapable, durationMs: number): void {
    const container = new Container();
    const numStars = 3;
    const stars: Text[] = [];
    const orbitRadius = target.size * 0.7;

    for (let i = 0; i < numStars; i++) {
        const star = new Text('💫', new TextStyle({ fontSize: 14 }));
        star.anchor.set(0.5);
        stars.push(star);
        container.addChild(star);
    }
    
    let elapsed = 0;
    vfxManager.addEffect(container, (delta) => {
        elapsed += delta * 1000;
        if (elapsed >= durationMs || !target.isAlive) {
            stars.forEach(s => s.destroy());
            return false;
        }

        container.x = target.x;
        container.y = target.y - target.size * 0.8;

        stars.forEach((star, i) => {
            const angle = (elapsed * 0.005) + (i * (Math.PI * 2 / numStars));
            star.x = Math.cos(angle) * orbitRadius;
            star.y = Math.sin(angle * 2) * orbitRadius * 0.3;
        });

        return true;
    }, durationMs);
}
