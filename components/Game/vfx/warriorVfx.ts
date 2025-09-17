import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { VisualEffectsManager } from '../VisualEffectsManager';
import type { CombatCapable } from '../entityInterfaces';

export function showRegeneracaoDeBatalha(vfxManager: VisualEffectsManager, hero: CombatCapable, isMaxFury: boolean): void {
    const duration = isMaxFury ? 5000 : 1000; // HoT lasts 5s, instant heal effect is shorter
    let elapsed = 0;
    const particleInterval = isMaxFury ? 200 : 100;
    let lastParticleTime = -particleInterval;

    const container = new Container();

    vfxManager.addEffect(container, (deltaSeconds) => {
        elapsed += deltaSeconds * 1000;
        if (elapsed >= duration || !hero.isAlive) {
            return false;
        }

        // Create new particles
        if (elapsed - lastParticleTime > particleInterval) {
            lastParticleTime = elapsed;
            const styleOptions = {
                fontSize: 16,
                fill: isMaxFury ? '#2EE6D0' : '#48BB78', // Teal for HoT, Green for instant
                fontWeight: 'bold' as const,
                stroke: '#FFFFFF',
                strokeThickness: 2,
            };
            const style = new TextStyle(styleOptions as any);
            const plusSign = new Text('+', style);
            plusSign.anchor.set(0.5);
            plusSign.x = hero.x + (Math.random() - 0.5) * hero.size;
            plusSign.y = hero.y;

            const stage = vfxManager['stage'];
            stage.addChild(plusSign);

            const pDuration = 1200; // ms
            let pElapsed = 0;
            const floatSpeed = -40; // pixels per second (upwards)

            // A separate effect for each individual plus sign
            vfxManager.addEffect(plusSign, (pDelta) => {
                pElapsed += pDelta * 1000;
                if (pElapsed >= pDuration) {
                    return false;
                }
                const progress = pElapsed / pDuration;
                plusSign.y += floatSpeed * pDelta;
                plusSign.alpha = 1 - progress;
                return true;
            }, pDuration);
        }
        // This container is just a timer, it doesn't draw anything itself
        return true;
    }, duration);
}

export function showVigorDeBatalha(vfxManager: VisualEffectsManager, hero: CombatCapable, durationMs: number): void {
    const container = new Container();
    let elapsed = 0;

    const particles: { g: Graphics, life: number, maxLife: number, angle: number, radius: number, speed: number }[] = [];
    const numParticles = 20;

    for (let i = 0; i < numParticles; i++) {
        const pGraphics = new Graphics();
        const particle = {
            g: pGraphics,
            life: 0,
            maxLife: 0.8 + Math.random() * 0.4, // seconds
            angle: Math.random() * Math.PI * 2,
            radius: hero.size * 0.5 + Math.random() * 10,
            speed: 1 + Math.random() * 2 // Radians per second
        };
        particles.push(particle);
        container.addChild(pGraphics);
    }

    vfxManager.addEffect(container, (deltaSeconds) => {
        elapsed += deltaSeconds * 1000;
        if (elapsed >= durationMs || !hero.isAlive) {
            particles.forEach(p => { container.removeChild(p.g); p.g.destroy(); });
            return false;
        }

        container.x = hero.x;
        container.y = hero.y;

        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.life += deltaSeconds;
            if (p.life >= p.maxLife) {
                // Reset particle
                p.life = 0;
                p.angle = Math.random() * Math.PI * 2;
                p.radius = hero.size * 0.5 + Math.random() * 10;
            }

            p.angle += p.speed * deltaSeconds;

            const progress = p.life / p.maxLife;
            const alpha = Math.sin(progress * Math.PI) * 0.8;
            const size = 1 + Math.sin(progress * Math.PI) * 2;
            
            p.g.x = Math.cos(p.angle) * p.radius;
            p.g.y = (Math.sin(p.angle * 1.5) * p.radius * 0.5) + (hero.size * 0.2 * Math.sin(p.life * Math.PI)); // Elliptical + vertical movement
            
            p.g.clear();
            p.g.beginFill(0xDC143C, alpha); // Crimson red
            p.g.drawCircle(0, 0, size);
            p.g.endFill();
        }

        return true;
    }, durationMs);
}

export function showInterceptarTrail(vfxManager: VisualEffectsManager, hero: CombatCapable, durationMs: number): void {
    const container = new Container();
    let elapsed = 0;
    let lastParticleTime = 0;
    const particleInterval = 30; // ms

    const afterImages: { g: Graphics, life: number, maxLife: number }[] = [];

    vfxManager.addEffect(container, (deltaSeconds) => {
        elapsed += deltaSeconds * 1000;
        if (elapsed >= durationMs || !hero.isAlive) {
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
            p.g.alpha = 1 - progress;
            p.g.scale.set(1 - progress);
        }

        // Create new particles
        if (elapsed - lastParticleTime > particleInterval) {
            lastParticleTime = elapsed;
            const pGraphics = new Graphics();
            pGraphics.x = hero.x;
            pGraphics.y = hero.y;

            const particle = {
                g: pGraphics,
                life: 0,
                maxLife: 0.4 + Math.random() * 0.3, // seconds
            };
            
            pGraphics.beginFill(0xFF0000, 0.7);
            pGraphics.drawCircle(0, 0, hero.size * 0.3);
            pGraphics.endFill();

            afterImages.push(particle);
            container.addChild(pGraphics);
        }

        return true;
    }, durationMs);
}

export function showTornadoMortal(vfxManager: VisualEffectsManager, hero: CombatCapable, radius: number, durationMs: number): void {
    const container = new Container();
    let elapsed = 0;

    const blades: {
        g: Graphics,
        angle: number,
        radius: number,
        speed: number,
        yOffset: number,
        initialYOffset: number,
    }[] = [];

    const drawBladeGraphic = (width: number, height: number): Graphics => {
        const blade = new Graphics();
        blade.beginFill(0xEE2222);
        blade.lineStyle(1, 0x8B0000);
        blade.moveTo(0, -width / 2);
        blade.quadraticCurveTo(height / 2, 0, height, -width / 4);
        blade.lineTo(height, width / 4);
        blade.quadraticCurveTo(height / 2, 0, 0, width / 2);
        blade.closePath();
        blade.endFill();
        return blade;
    };

    const numBlades = 12;
    for (let i = 0; i < numBlades; i++) {
        const bladeGraphic = drawBladeGraphic(6 + Math.random() * 4, 20 + Math.random() * 10);
        const yOffset = (Math.random() - 0.5) * radius * 0.8;
        blades.push({
            g: bladeGraphic,
            angle: Math.random() * Math.PI * 2,
            radius: radius * 0.3 + Math.random() * radius * 0.6,
            speed: (5 + Math.random() * 5) * (i % 2 === 0 ? 1 : -1),
            yOffset: yOffset,
            initialYOffset: yOffset,
        });
        container.addChild(bladeGraphic);
    }

    vfxManager.addEffect(container, (deltaSeconds) => {
        elapsed += deltaSeconds * 1000;
        if (elapsed >= durationMs || !hero.isAlive) {
            blades.forEach(b => b.g.destroy());
            return false;
        }

        container.x = hero.x;
        container.y = hero.y;

        const globalProgress = elapsed / durationMs;
        const alpha = Math.sin(globalProgress * Math.PI); 

        blades.forEach(blade => {
            blade.angle += blade.speed * deltaSeconds;

            const tornadoPhase = elapsed * 0.008;
            blade.yOffset = blade.initialYOffset * Math.cos(tornadoPhase + blade.radius);

            blade.g.x = Math.cos(blade.angle) * blade.radius;
            blade.g.y = (Math.sin(blade.angle) * blade.radius * 0.4) + blade.yOffset; 
            
            blade.g.rotation = blade.angle + Math.PI / 2;
            
            blade.g.alpha = alpha;
            const scalePulse = 0.9 + Math.sin(elapsed * 0.02 + blade.angle) * 0.1;
            blade.g.scale.set(scalePulse);
        });

        return true;
    }, durationMs);
}

export function showConeSlash(vfxManager: VisualEffectsManager, caster: CombatCapable, range: number, coneAngle: number, colorHex: string = '#FFFFFF'): void {
    const container = new Container();

    const totalDuration = 300; // Faster effect
    const arcThickness = 25; // A nice thick arc

    const arcGraphic = new Graphics();
    container.addChild(arcGraphic);

    const numParticles = 20;
    const particles: { g: Graphics, vx: number, vy: number, life: number, maxLife: number }[] = [];
    const angle = caster.target ? Math.atan2(caster.target.y - caster.y, caster.target.x - caster.x) : 0;
    
    for (let i = 0; i < numParticles; i++) {
        const pGraphic = new Graphics();
        const pSpeed = 60 + Math.random() * 100;
        const pAngle = angle + (Math.random() - 0.5) * 0.6; // More focused burst
        particles.push({
            g: pGraphic,
            vx: Math.cos(pAngle) * pSpeed,
            vy: Math.sin(pAngle) * pSpeed,
            life: 0,
            maxLife: 250 + Math.random() * 200
        });
        container.addChild(pGraphic);
    }

    let elapsed = 0;
    vfxManager.addEffect(container, (deltaSeconds) => {
        elapsed += deltaSeconds * 1000;
        if (elapsed >= totalDuration) {
            arcGraphic.destroy();
            particles.forEach(p => p.g.destroy());
            return false;
        }

        container.x = caster.x;
        container.y = caster.y;
        container.rotation = angle;

        // Animate the traveling arc
        const progress = elapsed / totalDuration;
        const easeOutQuad = (t: number) => t * (2 - t);
        const easedProgress = easeOutQuad(progress);

        const currentOuterRadius = range * easedProgress;
        const currentInnerRadius = Math.max(0, currentOuterRadius - arcThickness);
        const alpha = Math.sin(progress * Math.PI); // Fade in and out

        arcGraphic.clear();
        arcGraphic.beginFill(0xFFFFFF, alpha);
        
        const coneAngleRad = coneAngle * (Math.PI / 180);
        
        arcGraphic.moveTo(currentInnerRadius, 0);
        arcGraphic.arc(0, 0, currentOuterRadius, -coneAngleRad / 2, coneAngleRad / 2);
        arcGraphic.arc(0, 0, currentInnerRadius, coneAngleRad / 2, -coneAngleRad / 2, true);
        arcGraphic.closePath();
        
        arcGraphic.endFill();

        // Animate initial particles
        particles.forEach(p => {
            if (p.life >= p.maxLife) return;
            p.life += deltaSeconds * 1000;

            p.g.x += p.vx * deltaSeconds;
            p.g.y += p.vy * deltaSeconds;

            const pProgress = p.life / p.maxLife;
            const pAlpha = (1 - pProgress) * 0.8;
            const pSize = 2.5 * (1 - pProgress);

            p.g.clear();
            p.g.beginFill(0xFFFFFF, pAlpha);
            p.g.drawCircle(0, 0, pSize);
            p.g.endFill();
        });

        return true;
    }, totalDuration);
}
