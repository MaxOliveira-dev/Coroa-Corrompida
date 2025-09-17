import { Graphics, Container, TextStyle } from 'pixi.js';
import type { VisualEffectsManager } from '../VisualEffectsManager';
import type { CombatCapable } from '../entityInterfaces';

export function showTiroMortalHit(vfxManager: VisualEffectsManager, target: CombatCapable): void {
    const impact = new Graphics();
    impact.x = target.x;
    impact.y = target.y;
    const duration = 400;
    let elapsed = 0;

    vfxManager.addEffect(impact, (delta) => {
        elapsed += delta * 1000;
        const progress = elapsed / duration;
        if (progress >= 1) return false;

        const alpha = 1 - progress;
        const scale = 1 + progress;
        impact.clear();
        impact.lineStyle(4 * alpha, 0xFF0000, 1);
        
        const points = 5;
        const radius = target.size * scale;
        const innerRadius = target.size * 0.5 * scale;
        const rotation = -Math.PI / 2; // Point up
        const path = [];
        const totalPoints = points * 2;
        for (let i = 0; i < totalPoints; i++) {
            const r = (i % 2) === 0 ? radius : innerRadius;
            const angle = (i * Math.PI / points) + rotation;
            path.push(Math.cos(angle) * r, Math.sin(angle) * r);
        }
        impact.drawPolygon(path);

        return true;
    }, duration);
}

export function showDisparoMultiplo(vfxManager: VisualEffectsManager, x: number, y: number, angle: number, coneAngle: number, numProjectiles: number, range: number): void {
    const duration = 300;
    const coneAngleRad = coneAngle * (Math.PI / 180);

    for (let i = 0; i < numProjectiles; i++) {
        const line = new Graphics();
        const pAngle = angle - coneAngleRad / 2 + (coneAngleRad / (numProjectiles > 1 ? numProjectiles - 1 : 1)) * i;
        
        let elapsed = 0;
        vfxManager.addEffect(line, (delta) => {
            elapsed += delta * 1000;
            const progress = elapsed / duration;
            if (progress >= 1) return false;
            
            const startDist = range * progress * 0.5;
            const endDist = range * progress;

            const startX = x + Math.cos(pAngle) * startDist;
            const startY = y + Math.sin(pAngle) * startDist;
            const endX = x + Math.cos(pAngle) * endDist;
            const endY = y + Math.sin(pAngle) * endDist;

            line.clear();
            line.lineStyle(2, 0xFFFFFF, 1 - progress);
            line.moveTo(startX, startY);
            line.lineTo(endX, endY);
            return true;
        }, duration);
    }
}

export function showHabilidadeEPrecisao(vfxManager: VisualEffectsManager, caster: CombatCapable, durationMs: number): void {
    const container = new Container();
    let elapsed = 0;
    const color = 0x00FF00;

    vfxManager.addEffect(container, (deltaSeconds) => {
        elapsed += deltaSeconds * 1000;
        if (elapsed >= durationMs || !caster.isAlive) return false;

        container.x = caster.x;
        container.y = caster.y;
        container.alpha = Math.sin(elapsed / durationMs * Math.PI);

        const graphics = (container.children[0] as Graphics) || new Graphics();
        if (container.children.length === 0) container.addChild(graphics);

        const radius = caster.size * 0.8 + Math.sin(elapsed * 0.01) * 2;
        graphics.clear();
        graphics.lineStyle(2, color, 0.7);
        graphics.drawCircle(0, 0, radius);

        return true;
    }, durationMs);
}
