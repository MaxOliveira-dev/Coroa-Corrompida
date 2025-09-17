import { getEntityId } from '../entityUtils';

interface Particle {
    x: number;
    y: number;
    size: number;
    speedX: number;
    speedY: number;
    color: string;
}

export class DeathEffect {
    id: number;
    x: number;
    y: number;
    particles: Particle[] = [];
    duration: number; // Frames
    maxDuration: number;
    private behavior: 'burst' | 'trail'; // Store behavior to use in update method

    constructor(x: number, y: number, color: string = 'grey', particleCount: number = 15, duration: number = 30, behavior: 'burst' | 'trail' = 'burst') {
        this.id = getEntityId();
        this.x = x;
        this.y = y;
        this.maxDuration = duration;
        this.duration = duration;
        this.behavior = behavior; // Store behavior

        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: x,
                y: y,
                // Trail particles are smaller and have less speed variation
                size: behavior === 'trail' ? (Math.random() * 2 + 1) : (Math.random() * 5 + 3),
                speedX: (Math.random() - 0.5) * (behavior === 'trail' ? 1.5 : 5),
                speedY: (Math.random() - 0.5) * (behavior === 'trail' ? 1.5 : 5) - (behavior === 'burst' ? Math.random() * 2 : 0),
                color: color
            });
        }
    }

    update(): boolean { // Returns true if still active
        this.particles.forEach(p => {
            p.x += p.speedX;
            p.y += p.speedY;
            p.size *= 0.94; // Shrink particles
            
            // Only apply gravity for burst behavior
            if (this.behavior === 'burst') {
                p.speedY += 0.1; 
            }
        });
        this.duration--;
        return this.duration > 0;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.duration / this.maxDuration); // Fade out effect
        this.particles.forEach(p => {
            if (p.size < 0.5) return; // Don't draw tiny particles
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
    }
}