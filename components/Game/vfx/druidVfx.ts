import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { VisualEffectsManager } from '../VisualEffectsManager';
import type { CombatCapable } from '../entityInterfaces';

export function showPoderSelvagem(vfxManager: VisualEffectsManager, target: CombatCapable, durationMs: number): void {
    const container = new Container();
    let elapsed = 0;

    const particles: { g: Graphics, life: number, maxLife: number, angle: number, radius: number, speed: number, size: number }[] = [];
    const numParticles = 10;
    const color = 0x8B4513; // SaddleBrown

    for (let i = 0; i < numParticles; i++) {
        const pGraphics = new Graphics();
        particles.push({
            g: pGraphics,
            life: Math.random() * 1.5,
            maxLife: 1.0 + Math.random() * 0.5,
            angle: Math.random() * Math.PI * 2,
            radius: target.size * 0.5,
            speed: (0.5 + Math.random() * 1.0) * (i % 2 === 0 ? 1 : -1),
            size: 1 + Math.random() * 2,
        });
        container.addChild(pGraphics);
    }

    const emojiStyle = new TextStyle({ fontSize: 20, fill: '#FFFFFF' });
    const pawEmoji = new Text('🐾', emojiStyle);
    pawEmoji.anchor.set(0.5);
    container.addChild(pawEmoji);
    
    vfxManager.addEffect(container, (deltaSeconds) => {
        elapsed += deltaSeconds * 1000;
        if (elapsed >= durationMs || !target.isAlive) {
            particles.forEach(p => p.g.destroy());
            pawEmoji.destroy();
            return false;
        }

        container.x = target.x;
        container.y = target.y - target.size; // Above head

        const globalAlpha = Math.sin((elapsed / durationMs) * Math.PI); // Fade in and out
        pawEmoji.alpha = globalAlpha;
        
        for (const p of particles) {
            p.life += deltaSeconds;
            if (p.life >= p.maxLife) {
                p.life = 0;
            }

            p.angle += p.speed * deltaSeconds;
            
            const currentRadius = p.radius + Math.sin(p.life / p.maxLife * Math.PI) * 10;
            const alpha = Math.sin(p.life / p.maxLife * Math.PI) * globalAlpha;

            p.g.x = Math.cos(p.angle) * currentRadius;
            p.g.y = Math.sin(p.angle) * currentRadius * 0.5;

            p.g.clear();
            p.g.beginFill(color, alpha);
            p.g.drawCircle(0, 0, p.size);
            p.g.endFill();
        }

        return true;
    }, durationMs);
}

export function showBencaoFloresta(vfxManager: VisualEffectsManager, target: CombatCapable, isSynergy: boolean, isCrit: boolean): void {
    const numParticles = isCrit ? 40 : 20;
    const duration = isSynergy ? 1000 : 600; // ms
    const colors = [0x69F0AE, 0x48BB78, 0xFFFFFF]; // Bright Green, Green, White
    const startRadius = target.size * (isSynergy ? 2.0 : 1.5);

    for (let i = 0; i < numParticles; i++) {
        const particle = new Graphics();
        const angle = Math.random() * Math.PI * 2;
        
        let elapsed = 0;
        const pDuration = duration * (0.6 + Math.random() * 0.4);

        vfxManager.addEffect(particle, (deltaSeconds) => {
            elapsed += deltaSeconds * 1000;
            const progress = elapsed / pDuration;
            if (progress >= 1) return false;

            // Spiral inwards
            const currentRadius = startRadius * (1 - progress);
            const currentAngle = angle + progress * 3; // Spiral
            
            particle.x = target.x + Math.cos(currentAngle) * currentRadius;
            particle.y = target.y + Math.sin(currentAngle) * currentRadius * 0.7; // Elliptical

            const alpha = Math.sin(progress * Math.PI); // Fade in and out
            const size = (isCrit ? 3 : 1.5) + Math.random() * (isCrit ? 3 : 2);

            particle.clear();
            particle.beginFill(colors[i % colors.length], alpha);
            particle.drawCircle(0, 0, size * alpha);
            particle.endFill();
            
            return true;
        }, pDuration);
    }
}

export function showEssenciaDaVida(vfxManager: VisualEffectsManager, target: CombatCapable, durationMs: number): void {
    const container = new Container();
    let elapsed = 0;
    const particleInterval = 150; // ms
    let lastParticleTime = -particleInterval;

    vfxManager.addEffect(container, (deltaSeconds) => {
        elapsed += deltaSeconds * 1000;
        if (elapsed >= durationMs || !target.isAlive) {
            return false;
        }

        if (elapsed - lastParticleTime > particleInterval) {
            lastParticleTime = elapsed;
            const styleOptions = {
                fontSize: 16,
                fill: '#48BB78', // Green
                fontWeight: 'bold' as const,
            };
            const style = new TextStyle(styleOptions);
            const leaf = new Text('🍃', style);
            leaf.anchor.set(0.5);
            leaf.x = target.x + (Math.random() - 0.5) * target.size;
            leaf.y = target.y;

            const stage = vfxManager['stage']; // Access private member
            stage.addChild(leaf);

            const pDuration = 1000; // ms
            let pElapsed = 0;
            const floatSpeed = -30; // pixels per second (upwards)
            const rotSpeed = (Math.random() - 0.5) * 2;

            vfxManager.addEffect(leaf, (pDelta) => {
                pElapsed += pDelta * 1000;
                if (pElapsed >= pDuration) {
                    return false;
                }
                const progress = pElapsed / pDuration;
                leaf.y += floatSpeed * pDelta;
                leaf.alpha = 1 - progress;
                leaf.rotation += rotSpeed * pDelta;
                leaf.scale.set(1 - progress * 0.5);
                return true;
            }, pDuration);
        }
        return true;
    }, durationMs);
}

export function showEssenciaDaVidaCritHeal(vfxManager: VisualEffectsManager, target: CombatCapable): void {
    const numParticles = 30;
    const explosionDuration = 600; // ms
    const colors = [0x69F0AE, 0xFFD700, 0xFFFFFF]; // Bright Green, Gold, White

    for (let i = 0; i < numParticles; i++) {
        const particle = new Graphics();
        const angle = Math.random() * Math.PI * 2;
        const travelDist = target.size * (0.8 + Math.random() * 1.5);
        
        let elapsed = 0;
        const pDuration = explosionDuration * (0.7 + Math.random() * 0.3);

        vfxManager.addEffect(particle, (deltaSeconds) => {
            elapsed += deltaSeconds * 1000;
            const progress = elapsed / pDuration;
            if (progress >= 1) return false;

            // Burst outwards then fall
            const currentDist = travelDist * Math.sin(progress * Math.PI * 0.5); // Ease out
            particle.x = target.x + Math.cos(angle) * currentDist;
            particle.y = target.y + Math.sin(angle) * currentDist - (progress * progress * 40); // Gravity effect
            
            const alpha = Math.sin((1 - progress) * Math.PI);
            const size = (1 + Math.random() * 2.5) * alpha;

            particle.clear();
            particle.beginFill(colors[i % colors.length], alpha);
            particle.drawCircle(0, 0, size);
            particle.endFill();

            return true;
        }, pDuration);
    }
}
