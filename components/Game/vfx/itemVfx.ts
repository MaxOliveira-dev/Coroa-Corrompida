import { Container, Graphics } from 'pixi.js';
import type { VisualEffectsManager } from '../VisualEffectsManager';
import type { CombatCapable } from '../entityInterfaces';

export function showFreezingTouch(vfxManager: VisualEffectsManager, target: CombatCapable, durationMs: number): void {
    const container = new Container();
    let elapsed = 0;
    const color = 0xADD8E6; // Light Blue

    const numShards = 8;
    const shards: { g: Graphics, angle: number, radius: number, size: number, rotationSpeed: number }[] = [];

    for (let i = 0; i < numShards; i++) {
        const shardGraphic = new Graphics();
        container.addChild(shardGraphic);
        shards.push({
            g: shardGraphic,
            angle: (i / numShards) * Math.PI * 2,
            radius: target.size * (0.6 + Math.random() * 0.4),
            size: target.size * (0.2 + Math.random() * 0.2),
            rotationSpeed: (Math.random() - 0.5) * 2,
        });
    }

    vfxManager.addEffect(container, (deltaSeconds) => {
        elapsed += deltaSeconds * 1000;
        if (elapsed >= durationMs || !target.isAlive) {
            shards.forEach(s => s.g.destroy());
            return false;
        }

        container.x = target.x;
        container.y = target.y;

        const globalAlpha = Math.sin((elapsed / durationMs) * Math.PI) * 0.7; // Fade in and out

        shards.forEach(shard => {
            shard.g.clear();
            shard.g.beginFill(color, globalAlpha * 0.8);
            shard.g.lineStyle(1, 0xFFFFFF, globalAlpha);
            
            // Draw a pointy shard shape
            shard.g.moveTo(0, -shard.size / 2);
            shard.g.lineTo(shard.size / 4, 0);
            shard.g.lineTo(0, shard.size / 2);
            shard.g.lineTo(-shard.size / 4, 0);
            shard.g.closePath();
            shard.g.endFill();

            shard.angle += shard.rotationSpeed * deltaSeconds;
            shard.g.rotation = shard.angle;

            shard.g.x = Math.cos(shard.angle) * shard.radius;
            shard.g.y = Math.sin(shard.angle) * shard.radius;
        });

        return true;
    }, durationMs);
}

export function showFrenzyGlow(vfxManager: VisualEffectsManager, target: CombatCapable, durationMs: number): void {
    const container = new Container();
    const graphics = new Graphics();
    container.addChild(graphics);
    let elapsed = 0;
    const color = 0xED8936; // Orange

    vfxManager.addEffect(container, (deltaSeconds) => {
        elapsed += deltaSeconds * 1000;
        if (elapsed >= durationMs || !target.isAlive) {
            return false; // Remove effect
        }

        container.x = target.x;
        container.y = target.y;

        // Quick fade in/out at the edges of the duration
        const fadeInDuration = 300;
        const fadeOutDuration = 500;
        const fadeInAlpha = Math.min(1.0, elapsed / fadeInDuration);
        const fadeOutAlpha = Math.min(1.0, (durationMs - elapsed) / fadeOutDuration);
        
        // Pulsating effect
        const pulse = 0.6 + Math.sin(elapsed * 0.008) * 0.4; // Pulsates between 0.2 and 1.0
        const radiusPulse = 1 + Math.sin(elapsed * 0.008) * 0.15;

        const globalAlpha = 0.4 * pulse * fadeInAlpha * fadeOutAlpha;
        const radius = target.size * 0.9 * radiusPulse;

        graphics.clear();
        graphics.beginFill(color, globalAlpha);
        graphics.drawCircle(0, 0, radius);
        graphics.endFill();

        // Add a slightly more intense inner ring
        graphics.beginFill(color, globalAlpha * 1.5);
        graphics.drawCircle(0, 0, radius * 0.6);
        graphics.endFill();

        return true;
    }, durationMs);
}

export function showRedBalloonExplosion(vfxManager: VisualEffectsManager, x: number, y: number, radius: number): void {
    const numParticles = 30;
    const duration = 600; // ms
    const colors = [0xFF4500, 0xDC143C, 0xFF6347]; // OrangeRed, Crimson, Tomato

    // Shockwave
    const shockwave = new Graphics();
    shockwave.x = x;
    shockwave.y = y;
    let elapsed = 0;
    vfxManager.addEffect(shockwave, (delta) => {
        elapsed += delta * 1000;
        const progress = elapsed / (duration * 0.5);
        if (progress >= 1) return false;
        
        const currentRadius = radius * progress;
        const alpha = 1 - progress;
        shockwave.clear();
        shockwave.lineStyle(6 * alpha, colors[1], alpha);
        shockwave.drawCircle(0, 0, currentRadius);
        return true;
    }, duration * 0.5);

    // Particles
    for (let i = 0; i < numParticles; i++) {
        const particle = new Graphics();
        const angle = Math.random() * Math.PI * 2;
        const travelDist = radius * (0.5 + Math.random() * 0.5);
        
        let pElapsed = 0;
        const pDuration = duration * (0.6 + Math.random() * 0.4);
        
        vfxManager.addEffect(particle, (delta) => {
            pElapsed += delta * 1000;
            const progress = pElapsed / pDuration;
            if (progress >= 1) return false;

            const currentDist = travelDist * progress;
            particle.x = x + Math.cos(angle) * currentDist;
            particle.y = y + Math.sin(angle) * currentDist;
            
            const alpha = Math.sin((1 - progress) * Math.PI);
            const size = (2 + Math.random() * 3) * alpha;

            particle.clear();
            particle.beginFill(colors[i % colors.length], alpha);
            particle.drawCircle(0, 0, size);
            particle.endFill();
            return true;
        }, pDuration);
    }
}

export function showInvocarCicloneBuff(vfxManager: VisualEffectsManager, target: CombatCapable, durationMs: number): void {
    const container = new Container();
    let elapsed = 0;
    let lastParticleTime = 0;
    const particleInterval = 40; // ms, for a denser trail

    const afterImages: { g: Graphics, life: number, maxLife: number }[] = [];

    vfxManager.addEffect(container, (deltaSeconds) => {
        elapsed += deltaSeconds * 1000;
        if (elapsed >= durationMs || !target.isAlive) {
            afterImages.forEach(p => { container.removeChild(p.g); p.g.destroy(); });
            return false;
        }

        // Update existing particles
        for (let i = afterImages.length - 1; i >= 0; i--) {
            const p = afterImages[i];
            p.life += deltaSeconds;
            if (p.life >= p.maxLife) {
                container.removeChild(p.g);
                p.g.destroy();
                afterImages.splice(i, 1);
                continue;
            }
            const progress = p.life / p.maxLife;
            p.g.alpha = (1 - progress) * 0.7; // Start semi-transparent
            p.g.scale.set(1 - progress);
        }

        // Create new particles
        if (elapsed - lastParticleTime > particleInterval) {
            lastParticleTime = elapsed;
            const pGraphics = new Graphics();
            pGraphics.x = target.x;
            pGraphics.y = target.y;

            const particle = {
                g: pGraphics,
                life: 0,
                maxLife: 0.3 + Math.random() * 0.2, // seconds
            };
            
            pGraphics.beginFill(0xADD8E6, 1); // Light blue for wind/speed
            pGraphics.drawCircle(0, 0, target.size * 0.4);
            pGraphics.endFill();

            afterImages.push(particle);
            container.addChild(pGraphics);
        }

        return true;
    }, durationMs);
}