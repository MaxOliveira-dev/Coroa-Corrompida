import { Container, Graphics } from 'pixi.js';
import type { VisualEffectsManager } from '../VisualEffectsManager';
import type { CombatCapable } from '../entityInterfaces';

export function showGorillaStomp(vfxManager: VisualEffectsManager, x: number, y: number, radius: number): void {
    // Shockwave effect
    const shockwave = new Graphics();
    shockwave.x = x;
    shockwave.y = y;
    const duration = 500; // ms
    let elapsed = 0;

    vfxManager.addEffect(shockwave, (delta) => {
        elapsed += delta * 1000;
        const progress = elapsed / duration;
        if (progress >= 1) return false;

        const currentRadius = radius * progress;
        const alpha = 1 - progress;
        shockwave.clear();
        const color = 0x8B4513; // SaddleBrown
        shockwave.lineStyle(8 * alpha, color, alpha);
        shockwave.drawCircle(0, 0, currentRadius);
        return true;
    }, duration);

    // Debris particles
    const numParticles = 40;
    for (let i = 0; i < numParticles; i++) {
        const particle = new Graphics();
        const angle = Math.random() * Math.PI * 2;
        const startDist = Math.random() * radius * 0.2;
        particle.x = x + Math.cos(angle) * startDist;
        particle.y = y + Math.sin(angle) * startDist;
        
        const speed = 80 + Math.random() * 120;
        const pVx = Math.cos(angle) * speed;
        const pVy = Math.sin(angle) * speed - 150; // Initial upward burst
        
        const pDuration = 800 + Math.random() * 400;
        let pElapsed = 0;

        vfxManager.addEffect(particle, (deltaSeconds) => {
            pElapsed += deltaSeconds * 1000;
            const progress = pElapsed / pDuration;
            if (progress >= 1) return false;
            
            particle.x += pVx * deltaSeconds;
            particle.y += pVy * deltaSeconds + (300 * deltaSeconds); // Gravity

            const size = (2 + Math.random() * 4) * (1 - progress);
            const alpha = 1 - progress;
            const color = Math.random() > 0.5 ? 0x8B4513 : 0xA0522D; // Brown/Sienna

            particle.clear();
            particle.beginFill(color, alpha);
            particle.drawRect(-size / 2, -size / 2, size, size);
            particle.endFill();
            return true;
        }, pDuration);
    }
}

export function showMachoAlfa(vfxManager: VisualEffectsManager, caster: CombatCapable, durationMs: number): void {
    const container = new Container();
    let elapsed = 0;

    // Red aura
    const aura = new Graphics();
    container.addChild(aura);
    
    const thumpTimings = [200, 700, 1200, 1700];
    let thumpsPlayed = 0;

    vfxManager.addEffect(container, (deltaSeconds) => {
        elapsed += deltaSeconds * 1000;
        if (elapsed >= durationMs || !caster.isAlive) {
            return false;
        }

        container.x = caster.x;
        container.y = caster.y;

        // Aura pulse
        const auraProgress = Math.sin(elapsed / durationMs * Math.PI);
        const auraRadius = caster.size * 0.8 + Math.sin(elapsed * 0.02) * 4;
        aura.clear();
        aura.beginFill(0xFF0000, 0.2 * auraProgress);
        aura.drawCircle(0, 0, auraRadius);
        aura.endFill();

        if (thumpsPlayed < thumpTimings.length && elapsed >= thumpTimings[thumpsPlayed]) {
            thumpsPlayed++;
            
            // Create a small, fast shockwave
            const shockwave = new Graphics();
            const swDuration = 250;
            let swElapsed = 0;
            vfxManager.addEffect(shockwave, (swDelta) => {
                swElapsed += swDelta * 1000;
                const progress = swElapsed / swDuration;
                if (progress >= 1) return false;

                shockwave.x = caster.x;
                shockwave.y = caster.y;
                const currentRadius = caster.size * 0.7 * progress;
                const alpha = 1 - progress;
                shockwave.clear();
                shockwave.lineStyle(3 * alpha, 0x999999, alpha);
                shockwave.drawCircle(0, 0, currentRadius);
                return true;
            }, swDuration);
        }

        return true;
    }, durationMs);
}

export function showScorpionDig(vfxManager: VisualEffectsManager, caster: CombatCapable, durationMs: number): void {
    const colors = [0xC2B280, 0xD2B48C, 0x8B4513]; // Sand, Tan, Brown
    let elapsed = 0;

    vfxManager.addEffect(new Container(), (delta) => {
        elapsed += delta * 1000;
        if (elapsed > durationMs || !caster.isAlive) return false;

        if (Math.random() > 0.5) { // create particles periodically
            const particle = new Graphics();
            const angle = Math.random() * Math.PI * 2;
            const startDist = caster.size * 0.5 * Math.random();
            particle.x = caster.x + Math.cos(angle) * startDist;
            particle.y = caster.y;

            const speed = 50 + Math.random() * 80;
            const pVx = Math.cos(angle) * speed;
            const pVy = -80 - Math.random() * 50; // Upward burst
            const pDuration = 500 + Math.random() * 300;
            let pElapsed = 0;

            vfxManager.addEffect(particle, (pDelta) => {
                pElapsed += pDelta * 1000;
                if (pElapsed > pDuration) return false;

                particle.x += pVx * pDelta;
                particle.y += pVy * pDelta + (200 * pDelta); // Gravity

                const progress = pElapsed / pDuration;
                const size = (1 + Math.random() * 3) * (1 - progress);
                particle.clear();
                particle.beginFill(colors[Math.floor(Math.random() * colors.length)], 1 - progress);
                particle.drawCircle(0, 0, size);
                particle.endFill();
                return true;
            }, pDuration);
        }
        return true;
    }, durationMs);
}

export function showScorpionEmerge(vfxManager: VisualEffectsManager, x: number, y: number, radius: number): void {
    const numParticles = 50;
    const colors = [0xC2B280, 0xD2B48C, 0x8B4513]; // Sand, Tan, Brown
    const duration = 800;

    for (let i = 0; i < numParticles; i++) {
        const particle = new Graphics();
        const angle = Math.random() * Math.PI * 2;
        const travelDist = radius * (0.2 + Math.random() * 0.8);

        let pElapsed = 0;
        const pDuration = duration * (0.6 + Math.random() * 0.4);

        vfxManager.addEffect(particle, (delta) => {
            pElapsed += delta * 1000;
            const progress = pElapsed / pDuration;
            if (progress >= 1) return false;

            const currentDist = travelDist * Math.sin(progress * Math.PI * 0.5); // Ease out
            particle.x = x + Math.cos(angle) * currentDist;
            particle.y = y + Math.sin(angle) * currentDist - (progress * 100) + (progress * progress * 150); // Arc + Gravity
            
            const size = (2 + Math.random() * 4) * (1 - progress);
            particle.clear();
            particle.beginFill(colors[i % colors.length], 1 - progress);
            particle.drawCircle(0, 0, size);
            particle.endFill();
            return true;
        }, pDuration);
    }

    // Add a lingering dust cloud
    const cloud = new Graphics();
    const cloudDuration = 2000;
    let cloudElapsed = 0;
    vfxManager.addEffect(cloud, (delta) => {
        cloudElapsed += delta * 1000;
        const progress = cloudElapsed / cloudDuration;
        if (progress >= 1) return false;

        cloud.x = x;
        cloud.y = y;

        const currentRadius = radius * 1.2 * progress;
        const alpha = Math.sin((1 - progress) * Math.PI) * 0.4; // Fade in and out

        cloud.clear();
        cloud.beginFill(0x967969, alpha); // A dusty brown color
        cloud.drawCircle(0, 0, currentRadius);
        cloud.endFill();
        return true;
    }, cloudDuration);
}

export function showVenomPuddle(vfxManager: VisualEffectsManager, x: number, y: number, radius: number, durationMs: number): void {
    const container = new Container();
    container.x = x;
    container.y = y;

    const puddle = new Graphics();
    container.addChild(puddle);

    const bubbles: { g: Graphics, life: number, maxLife: number, x: number, y: number, size: number }[] = [];
    const numBubbles = 20;

    for (let i = 0; i < numBubbles; i++) {
        const bubbleGraphic = new Graphics();
        const bubble = {
            g: bubbleGraphic,
            life: Math.random() * 500,
            maxLife: 500 + Math.random() * 500,
            x: (Math.random() - 0.5) * radius * 1.8,
            y: (Math.random() - 0.5) * radius * 1.8,
            size: 2 + Math.random() * 4
        };
        bubbles.push(bubble);
        container.addChild(bubbleGraphic);
    }

    let elapsed = 0;
    vfxManager.addEffect(container, (deltaSeconds) => {
        elapsed += deltaSeconds * 1000;
        if (elapsed > durationMs) {
            bubbles.forEach(b => b.g.destroy());
            puddle.destroy();
            return false;
        }

        const globalAlpha = Math.sin((elapsed / durationMs) * Math.PI) * 0.6;

        puddle.clear();
        puddle.beginFill(0x4CAF50, globalAlpha * 0.5); // Green, semi-transparent
        puddle.drawCircle(0, 0, radius);
        puddle.endFill();

        bubbles.forEach(b => {
            b.life += deltaSeconds * 1000;
            if (b.life >= b.maxLife) {
                b.life = 0;
                b.x = (Math.random() - 0.5) * radius * 1.8;
                b.y = (Math.random() - 0.5) * radius * 1.8;
            }

            const progress = b.life / b.maxLife;
            const bubbleAlpha = Math.sin(progress * Math.PI) * globalAlpha * 1.5;
            const bubbleSize = b.size * Math.sin(progress * Math.PI);

            b.g.x = b.x;
            b.g.y = b.y;
            b.g.clear();
            b.g.beginFill(0x8BC34A, bubbleAlpha); // Lighter green
            b.g.drawCircle(0, 0, bubbleSize);
            b.g.endFill();
        });

        return true;
    }, durationMs);
}
