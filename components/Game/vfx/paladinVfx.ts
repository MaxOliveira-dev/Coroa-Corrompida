import { Container, Graphics } from 'pixi.js';
import type { VisualEffectsManager } from '../VisualEffectsManager';
import type { CombatCapable } from '../entityInterfaces';

export function showQuebraLuz(vfxManager: VisualEffectsManager, target: CombatCapable): void {
    const flash = new Graphics();
    flash.x = target.x;
    flash.y = target.y;
    const duration = 300; // ms
    let elapsed = 0;
    const color = 0xFFFDE7; // Light yellow

    vfxManager.addEffect(flash, (delta) => {
        elapsed += delta * 1000;
        const progress = elapsed / duration;
        if (progress >= 1) return false;

        const alpha = Math.sin(progress * Math.PI);
        const radius = target.size * progress;

        flash.clear();
        flash.beginFill(color, alpha);
        flash.drawCircle(0, 0, radius);
        flash.endFill();
        return true;
    }, duration);
}

export function showAbsolvicaoCruel(vfxManager: VisualEffectsManager, targets: CombatCapable[], isCrit: boolean): void {
    const duration = isCrit ? 1200 : 800;
    const colors = {
        core: 0x212121,     // Almost black
        glow1: 0x4A235A,    // Dark purple
        glow2: 0x8E44AD,    // Lighter purple
    };

    targets.forEach(target => {
        if (!target.isAlive) return;

        const numParticles = isCrit ? 40 : 25;

        for (let i = 0; i < numParticles; i++) {
            const particle = new Graphics();
            const startRadius = target.size * (1.5 + Math.random());
            const angle = Math.random() * Math.PI * 2;
            
            particle.x = target.x + Math.cos(angle) * startRadius;
            particle.y = target.y + Math.sin(angle) * startRadius;

            let pElapsed = 0;
            const pDuration = duration * (0.6 + Math.random() * 0.4);

            vfxManager.addEffect(particle, (deltaSeconds) => {
                pElapsed += deltaSeconds * 1000;
                const progress = pElapsed / pDuration;
                if (progress >= 1) return false;

                // Move towards the target's center
                particle.x = target.x + Math.cos(angle) * startRadius * (1 - progress);
                particle.y = target.y + Math.sin(angle) * startRadius * (1 - progress);

                const alpha = Math.sin(progress * Math.PI) * 0.9;
                const size = (isCrit ? (2 + Math.random() * 3) : (1 + Math.random() * 2)) * alpha;
                const color = i % 3 === 0 ? colors.glow2 : (i % 2 === 0 ? colors.glow1 : colors.core);

                particle.clear();
                particle.beginFill(color, alpha);
                particle.drawCircle(0, 0, size);
                particle.endFill();

                return true;
            }, pDuration);
        }
    });
}

export function showBencaoCorrompida(vfxManager: VisualEffectsManager, targets: CombatCapable[]): void {
    const lightColumnDuration = 600; // ms
    const particleDuration = 1000; // ms
    const colors = {
        light: 0x8E44AD,    // Purple
        dark: 0x5B2C6F,     // Darker Purple
        shadow: 0x212121,   // Almost black
        heal: 0x50C878,     // Green for healing
    };

    targets.forEach(target => {
        if (!target.isAlive) return;

        // 1. Descending Light Column
        const lightColumn = new Graphics();
        const columnWidth = target.size * 1.5;
        const columnHeight = 500; // A tall column
        let lightElapsed = 0;

        vfxManager.addEffect(lightColumn, (deltaSeconds) => {
            lightElapsed += deltaSeconds * 1000;
            const progress = lightElapsed / lightColumnDuration;
            if (progress >= 1) return false;

            // Position updates if target moves
            lightColumn.x = target.x;
            // The column descends. It starts high and moves down.
            const startY = target.y - columnHeight - 100;
            const endY = target.y - columnHeight / 2;
            lightColumn.y = startY + (endY - startY) * Math.sin(progress * Math.PI / 2); // Ease-out descent

            // Fade in and out
            const alpha = Math.sin(progress * Math.PI) * 0.7;

            lightColumn.clear();
            
            // Layered rectangles for a beam effect
            lightColumn.beginFill(colors.light, alpha * 0.5);
            lightColumn.drawRect(-columnWidth / 2, -columnHeight / 2, columnWidth, columnHeight);
            lightColumn.endFill();
            
            lightColumn.beginFill(colors.dark, alpha * 0.8);
            lightColumn.drawRect(-columnWidth/4, -columnHeight/2, columnWidth/2, columnHeight);
            lightColumn.endFill();

            return true;
        }, lightColumnDuration);

        // 2. Corrupted Impact & Healing Particles
        const numParticles = 40;
        for (let i = 0; i < numParticles; i++) {
            const particle = new Graphics();
            particle.x = target.x + (Math.random() - 0.5) * target.size * 0.5;
            particle.y = target.y;

            let pElapsed = 0;
            const pDuration = particleDuration * (0.7 + Math.random() * 0.3);
            const angle = Math.random() * Math.PI * 2;
            
            // Differentiate between corrupted and healing particles
            const isHealParticle = i % 4 === 0;
            const speed = isHealParticle ? (20 + Math.random() * 20) : (60 + Math.random() * 80);
            
            const pVx = Math.cos(angle) * speed;
            let pVy = Math.sin(angle) * speed;
            if(!isHealParticle) {
                 pVy -= 80; // Initial upward burst for corrupted particles
            } else {
                 pVy = -speed; // Healing particles just float up
            }

            vfxManager.addEffect(particle, (deltaSeconds) => {
                pElapsed += deltaSeconds * 1000;
                const progress = pElapsed / pDuration;
                if (progress >= 1) return false;

                particle.x += pVx * deltaSeconds;
                particle.y += pVy * deltaSeconds;
                
                // Gravity for corrupted particles, float for healing
                if (!isHealParticle) {
                    pVy += 250 * deltaSeconds; 
                }

                const alpha = Math.sin((1 - progress) * Math.PI);
                const size = (isHealParticle ? (1 + Math.random()) : (2 + Math.random() * 2)) * alpha;
                const color = isHealParticle ? colors.heal : (i % 2 === 0 ? colors.dark : colors.shadow);

                particle.clear();
                particle.beginFill(color, alpha);
                if (isHealParticle) {
                    // Draw a plus sign
                    const s = size * 2;
                    particle.drawRect(-s/2, -s/6, s, s/3);
                    particle.drawRect(-s/6, -s/2, s/3, s);
                } else {
                    particle.drawCircle(0, 0, size);
                }
                particle.endFill();

                return true;
            }, pDuration);
        }
    });
}

export function showJulgamentoDistorcido(vfxManager: VisualEffectsManager, target: CombatCapable): void {
    const container = new Container();
    const hammer = new Graphics();
    container.addChild(hammer);

    // --- Draw the Hammer using Pixi Graphics ---
    const scale = 1.8;
    const handleLength = 25 * scale;
    const handleWidth = 4 * scale;
    const headWidth = 20 * scale;
    const headHeight = 14 * scale;
    const spikeHeight = 6 * scale;

    const headColor = 0x8E44AD;
    const handleColor = 0x5B2C6F;
    const spikeColor = 0x4A235A;

    hammer.beginFill(handleColor)
          .drawRoundedRect(-handleWidth / 2, -handleLength, handleWidth, handleLength, 1 * scale)
          .endFill();

    const headY = -handleLength - headHeight / 2;
    hammer.beginFill(headColor)
          .drawRoundedRect(-headWidth / 2, headY, headWidth, headHeight, 2 * scale)
          .endFill();

    hammer.beginFill(spikeColor);
    const topSpikeY = headY;
    hammer.moveTo(-headWidth * 0.2, topSpikeY)
          .lineTo(0, topSpikeY - spikeHeight)
          .lineTo(headWidth * 0.2, topSpikeY)
          .closePath();

    const bottomSpikeY = headY + headHeight;
    hammer.moveTo(-headWidth * 0.2, bottomSpikeY)
          .lineTo(0, bottomSpikeY + spikeHeight)
          .lineTo(headWidth * 0.2, bottomSpikeY)
          .closePath();
    hammer.endFill();

    hammer.pivot.set(0, headY + headHeight / 2);

    // --- Animation Logic ---
    const startY = target.y - 250;
    const endY = target.y;
    const fallDuration = 400;
    const particleDuration = 800;
    const totalDuration = fallDuration + particleDuration;

    let elapsed = 0;
    let impactTriggered = false;
    const particles: { g: Graphics, x: number, y: number, vx: number, vy: number, life: number }[] = [];

    vfxManager.addEffect(container, (deltaSeconds) => {
        elapsed += deltaSeconds * 1000;

        if (elapsed > totalDuration || !target.isAlive) {
            hammer.destroy();
            particles.forEach(p => p.g.destroy());
            return false;
        }
        
        if (elapsed <= fallDuration) {
            const progress = elapsed / fallDuration;
            const easeInQuad = (t: number) => t * t;
            const easedProgress = easeInQuad(progress);

            hammer.x = target.x;
            hammer.y = startY + (endY - startY) * easedProgress;
            hammer.scale.set(1.8 - 1.0 * easedProgress);
            hammer.rotation = (-Math.PI / 12) * easedProgress;
        }

        if (elapsed > fallDuration && !impactTriggered) {
            impactTriggered = true;
            hammer.visible = false;

            const numParticles = 40;
            for (let i = 0; i < numParticles; i++) {
                const pGraphic = new Graphics();
                const angle = Math.random() * Math.PI * 2;
                const speed = 50 + Math.random() * 100;
                const particle = {
                    g: pGraphic,
                    x: target.x,
                    y: target.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - (50 * Math.random()), // Initial burst upwards
                    life: particleDuration,
                };
                
                const color = i % 3 === 0 ? 0x8E44AD : 0x212121; // Purple and Black
                pGraphic.beginFill(color)
                       .drawCircle(0, 0, 1 + Math.random() * 2.5)
                       .endFill();
                
                pGraphic.x = particle.x;
                pGraphic.y = particle.y;
                
                particles.push(particle);
                container.addChild(pGraphic);
            }
        }
        
        if (impactTriggered) {
            particles.forEach(p => {
                p.x += p.vx * deltaSeconds;
                p.y += p.vy * deltaSeconds;
                p.vy += 250 * deltaSeconds; // Gravity
                p.life -= deltaSeconds * 1000;
                p.g.alpha = Math.max(0, p.life / particleDuration);
                p.g.x = p.x;
                p.g.y = p.y;
            });
        }

        return true;
    }, totalDuration);
}
