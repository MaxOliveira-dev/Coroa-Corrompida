import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { VisualEffectsManager } from '../VisualEffectsManager';
import type { CombatCapable } from '../entityInterfaces';

export function showExplosaoMagicaHit(vfxManager: VisualEffectsManager, x: number, y: number, radius: number): void {
    const numParticles = 40;
    const duration = 700; // ms
    const colors = [0x90CAF9, 0x42A5F5, 0xFFFFFF]; // Mago colors: Light blue, blue, white

    // Central flash
    const flash = new Graphics();
    flash.x = x;
    flash.y = y;
    let elapsedFlash = 0;
    vfxManager.addEffect(flash, (delta) => {
        elapsedFlash += delta * 1000;
        const progress = elapsedFlash / 150; // a very short flash
        if (progress >= 1) return false;
        flash.clear();
        flash.beginFill(0xE3F2FD, 0.9 * (1 - progress)); // Very light blue flash
        flash.drawCircle(0, 0, radius * 0.8 * progress);
        flash.endFill();
        return true;
    }, 150);


    for (let i = 0; i < numParticles; i++) {
        const particle = new Graphics();
        particle.x = x;
        particle.y = y;
        
        const angle = Math.random() * Math.PI * 2;
        const travelDist = radius * (0.4 + Math.random() * 0.6);
        
        let pElapsed = 0;
        const pDuration = duration * (0.6 + Math.random() * 0.4);

        vfxManager.addEffect(particle, (deltaSeconds) => {
            pElapsed += deltaSeconds * 1000;
            const progress = pElapsed / pDuration;
            if (progress >= 1) return false;

            // Ease-out explosion
            const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);
            const currentDist = travelDist * easeOutQuart(progress);
            
            particle.x = x + Math.cos(angle) * currentDist;
            // Gravity effect
            particle.y = y + Math.sin(angle) * currentDist + (progress * progress * 80); 
            
            const alpha = Math.sin((1 - progress) * Math.PI); // Fade out over lifetime
            const size = (1 + Math.random() * 2) * alpha;

            particle.clear();
            particle.beginFill(colors[i % colors.length], alpha);
            particle.drawCircle(0, 0, size);
            particle.endFill();

            return true;
        }, pDuration);
    }
}

export function showFireballExplosion(vfxManager: VisualEffectsManager, x: number, y: number, radius: number): void {
    const numParticles = 40;
    const duration = 700; // ms
    const colors = [0xFF4500, 0xFFA500, 0xFFD700]; // OrangeRed, Orange, Gold

    // Central flash
    const flash = new Graphics();
    flash.x = x;
    flash.y = y;
    let elapsedFlash = 0;
    vfxManager.addEffect(flash, (delta) => {
        elapsedFlash += delta * 1000;
        const progress = elapsedFlash / 150; // a very short flash
        if (progress >= 1) return false;
        flash.clear();
        flash.beginFill(0xFFFDE7, 0.9 * (1 - progress)); // Bright yellow-white flash
        flash.drawCircle(0, 0, radius * 0.8 * progress);
        flash.endFill();
        return true;
    }, 150);


    for (let i = 0; i < numParticles; i++) {
        const particle = new Graphics();
        particle.x = x;
        particle.y = y;
        
        const angle = Math.random() * Math.PI * 2;
        const travelDist = radius * (0.4 + Math.random() * 0.6);
        
        let pElapsed = 0;
        const pDuration = duration * (0.6 + Math.random() * 0.4);

        vfxManager.addEffect(particle, (deltaSeconds) => {
            pElapsed += deltaSeconds * 1000;
            const progress = pElapsed / pDuration;
            if (progress >= 1) return false;

            // Ease-out explosion
            const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);
            const currentDist = travelDist * easeOutQuart(progress);
            
            particle.x = x + Math.cos(angle) * currentDist;
            // Gravity effect
            particle.y = y + Math.sin(angle) * currentDist + (progress * progress * 80); 
            
            const alpha = Math.sin((1 - progress) * Math.PI); // Fade out over lifetime
            const size = (1 + Math.random() * 2) * alpha;

            particle.clear();
            particle.beginFill(colors[i % colors.length], alpha);
            particle.drawCircle(0, 0, size);
            particle.endFill();

            return true;
        }, pDuration);
    }
}

export function showExplosaoGelida(vfxManager: VisualEffectsManager, x: number, y: number, radius: number): void {
    const numParticles = 60;
    const duration = 600; // ms
    const colors = [0xFFFFFF, 0xADD8E6, 0x87CEEB]; // White, LightBlue, SkyBlue

    // Central flash
    const flash = new Graphics();
    flash.x = x;
    flash.y = y;
    let elapsed = 0;
    vfxManager.addEffect(flash, (delta) => {
        elapsed += delta * 1000;
        const progress = elapsed / 200;
        if (progress >= 1) return false;
        flash.clear();
        flash.beginFill(0xFFFFFF, 0.8 * (1 - progress));
        flash.drawCircle(0, 0, radius * 0.5 * progress);
        flash.endFill();
        return true;
    }, 200);

    // Particles bursting outwards
    for (let i = 0; i < numParticles; i++) {
        const particle = new Graphics();
        const angle = Math.random() * Math.PI * 2;
        const travelDist = radius * (0.2 + Math.random() * 0.8);
        
        let pElapsed = 0;
        const pDuration = duration * (0.6 + Math.random() * 0.4);

        vfxManager.addEffect(particle, (deltaSeconds) => {
            pElapsed += deltaSeconds * 1000;
            const progress = pElapsed / pDuration;
            if (progress >= 1) return false;

            const currentDist = travelDist * progress;
            particle.x = x + Math.cos(angle) * currentDist;
            particle.y = y + Math.sin(angle) * currentDist;
            
            const alpha = Math.sin((1 - progress) * Math.PI);
            const size = (1 + Math.random() * 2) * alpha;

            particle.clear();
            particle.beginFill(colors[i % colors.length], alpha);
            particle.drawRect(-size, -size/5, size*2, size/2.5);
            particle.rotation = Math.random() * Math.PI * 2;
            return true;
        }, pDuration);
    }
}

export function showIntelectoSurreal(vfxManager: VisualEffectsManager, targets: CombatCapable[]): void {
    const duration = 15000;
    targets.forEach(target => {
        if (!target.isAlive) return;
        const container = new Container();
        const text = new Text('🧙‍♂️', new TextStyle({ fontSize: 16 }));
        text.anchor.set(0.5);
        container.addChild(text);
        let elapsed = 0;

        vfxManager.addEffect(container, (delta) => {
            elapsed += delta * 1000;
            if (elapsed >= duration || !target.isAlive) return false;

            container.x = target.x;
            container.y = target.y - target.size;
            container.alpha = Math.sin(elapsed / duration * Math.PI);
            return true;
        }, duration);
    });
}

export function showExplosaoMagicaReady(vfxManager: VisualEffectsManager, caster: CombatCapable, durationMs: number): void {
    const container = new Container();
    let elapsed = 0;
    const color = 0xFF8C00; // DarkOrange

    vfxManager.addEffect(container, (deltaSeconds) => {
        elapsed += deltaSeconds * 1000;
        if (elapsed >= durationMs || !caster.isAlive) return false;

        container.x = caster.x;
        container.y = caster.y;
        container.alpha = Math.sin(elapsed / durationMs * Math.PI);

        const graphics = (container.children[0] as Graphics) || new Graphics();
        if (container.children.length === 0) container.addChild(graphics);

        const radius = caster.size * 0.6 + Math.sin(elapsed * 0.015) * 3;
        graphics.clear();
        graphics.beginFill(color, 0.5);
        graphics.drawCircle(0, 0, radius);
        graphics.endFill();

        return true;
    }, durationMs);
}
