import { Graphics } from 'pixi.js';
import type { VisualEffectsManager } from '../VisualEffectsManager';
import type { CombatCapable } from '../entityInterfaces';

export function showShieldBashImpact(vfxManager: VisualEffectsManager, x: number, y: number): void {
    const impact = new Graphics();
    impact.x = x;
    impact.y = y;
    const duration = 250;
    let elapsed = 0;

    vfxManager.addEffect(impact, (delta) => {
        elapsed += delta * 1000;
        const progress = elapsed / duration;
        if (progress >= 1) return false;

        const alpha = 1 - progress;
        const radius = 30 * progress;
        impact.clear();
        impact.lineStyle(6 * alpha, 0xFFD700, 1);
        impact.drawCircle(0, 0, radius);
        return true;
    }, duration);
}

export function showTaunt(vfxManager: VisualEffectsManager, caster: CombatCapable, radius: number): void {
    const ring = new Graphics();
    ring.x = caster.x;
    ring.y = caster.y;
    const duration = 500;
    let elapsed = 0;

    vfxManager.addEffect(ring, (delta) => {
        elapsed += delta * 1000;
        const progress = elapsed / duration;
        if (progress >= 1) return false;

        const currentRadius = radius * progress;
        const alpha = 1 - progress;
        ring.clear();
        ring.lineStyle(5 * alpha, 0xFF0000, 1);
        ring.drawCircle(0, 0, currentRadius);
        return true;
    }, duration);
}

export function showProtecaoCompartilhada(vfxManager: VisualEffectsManager, targets: CombatCapable[]): void {
    const duration = 800;
    targets.forEach(target => {
        if (!target.isAlive) return;
        const shield = new Graphics();
        shield.x = target.x;
        shield.y = target.y;
        let elapsed = 0;

        vfxManager.addEffect(shield, (delta) => {
            elapsed += delta * 1000;
            const progress = elapsed / duration;
            if (progress >= 1) return false;

            const alpha = Math.sin(progress * Math.PI) * 0.5;
            shield.clear();
            shield.beginFill(0xADD8E6, alpha);
            shield.drawCircle(0, 0, target.size * 1.1);
            shield.endFill();
            return true;
        }, duration);
    });
}
