import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { CombatCapable } from '../entityInterfaces';
import type { VisualEffectsManager } from '../VisualEffectsManager';

export function showAcordeDissonante(vfxManager: VisualEffectsManager, caster: CombatCapable): void {
    const container = new Container();
    const shockwave = new Graphics();
    container.addChild(shockwave);
    
    const duration = 400; // ms
    let elapsed = 0;
    const color = 0xC471ED; // Purple
    const radius = 120; // from ability properties in gameData

    // particles
    const textStyle = new TextStyle({ fontSize: 20, fill: color, fontWeight: 'bold' });
    const particles: { text: Text, vx: number, vy: number, life: number, maxLife: number }[] = [];
    const numParticles = 8;
    for (let i = 0; i < numParticles; i++) {
        const char = i % 2 === 0 ? '♯' : '♭';
        const pText = new Text(char, textStyle);
        pText.anchor.set(0.5);
        const angle = Math.random() * Math.PI * 2;
        const speed = 80 + Math.random() * 50;
        particles.push({ text: pText, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 0, maxLife: duration * (0.8 + Math.random() * 0.2) });
        container.addChild(pText);
    }
    
    vfxManager.addEffect(container, (delta) => {
        elapsed += delta * 1000;
        const progress = elapsed / duration;
        if (progress >= 1) return false;
        
        container.x = caster.x;
        container.y = caster.y;
        
        const currentRadius = radius * progress;
        const alpha = 1 - progress;
        
        shockwave.clear();
        shockwave.lineStyle(6 * alpha, color, alpha);
        // Irregular circle
        const points = 16;
        const path = [];
        for (let i = 0; i < points; i++) {
            const angle = (i / points) * Math.PI * 2;
            const r = currentRadius * (0.9 + Math.sin(angle * 5 + elapsed * 0.02) * 0.1);
            path.push(Math.cos(angle) * r, Math.sin(angle) * r);
        }
        shockwave.drawPolygon(path);
        
        // update particles
        particles.forEach(p => {
            p.text.x += p.vx * delta;
            p.text.y += p.vy * delta;
            p.life += delta * 1000;
            p.text.alpha = Math.max(0, 1 - (p.life / p.maxLife));
        });
        
        return true;
    }, duration);
}

export function showMelodiaSerena(vfxManager: VisualEffectsManager, caster: CombatCapable, targets: CombatCapable[]): void {
    const duration = 1200; // ms
    const travelTime = 400; // ms
    const color = 0x76D7C4; // Teal
    
    targets.forEach(target => {
        const ring = new Graphics();
        ring.x = caster.x;
        ring.y = caster.y;
        let elapsed = 0;
        
        // Travel phase
        vfxManager.addEffect(ring, (delta) => {
            elapsed += delta * 1000;
            const progress = Math.min(1, elapsed / travelTime);
            if (!target.isAlive) return false;
            
            ring.x = caster.x + (target.x - caster.x) * progress;
            ring.y = caster.y + (target.y - caster.y) * progress;
            
            const alpha = 1 - progress;
            ring.clear();
            ring.lineStyle(3, color, alpha * 0.8);
            ring.drawCircle(0, 0, 15 * progress);
            
            return elapsed < travelTime;
        }, travelTime);
        
        // Aura phase after travel
        setTimeout(() => {
            if (!target.isAlive) return;
            const aura = new Graphics();
            const auraDuration = duration - travelTime;
            let auraElapsed = 0;
            
            // Particles
            const textStyle = new TextStyle({ fontSize: 16, fill: color });
            const pText = new Text(Math.random() > 0.5 ? '♪' : '𝄞', textStyle);
            pText.anchor.set(0.5);
            let pElapsed = 0;
            const pDuration = 800;
            vfxManager.addEffect(pText, pDelta => {
                pElapsed += pDelta * 1000;
                if(pElapsed > pDuration || !target.isAlive) return false;
                pText.x = target.x;
                pText.y = target.y - (target.size * 0.5) - (pElapsed/pDuration * 30);
                pText.alpha = 1 - (pElapsed/pDuration);
                return true;
            }, pDuration);

            vfxManager.addEffect(aura, (delta) => {
                auraElapsed += delta * 1000;
                if (auraElapsed > auraDuration || !target.isAlive) return false;
                
                aura.x = target.x;
                aura.y = target.y;
                
                const progress = auraElapsed / auraDuration;
                const alpha = Math.sin((1 - progress) * Math.PI) * 0.4;
                const radius = target.size * (0.8 + Math.sin(progress * Math.PI) * 0.2);
                
                aura.clear();
                aura.beginFill(color, alpha);
                aura.drawCircle(0, 0, radius);
                aura.endFill();
                
                return true;
            }, auraDuration);

        }, travelTime);
    });
}

export function showBalaustradaHarmonica(vfxManager: VisualEffectsManager, targets: CombatCapable[]): void {
    const duration = 1500;
    const color = 0xF7DC6F; // Yellow
    
    targets.forEach(target => {
        if (!target.isAlive) return;
        const container = new Container();
        const numLines = 3;
        const lines: Graphics[] = [];
        
        for (let i = 0; i < numLines; i++) {
            const line = new Graphics();
            lines.push(line);
            container.addChild(line);
        }
        
        const shield = new Graphics();
        container.addChild(shield);
        
        let elapsed = 0;
        vfxManager.addEffect(container, (delta) => {
            elapsed += delta * 1000;
            const progress = elapsed / duration;
            if (progress >= 1 || !target.isAlive) return false;
            
            container.x = target.x;
            container.y = target.y;
            
            // Rotating lines
            if (progress < 0.4) {
                const lineProgress = progress / 0.4;
                lines.forEach((line, i) => {
                    const angle = (elapsed * 0.01) + (i * Math.PI * 2 / numLines);
                    const radius = target.size * (1 + lineProgress);
                    const yOffset = (i - 1) * 8;
                    line.clear();
                    line.lineStyle(2, color, lineProgress);
                    line.drawCircle(0, yOffset, radius);
                });
            } else {
                 lines.forEach(line => line.clear());
            }

            // Shield form and shrink
            if (progress > 0.3 && progress < 0.8) {
                const shieldProgress = (progress - 0.3) / 0.5;
                const alpha = Math.sin(shieldProgress * Math.PI) * 0.5;
                const radius = target.size * (1.5 - (0.7 * shieldProgress));
                shield.clear();
                shield.beginFill(color, alpha);
                shield.drawCircle(0, 0, radius);
                shield.endFill();
            } else {
                shield.clear();
            }

            return true;
        }, duration);
    });
}

export function showInicioDaComposicao(vfxManager: VisualEffectsManager, caster: CombatCapable, durationMs: number): void {
    const container = new Container();
    const colors = [0xC471ED, 0x76D7C4, 0xF7DC6F];
    const rings: Graphics[] = [];

    for (let i = 0; i < 3; i++) {
        const ring = new Graphics();
        rings.push(ring);
        container.addChild(ring);
    }

    let elapsed = 0;
    vfxManager.addEffect(container, (delta) => {
        elapsed += delta * 1000;
        if (elapsed > durationMs || !caster.isAlive) return false;

        container.x = caster.x;
        container.y = caster.y;

        const globalAlpha = Math.min(1, elapsed / 500) * (1 - Math.max(0, (elapsed - (durationMs - 500)) / 500));

        rings.forEach((ring, i) => {
            const angle = (elapsed * 0.002) + (i * Math.PI * 2 / 3);
            const radius = caster.size * 0.7 + Math.sin(elapsed * 0.005 + i) * 3;
            const x = Math.cos(angle) * radius * 0.5;
            const y = Math.sin(angle) * radius * 0.2;
            
            ring.clear();
            ring.beginFill(colors[i], 0.5 * globalAlpha);
            ring.drawCircle(x, y, 4);
            ring.endFill();
        });

        return true;
    }, durationMs);
}

export function showBardCompositionFinale(vfxManager: VisualEffectsManager, caster: CombatCapable, comboColors: string[]): void {
    const duration = 1200;
    const colors = comboColors.map(c => parseInt(c.replace('#', ''), 16));

    const numSpirals = 3;
    for (let i = 0; i < numSpirals; i++) {
        const spiral = new Graphics();
        let elapsed = 0;
        const pDuration = duration * (0.8 + Math.random() * 0.2);
        const startAngle = Math.random() * Math.PI * 2;
        const color = colors[i % colors.length];

        vfxManager.addEffect(spiral, delta => {
            elapsed += delta * 1000;
            const progress = elapsed / pDuration;
            if (progress >= 1) return false;

            const currentRadius = 150 * progress;
            const alpha = Math.sin((1 - progress) * Math.PI);
            const thickness = 10 * alpha;
            const angle = startAngle + progress * 4;

            spiral.clear();
            spiral.lineStyle(thickness, color, alpha);
            spiral.arc(caster.x, caster.y, currentRadius, angle, angle + Math.PI / 2);

            return true;
        }, pDuration);
    }
}
