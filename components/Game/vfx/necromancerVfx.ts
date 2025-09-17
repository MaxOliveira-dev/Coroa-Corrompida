import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { VisualEffectsManager } from '../VisualEffectsManager';
import type { CombatCapable } from '../entityInterfaces';

export function showFrenzyBuff(vfxManager: VisualEffectsManager, target: CombatCapable, durationMs: number): void {
    const container = new Container();
    let elapsed = 0;

    const particles: { g: Graphics, life: number, maxLife: number, angle: number, radius: number, speed: number }[] = [];
    const numParticles = 5;
    const color = 0xFFD700; // Gold/Yellow for frenzy

    for (let i = 0; i < numParticles; i++) {
        const pGraphics = new Graphics();
        particles.push({
            g: pGraphics,
            life: Math.random() * 1.0, // start at different points in their life
            maxLife: 0.5 + Math.random() * 0.5, // seconds
            angle: Math.random() * Math.PI * 2,
            radius: target.size * 0.7,
            speed: (3 + Math.random() * 4) * (i % 2 === 0 ? 1 : -1), // Radians per second
        });
        container.addChild(pGraphics);
    }

    vfxManager.addEffect(container, (deltaSeconds) => {
        elapsed += deltaSeconds * 1000;
        if (elapsed >= durationMs || !target.isAlive) {
            particles.forEach(p => p.g.destroy());
            return false;
        }

        container.x = target.x;
        container.y = target.y;

        const globalAlpha = Math.sin((elapsed / durationMs) * Math.PI); // Fade in and out over the duration

        for (const p of particles) {
            p.life += deltaSeconds;
            if (p.life >= p.maxLife) {
                p.life = 0; // reset
            }

            p.angle += p.speed * deltaSeconds;
            
            const alpha = Math.sin(p.life / p.maxLife * Math.PI) * globalAlpha;

            p.g.x = Math.cos(p.angle) * p.radius;
            p.g.y = Math.sin(p.angle) * p.radius;

            p.g.clear();
            p.g.beginFill(color, alpha);
            p.g.drawCircle(0, 0, 1 + Math.random()); // Small sparks
            p.g.endFill();
        }

        return true;
    }, durationMs);
}

export function showEssenceDrain(vfxManager: VisualEffectsManager, startX: number, startY: number, endX: number, endY: number, durationMs: number): void {
    const skullStyle = new TextStyle({ fontSize: 16, fill: '#FFFFFF', stroke: '#000000', strokeThickness: 1 } as any);
    const skull = new Text('💀', skullStyle);
    skull.anchor.set(0.5);
    skull.x = startX;
    skull.y = startY;

    let elapsed = 0;
    let lastParticleTime = 0;

    vfxManager.addEffect(skull, (deltaSeconds) => {
        elapsed += deltaSeconds * 1000;
        const progress = Math.min(1, elapsed / durationMs);

        skull.x = startX + (endX - startX) * progress;
        skull.y = startY + (endY - startY) * progress;

        // Trail particles
        if (elapsed - lastParticleTime > 25) { // every 25ms
            lastParticleTime = elapsed;
            const trailColors = [0x39FF14, 0x000000, 0x228B22];
            for (let i = 0; i < 2; i++) {
                const particle = new Graphics();
                particle.x = skull.x + (Math.random() - 0.5) * 5;
                particle.y = skull.y + (Math.random() - 0.5) * 5;
                
                const pDuration = 300 + Math.random() * 200;
                let pElapsed = 0;

                vfxManager.addEffect(particle, (pDelta) => {
                    pElapsed += pDelta * 1000;
                    const pProgress = pElapsed / pDuration;
                    if (pProgress >= 1) return false;

                    const alpha = 1 - pProgress;
                    const size = (1 + Math.random() * 2) * alpha;

                    particle.clear();
                    particle.beginFill(trailColors[i % trailColors.length], alpha * 0.8);
                    particle.drawCircle(0, 0, size);
                    particle.endFill();
                    
                    return true;
                }, pDuration);
            }
        }

        return progress < 1;
    }, durationMs);
}

export function showAbsorbHeal(vfxManager: VisualEffectsManager, hero: CombatCapable): void {
    const numParticles = 20;
    const absorbDuration = 800; // ms

    for (let i = 0; i < numParticles; i++) {
        const particle = new Graphics();
        const angle = (i / numParticles) * Math.PI * 2;
        const startRadius = hero.size * 1.5;

        let elapsed = 0;
        const pDuration = absorbDuration * (0.6 + Math.random() * 0.4);

        vfxManager.addEffect(particle, (deltaSeconds) => {
            elapsed += deltaSeconds * 1000;
            const progress = elapsed / pDuration;
            if (progress >= 1) return false;

            const currentRadius = startRadius * (1 - progress);
            const currentAngle = angle + progress * 2; // Spiral inwards
            
            particle.x = hero.x + Math.cos(currentAngle) * currentRadius;
            particle.y = hero.y + Math.sin(currentAngle) * currentRadius * 0.5; // Elliptical

            const alpha = Math.sin(progress * Math.PI) * 0.7; // Fade in and out
            const size = 1 + Math.random() * 3;

            particle.clear();
            particle.beginFill(0x1a1a1a, alpha); // Dark grey/black
            particle.drawCircle(0, 0, size);
            particle.endFill();
            
            return true;
        }, pDuration);
    }
}

export function showSummoningEffect(vfxManager: VisualEffectsManager, x: number, y: number): void {
    const duration = 1000; // ms
    const numParticles = 60;
    const colors = [0x39FF14, 0x000000, 0x228B22]; // Neon Green, Black, Forest Green
    const maxRadius = 60; // The vortex starts from this radius

    for (let i = 0; i < numParticles; i++) {
        const particle = new Graphics();
        let elapsed = 0;
        const pDuration = duration * (0.7 + Math.random() * 0.3);
        const startAngle = Math.random() * Math.PI * 2;
        const rotationSpeed = (Math.random() - 0.5) * 10; // Radians per second, for spiraling
        const startSize = 2 + Math.random() * 3;

        vfxManager.addEffect(particle, (deltaSeconds) => {
            elapsed += deltaSeconds * 1000;
            const progress = elapsed / pDuration;
            if (progress >= 1) return false;

            // Move from maxRadius to 0
            const currentRadius = maxRadius * (1 - progress);
            
            // Spiral effect
            const currentAngle = startAngle + (elapsed / 1000) * rotationSpeed;

            particle.x = x + Math.cos(currentAngle) * currentRadius;
            particle.y = y + Math.sin(currentAngle) * currentRadius;

            // Fade in then fade out
            const alpha = Math.sin(progress * Math.PI);
            const size = startSize * alpha;

            particle.clear();
            // Use a mix of circles and maybe stretched ovals for a more 'swirly' feel
            particle.beginFill(colors[i % colors.length], alpha);
            particle.drawCircle(0, 0, size);
            particle.endFill();

            return true;
        }, pDuration);
    }
}

export function showEscudoDeOssosExplosion(vfxManager: VisualEffectsManager, x: number, y: number, radius: number): void {
    const colors = [0x00FF00, 0x228B22, 0x000000]; // Green, ForestGreen, Black
    const numParticles = 50;
    const explosionDuration = 500; // ms

    for (let i = 0; i < numParticles; i++) {
        const particle = new Graphics();
        const angle = Math.random() * Math.PI * 2;
        const travelDist = radius * (0.5 + Math.random() * 0.5);
        
        let elapsed = 0;
        const pDuration = explosionDuration * (0.7 + Math.random() * 0.3);

        vfxManager.addEffect(particle, (deltaSeconds) => {
            elapsed += deltaSeconds * 1000;
            const progress = elapsed / pDuration;
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

export function showEscudoDeOssosBuff(vfxManager: VisualEffectsManager, target: CombatCapable, durationMs: number): void {
    const container = new Container();
    let elapsed = 0;

    const bones: Text[] = [];
    const numBones = 4;
    const orbitRadius = target.size * 1.2;

    for (let i = 0; i < numBones; i++) {
        const boneStyle = new TextStyle({ fontSize: 18, fill: '#FFFFFF', stroke: '#000000', strokeThickness: 2 } as any);
        const bone = new Text('🦴', boneStyle);
        bone.anchor.set(0.5);
        container.addChild(bone);
        bones.push(bone);
    }
    
    vfxManager.addEffect(container, (deltaSeconds) => {
        elapsed += deltaSeconds * 1000;
        
        if (!target.isAlive || elapsed >= durationMs) {
            bones.forEach(s => s.destroy());
            return false;
        }

        container.x = target.x;
        container.y = target.y;

        const rotationSpeed = 4; // radians per second
        bones.forEach((bone, i) => {
            const angle = (i / numBones) * Math.PI * 2 + elapsed * 0.001 * rotationSpeed;
            bone.x = Math.cos(angle) * orbitRadius;
            bone.y = Math.sin(angle * 0.5) * (orbitRadius * 0.5); // Elliptical orbit for 3D effect
            bone.scale.set(0.8 + Math.sin(angle + elapsed * 0.002) * 0.2);
        });

        return true;
    }, durationMs);
}

export function showExplosaoNecrotica(vfxManager: VisualEffectsManager, x: number, y: number, radius: number): void {
    const shockwave = new Graphics();
    shockwave.x = x;
    shockwave.y = y;
    const duration = 400; // ms
    let elapsed = 0;

    // Green shockwave
    vfxManager.addEffect(shockwave, (delta) => {
        elapsed += delta * 1000;
        const progress = elapsed / duration;
        if (progress >= 1) return false;

        const currentRadius = radius * progress;
        const alpha = 1 - progress;

        shockwave.clear();
        shockwave.lineStyle(6 * alpha, 0x39FF14, alpha); // Neon Green
        shockwave.drawCircle(0, 0, currentRadius);

        return true;
    }, duration);

    // Black inner implosion/particles
    const numParticles = 20;
    for (let i = 0; i < numParticles; i++) {
        const particle = new Graphics();
        const angle = Math.random() * Math.PI * 2;
        const travelDist = radius * Math.random();
        
        let pElapsed = 0;
        const pDuration = duration * (0.5 + Math.random() * 0.5);

        vfxManager.addEffect(particle, (delta) => {
            pElapsed += delta * 1000;
            const progress = pElapsed / pDuration;
            if (progress >= 1) return false;

            const currentDist = travelDist * progress;
            particle.x = x + Math.cos(angle) * currentDist;
            particle.y = y + Math.sin(angle) * currentDist;
            
            const alpha = Math.sin((1 - progress) * Math.PI);
            const size = (1 + Math.random() * 2) * alpha;

            particle.clear();
            particle.beginFill(0x000000, alpha * 0.8);
            particle.drawCircle(0, 0, size);
            particle.endFill();

            return true;
        }, pDuration);
    }
}
