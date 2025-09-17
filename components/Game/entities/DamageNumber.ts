import { getEntityId } from '../entityUtils';

export class DamageNumber {
    id: number;
    amount: string | number; // Can be "Esquiva!" or a number
    x: number;
    y: number;
    life: number = 60; // Duration in frames (1 second at 60fps)
    alpha: number = 1;
    color: string;
    vy: number = -0.7; // Vertical speed (drifts upwards)
    delayFrames: number = 0; // New property

    constructor(amount: string | number, x: number, y: number, color: string = 'white') {
        this.id = getEntityId();
        this.amount = amount;
        this.x = x + (Math.random() - 0.5) * 20; // Slight random horizontal offset
        this.y = y;
        this.color = color;
    }

    update(): boolean { // Returns true if still active
        if (this.delayFrames > 0) {
            this.delayFrames--;
            return true; // Still active, but don't move or fade yet
        }
        this.y += this.vy;
        this.life--;
        this.alpha = Math.max(0, this.life / 60); // Fade out
        return this.life > 0;
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (this.delayFrames > 0) {
            return; // Don't draw if delayed
        }
        ctx.save();
        ctx.globalAlpha = this.alpha;
        const isSpecial = this.color === 'red' || this.color === 'orange' || this.color === '#2EE6D0';
        ctx.font = isSpecial ? "bold 22px Fredoka" : "18px Fredoka";
        ctx.strokeStyle = 'black'; // Outline for readability
        ctx.lineWidth = 3;
        ctx.strokeText(String(this.amount), this.x, this.y);
        ctx.fillStyle = this.color;
        ctx.fillText(String(this.amount), this.x, this.y);
        ctx.restore();
    }
}

export class NotificationText {
    id: number;
    text: string;
    x: number;
    y: number;
    life: number = 120; // 2 seconds at 60fps
    alpha: number = 1;
    color: string;
    vy: number = -0.5; // Vertical speed (drifts upwards slowly)

    constructor(text: string, x: number, y: number, color: string = '#FFD700') { // Gold color as default
        this.id = getEntityId();
        this.text = text;
        this.x = x;
        this.y = y;
        this.color = color;
    }

    update(): boolean { // Returns true if still active
        this.y += this.vy;
        this.life--;
        this.alpha = Math.max(0, this.life / 120); // Fade out over its lifetime
        return this.life > 0;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.font = "bold 16px Fredoka";
        ctx.textAlign = 'center';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.strokeText(this.text, this.x, this.y);
        ctx.fillStyle = this.color;
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}