import type { TreeSceneryElement, RockSceneryElement, RiverSceneryElement, PineTreeSceneryElement, PuddleSceneryElement, FlowerSceneryElement } from './sceneryTypes';
import type { BiomeData, CombatStats, EquippedItems } from '../../types';

export function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, rParam: number) {
    let r = rParam;

    if (w < 0) {
        x += w;
        w = -w;
    }
    if (h < 0) {
        y += h;
        h = -h;
    }

    r = Math.max(0, r);

    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;

    r = Math.max(0, r);

    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

export function drawNecromancerStaff(ctx: CanvasRenderingContext2D, weaponSizeScale: number) {
    // Colors based on the image
    const shaftColor = '#4a2c2a'; // Dark brown
    const ribbonColor = '#5e4a8c'; // Purple
    const goldColor = '#f2d479';
    const goldOutline = '#b8860b';
    const gemColor = '#54b5d3';
    const gemHighlight = '#aeeef2';
    const skullColor = '#e0e0e0';
    const skullShadow = '#bababa';
    const clawColor = '#3b2f2f';
    const eyeGlowColor = '#59ceff';
    const fabricColor = '#3e5491';

    // Halving all size values
    const handleLength = 20 * weaponSizeScale;
    const handleWidth = 2 * weaponSizeScale;
    const goldPartHeight = 4 * weaponSizeScale;

    // Save context state
    ctx.save();
    
    // Bottom gold tip
    ctx.fillStyle = goldColor;
    ctx.strokeStyle = goldOutline;
    ctx.beginPath();
    ctx.moveTo(-handleWidth, handleLength);
    ctx.lineTo(handleWidth, handleLength);
    ctx.lineTo(0, handleLength + 5 * weaponSizeScale);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Shaft
    ctx.fillStyle = shaftColor;
    ctx.strokeStyle = '#2d1e1c';
    drawRoundedRect(ctx, -handleWidth / 2, -handleLength + goldPartHeight * 2.5, handleWidth, handleLength, 0.5 * weaponSizeScale);
    ctx.fill();
    ctx.stroke();

    // Purple Ribbon
    ctx.strokeStyle = ribbonColor;
    const originalLineWidth = ctx.lineWidth;
    ctx.lineWidth = 1.25 * weaponSizeScale;
    ctx.beginPath();
    let y = -handleLength * 0.2;
    let xSign = 1;
    ctx.moveTo(0, y);
    while(y < handleLength * 0.8) {
        const nextY = y + 5 * weaponSizeScale;
        ctx.quadraticCurveTo(handleWidth * 1.5 * xSign, (y + nextY) / 2, 0, nextY);
        y = nextY;
        xSign *= -1;
    }
    ctx.stroke();
    ctx.lineWidth = originalLineWidth;


    // Top gold part
    const topGoldY = -handleLength + goldPartHeight * 2.5;
    ctx.fillStyle = goldColor;
    ctx.strokeStyle = goldOutline;
    drawRoundedRect(ctx, -handleWidth * 1.5, topGoldY, handleWidth * 3, goldPartHeight, 1 * weaponSizeScale);
    ctx.fill();
    ctx.stroke();

    // Gem
    const gemY = topGoldY + goldPartHeight / 2;
    ctx.fillStyle = gemColor;
    ctx.beginPath();
    ctx.moveTo(0, gemY - 2.5 * weaponSizeScale); // top
    ctx.lineTo(2 * weaponSizeScale, gemY); // right
    ctx.lineTo(0, gemY + 2.5 * weaponSizeScale); // bottom
    ctx.lineTo(-2 * weaponSizeScale, gemY); // left
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Gem highlight
    ctx.fillStyle = gemHighlight;
    ctx.beginPath();
    ctx.moveTo(0, gemY - 1 * weaponSizeScale);
    ctx.lineTo(0.75 * weaponSizeScale, gemY);
    ctx.lineTo(0, gemY + 1 * weaponSizeScale);
    ctx.closePath();
    ctx.fill();


    // Skull part
    const skullCenterY = topGoldY - 9 * weaponSizeScale;
    const skullWidth = 7 * weaponSizeScale;
    const skullHeight = 8 * weaponSizeScale;

    // Blue fabric behind skull
    ctx.fillStyle = fabricColor;
    ctx.strokeStyle = '#2c3e50';
    ctx.beginPath();
    ctx.moveTo(-skullWidth * 0.8, skullCenterY + skullHeight * 0.4);
    ctx.quadraticCurveTo(-skullWidth * 1.5, skullCenterY - skullHeight * 0.5, -skullWidth * 0.6, skullCenterY - skullHeight * 0.7);
    ctx.quadraticCurveTo(-skullWidth * 0.4, skullCenterY - skullHeight * 0.3, -skullWidth * 0.9, skullCenterY + skullHeight * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(skullWidth * 0.8, skullCenterY + skullHeight * 0.4);
    ctx.quadraticCurveTo(skullWidth * 1.5, skullCenterY - skullHeight * 0.5, skullWidth * 0.6, skullCenterY - skullHeight * 0.7);
    ctx.quadraticCurveTo(skullWidth * 0.4, skullCenterY - skullHeight * 0.3, skullWidth * 0.9, skullCenterY + skullHeight * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Claws
    ctx.fillStyle = clawColor;
    ctx.strokeStyle = '#2d1e1c';
    // Left claw
    ctx.beginPath();
    ctx.moveTo(0, topGoldY);
    ctx.quadraticCurveTo(-skullWidth * 1.2, skullCenterY, -skullWidth * 0.4, skullCenterY - skullHeight * 0.8);
    ctx.quadraticCurveTo(-skullWidth * 0.2, skullCenterY - skullHeight, 0, skullCenterY - skullHeight * 0.7);
    ctx.quadraticCurveTo(0, skullCenterY, 0, topGoldY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Right claw
    ctx.beginPath();
    ctx.moveTo(0, topGoldY);
    ctx.quadraticCurveTo(skullWidth * 1.2, skullCenterY, skullWidth * 0.4, skullCenterY - skullHeight * 0.8);
    ctx.quadraticCurveTo(skullWidth * 0.2, skullCenterY - skullHeight, 0, skullCenterY - skullHeight * 0.7);
    ctx.quadraticCurveTo(0, skullCenterY, 0, topGoldY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Skull
    ctx.fillStyle = skullColor;
    ctx.strokeStyle = skullShadow;
    ctx.beginPath();
    ctx.moveTo(-skullWidth/2, skullCenterY + skullHeight/2);
    ctx.quadraticCurveTo(-skullWidth/2, skullCenterY - skullHeight/2, 0, skullCenterY - skullHeight/2);
    ctx.quadraticCurveTo(skullWidth/2, skullCenterY - skullHeight/2, skullWidth/2, skullCenterY + skullHeight/2);
    ctx.quadraticCurveTo(0, skullCenterY + skullHeight/2 + 2 * weaponSizeScale, -skullWidth/2, skullCenterY + skullHeight/2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Eye Sockets
    ctx.fillStyle = '#222';
    const eyeY = skullCenterY - skullHeight * 0.05;
    const eyeRadius = skullWidth * 0.2;
    ctx.beginPath();
    ctx.arc(-skullWidth * 0.25, eyeY, eyeRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(skullWidth * 0.25, eyeY, eyeRadius, 0, Math.PI * 2);
    ctx.fill();

    // Eye Glow
    const eyeGlowRadius = eyeRadius * 1.5;
    const eyeGlowGradientL = ctx.createRadialGradient(-skullWidth * 0.25, eyeY, eyeRadius * 0.1, -skullWidth * 0.25, eyeY, eyeGlowRadius);
    eyeGlowGradientL.addColorStop(0, '#fff');
    eyeGlowGradientL.addColorStop(0.3, eyeGlowColor);
    eyeGlowGradientL.addColorStop(1, 'rgba(89, 206, 255, 0)');
    ctx.fillStyle = eyeGlowGradientL;
    ctx.beginPath();
    ctx.arc(-skullWidth * 0.25, eyeY, eyeGlowRadius, 0, Math.PI * 2);
    ctx.fill();
    
    const eyeGlowGradientR = ctx.createRadialGradient(skullWidth * 0.25, eyeY, eyeRadius * 0.1, skullWidth * 0.25, eyeY, eyeGlowRadius);
    eyeGlowGradientR.addColorStop(0, '#fff');
    eyeGlowGradientR.addColorStop(0.3, eyeGlowColor);
    eyeGlowGradientR.addColorStop(1, 'rgba(89, 206, 255, 0)');
    ctx.fillStyle = eyeGlowGradientR;
    ctx.beginPath();
    ctx.arc(skullWidth * 0.25, eyeY, eyeGlowRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

export const drawNatureStaff = (ctx: CanvasRenderingContext2D, weaponSizeScale: number) => {
    const staffLength = 22 * weaponSizeScale;
    const staffWidth = 3 * weaponSizeScale;
    const orbRadius = 5 * weaponSizeScale;
    const headWidth = 10 * weaponSizeScale;
    const headHeight = 12 * weaponSizeScale;

    // Shaft
    ctx.fillStyle = '#6D4C41'; // Dark brown
    drawRoundedRect(ctx, -staffWidth / 2, -staffLength + headHeight, staffWidth, staffLength, 1 * weaponSizeScale);
    ctx.fill();
    ctx.stroke();

    // Twisted vines around shaft (simplified)
    ctx.strokeStyle = '#3E2723'; // Darker brown
    const originalLineWidth = ctx.lineWidth;
    ctx.lineWidth *= 0.7;
    ctx.beginPath();
    ctx.moveTo(0, -staffLength * 0.7);
    ctx.quadraticCurveTo(staffWidth, -staffLength * 0.5, 0, -staffLength * 0.3);
    ctx.quadraticCurveTo(-staffWidth, -staffLength * 0.1, 0, staffLength * 0.1);
    ctx.stroke();
    ctx.lineWidth = originalLineWidth;
    ctx.strokeStyle = '#4A3B31'; // Restore outline color

    // Head (claw) - inspired by the image
    ctx.fillStyle = '#424242'; // Dark grey metallic
    ctx.beginPath();
    // Left claw part
    ctx.moveTo(0, -staffLength + headHeight * 0.4);
    ctx.quadraticCurveTo(-headWidth * 0.7, -staffLength + headHeight * 0.6, -headWidth * 0.5, -staffLength);
    ctx.quadraticCurveTo(-headWidth * 0.2, -staffLength - headHeight * 0.2, 0, -staffLength);
    // Right claw part
    ctx.moveTo(0, -staffLength + headHeight * 0.4);
    ctx.quadraticCurveTo(headWidth * 0.7, -staffLength + headHeight * 0.6, headWidth * 0.5, -staffLength);
    ctx.quadraticCurveTo(headWidth * 0.2, -staffLength - headHeight * 0.2, 0, -staffLength);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing Orb
    const orbX = 0;
    const orbY = -staffLength + headHeight * 0.7;
    const glowRadius = orbRadius * 2.5;

    const gradient = ctx.createRadialGradient(orbX, orbY, orbRadius * 0.2, orbX, orbY, glowRadius);
    gradient.addColorStop(0, 'rgba(185, 246, 202, 1)'); // Light green center
    gradient.addColorStop(0.4, 'rgba(102, 187, 106, 0.8)');
    gradient.addColorStop(1, 'rgba(56, 142, 60, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(orbX, orbY, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    // Orb Core
    ctx.fillStyle = '#69F0AE'; // Bright green
    ctx.strokeStyle = '#B9F6CA';
    ctx.lineWidth = 1 * weaponSizeScale;
    ctx.beginPath();
    ctx.arc(orbX, orbY, orbRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
};

export const drawCorruptedHammer = (ctx: CanvasRenderingContext2D, weaponSizeScale: number) => {
    const handleLength = 25 * weaponSizeScale;
    const handleWidth = 4 * weaponSizeScale;
    const headWidth = 20 * weaponSizeScale;
    const headHeight = 14 * weaponSizeScale;
    const gemRadius = 4 * weaponSizeScale;

    const handleColor = '#6D4C41';
    const headColor = '#5B2C6F';
    const trimColor = '#F1C40F';
    const gemColor = '#2ECC71';
    const spikeColor = '#8E44AD';

    // Handle
    ctx.fillStyle = handleColor;
    drawRoundedRect(ctx, -handleWidth / 2, -handleLength, handleWidth, handleLength, 1 * weaponSizeScale);
    ctx.fill(); ctx.stroke();

    // Head
    const headY = -handleLength - headHeight / 2;
    ctx.fillStyle = headColor;
    drawRoundedRect(ctx, -headWidth / 2, headY, headWidth, headHeight, 2 * weaponSizeScale);
    ctx.fill(); ctx.stroke();

    // Center Gem & Glow
    const gemX = 0;
    const gemY = headY + headHeight / 2;
    const glowRadius = gemRadius * 2;
    const gradient = ctx.createRadialGradient(gemX, gemY, gemRadius * 0.2, gemX, gemY, glowRadius);
    gradient.addColorStop(0, `rgba(46, 204, 113, 1)`);
    gradient.addColorStop(1, `rgba(46, 204, 113, 0)`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(gemX, gemY, glowRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = gemColor;
    ctx.beginPath();
    ctx.arc(gemX, gemY, gemRadius, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    // Trim (simplified)
    ctx.strokeStyle = trimColor;
    const originalLineWidth = ctx.lineWidth;
    ctx.lineWidth *= 1.5;
    ctx.strokeRect(-headWidth / 2, headY, headWidth, headHeight);
    ctx.lineWidth = originalLineWidth;
    ctx.strokeStyle = '#4A3B31'; // Restore

    // Spikes (simplified)
    ctx.fillStyle = spikeColor;
    const spikeHeight = 6 * weaponSizeScale;
    const spikeY = headY;
    ctx.beginPath();
    ctx.moveTo(-headWidth * 0.4, spikeY);
    ctx.lineTo(-headWidth * 0.1, spikeY - spikeHeight);
    ctx.lineTo(-headWidth * 0.1, spikeY);
    ctx.closePath();
    ctx.fill();ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(headWidth * 0.4, spikeY);
    ctx.lineTo(headWidth * 0.1, spikeY - spikeHeight);
    ctx.lineTo(headWidth * 0.1, spikeY);
    ctx.closePath();
    ctx.fill();ctx.stroke();
};

export function drawBardLute(ctx: CanvasRenderingContext2D, weaponSizeScale: number) {
    // Colors inspired by the image
    const bodyColorLight = '#D98E4A';
    const bodyColorDark = '#8C5A32';
    const neckColor = '#4A2E1E';
    const goldColor = '#FFD700';
    const stringColor = '#E0E0E0';
    const headstockColor = '#212121';

    // Dimensions
    const bodyWidth = 20 * weaponSizeScale;
    const bodyHeight = 26 * weaponSizeScale;
    const neckLength = 22 * weaponSizeScale;
    const neckWidth = 4 * weaponSizeScale;
    const headstockHeight = 8 * weaponSizeScale;

    ctx.save();
    ctx.strokeStyle = '#2D1D0F';
    ctx.lineWidth = 1.5 * weaponSizeScale;

    // Body - simplified pear shape
    const bodyY = 0;
    const bodyGradient = ctx.createRadialGradient(0, bodyY, 5, 0, bodyY, bodyWidth * 0.7);
    bodyGradient.addColorStop(0, bodyColorLight);
    bodyGradient.addColorStop(1, bodyColorDark);
    ctx.fillStyle = bodyGradient;
    
    ctx.beginPath();
    ctx.ellipse(0, bodyY, bodyWidth / 2, bodyHeight / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Soundhole with gold trim
    const soundholeY = bodyY - bodyHeight * 0.2;
    ctx.fillStyle = goldColor;
    ctx.beginPath();
    ctx.arc(0, soundholeY, bodyWidth * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = neckColor;
    ctx.beginPath();
    ctx.arc(0, soundholeY, bodyWidth * 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Neck
    ctx.fillStyle = neckColor;
    const neckY = bodyY - bodyHeight / 2;
    drawRoundedRect(ctx, -neckWidth / 2, neckY - neckLength, neckWidth, neckLength, 1 * weaponSizeScale);
    ctx.fill();
    ctx.stroke();
    
    // Headstock
    ctx.fillStyle = headstockColor;
    const headstockY = neckY - neckLength;
    ctx.beginPath();
    ctx.moveTo(-neckWidth * 0.8, headstockY);
    ctx.lineTo(-neckWidth * 1.2, headstockY - headstockHeight);
    ctx.lineTo(neckWidth * 1.2, headstockY - headstockHeight);
    ctx.lineTo(neckWidth * 0.8, headstockY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Strings
    ctx.strokeStyle = stringColor;
    ctx.lineWidth = 0.5 * weaponSizeScale;
    const bridgeY = bodyY + bodyHeight * 0.3;
    for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 1.5 * weaponSizeScale, bridgeY);
        ctx.lineTo(i * 0.5 * weaponSizeScale, neckY);
        ctx.stroke();
    }
    
    ctx.restore();
}


export const drawRunicBlade = (ctx: CanvasRenderingContext2D, weaponSizeScale: number) => {
    const handleLength = 12 * weaponSizeScale;
    const handleWidth = 3.5 * weaponSizeScale;
    const bladeLength = 28 * weaponSizeScale;
    const bladeWidth = 7 * weaponSizeScale;
    const guardWidth = 16 * weaponSizeScale;
    const guardHeight = 12 * weaponSizeScale;
    const gemRadius = 3.5 * weaponSizeScale;

    // Colors
    const bladeColor = '#E8EAF6'; // Lighter silver
    const bladeOutline = '#546E7A';
    const handleColor = '#8D6E63'; // Brown
    const handleWrapColor = '#5D4037'; // Darker Brown
    const guardColor = '#B0BEC5'; // Silver-grey
    const gemColor = '#42A5F5'; // Blue
    const gemHighlight = '#BBDEFB'; // Light blue

    // Pommel
    ctx.fillStyle = guardColor;
    ctx.strokeStyle = bladeOutline;
    const pommelY = handleLength;
    const pommelWidth = 7 * weaponSizeScale;
    drawRoundedRect(ctx, -pommelWidth / 2, pommelY - (2 * weaponSizeScale), pommelWidth, 4 * weaponSizeScale, 2 * weaponSizeScale);
    ctx.fill();
    ctx.stroke();
    
    // Pommel Gem
    ctx.fillStyle = gemColor;
    ctx.beginPath();
    ctx.arc(0, pommelY - (0.5 * weaponSizeScale), gemRadius * 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = gemHighlight;
    ctx.beginPath();
    ctx.arc(-gemRadius * 0.2, pommelY - 1 * weaponSizeScale, gemRadius * 0.3, 0, Math.PI * 2);
    ctx.fill();


    // Handle
    ctx.fillStyle = handleColor;
    ctx.strokeStyle = bladeOutline;
    drawRoundedRect(ctx, -handleWidth / 2, 0, handleWidth, handleLength, 1 * weaponSizeScale);
    ctx.fill();
    ctx.stroke();

    // Handle Wrap Lines
    ctx.strokeStyle = handleWrapColor;
    const originalLineWidth = ctx.lineWidth;
    ctx.lineWidth *= 0.5;
    for (let i = 0; i < handleLength; i += handleWidth * 0.6) {
        ctx.beginPath();
        ctx.moveTo(-handleWidth / 2, i);
        ctx.lineTo(handleWidth / 2, i + handleWidth * 0.6);
        ctx.stroke();
    }
    ctx.lineWidth = originalLineWidth;


    // Blade
    ctx.fillStyle = bladeColor;
    ctx.strokeStyle = bladeOutline;
    ctx.beginPath();
    ctx.moveTo(0, -bladeLength); // Tip
    ctx.lineTo(bladeWidth / 2, -guardHeight * 0.2); // Right base
    ctx.lineTo(-bladeWidth / 2, -guardHeight * 0.2); // Left base
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Runes (simplified triangles)
    const runeY = -bladeLength * 0.6;
    const runeSize = bladeWidth * 0.15;
    for(let i = 0; i < 3; i++) {
        const currentRuneY = runeY + i * (runeSize * 3);
        ctx.beginPath();
        ctx.moveTo(0, currentRuneY - runeSize);
        ctx.lineTo(runeSize, currentRuneY + runeSize);
        ctx.lineTo(-runeSize, currentRuneY + runeSize);
        ctx.closePath();
        ctx.stroke();
    }


    // Guard
    ctx.fillStyle = guardColor;
    ctx.strokeStyle = bladeOutline;
    ctx.beginPath();
    // Right Wing
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(guardWidth * 0.4, -guardHeight * 0.6, guardWidth * 0.5, -guardHeight * 0.2);
    ctx.quadraticCurveTo(guardWidth * 0.3, guardHeight * 0.4, 0, guardHeight * 0.2);
    // Left Wing
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-guardWidth * 0.4, -guardHeight * 0.6, -guardWidth * 0.5, -guardHeight * 0.2);
    ctx.quadraticCurveTo(-guardWidth * 0.3, guardHeight * 0.4, 0, guardHeight * 0.2);
    ctx.fill();
    ctx.stroke();

    // Central Gem
    ctx.fillStyle = gemColor;
    ctx.beginPath();
    ctx.arc(0, -gemRadius * 0.2, gemRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = gemHighlight;
    ctx.beginPath();
    ctx.arc(-gemRadius * 0.3, -gemRadius * 0.5, gemRadius * 0.4, 0, Math.PI * 2);
    ctx.fill();
};

export function drawHeroCharacter(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    baseSize: number,
    direction: number,
    tiltAngle: number,
    lunge: number,
    combatStats: CombatStats & { weaponRepresentation?: string },
    equippedItems?: EquippedItems
) {
    ctx.save();
    // Translate and rotate based on animation state
    ctx.translate(x + (lunge * direction), y);
    ctx.rotate(tiltAngle);
    ctx.scale(direction, 1);

    // --- Start of drawing logic from HeroEntity ---
    const outlineColor = '#4A3B31';
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = baseSize * 0.06;

    const skinColor = combatStats.color || '#F0D6B5';
    const shirtColor = combatStats.bodyColor || '#4A80C0';
    const pantsColor = '#795548';
    const hairColor = '#6D4C41';
    const scarfColor = '#D32F2F';

    const headRadiusX = baseSize * 0.38;
    const headRadiusY = baseSize * 0.36;
    const bodyWidth = baseSize * 0.65;
    const bodyHeight = baseSize * 0.55;
    const armThickness = baseSize * 0.18;
    const handRadius = baseSize * 0.14;
    const legWidth = baseSize * 0.22;
    const legHeight = baseSize * 0.30;
    const scarfHeight = baseSize * 0.18;
    const eyeRadius = baseSize * 0.05;
    const hairOffsetX = baseSize * 0.02;
    const hairOffsetY = baseSize * 0.15;

    // Adjust Y positions to have feet at y=0 of the current translation
    const bodyCenterY = -legHeight - bodyHeight / 2;
    const legTopY = -legHeight;

    // Legs
    ctx.fillStyle = pantsColor;
    drawRoundedRect(ctx, -legWidth * 1.2, legTopY, legWidth, legHeight, legWidth * 0.4);
    ctx.fill(); ctx.stroke();
    drawRoundedRect(ctx, legWidth * 0.2, legTopY, legWidth, legHeight, legWidth * 0.4);
    ctx.fill(); ctx.stroke();
    
    // Body
    ctx.fillStyle = shirtColor;
    drawRoundedRect(ctx, -bodyWidth / 2, bodyCenterY - bodyHeight / 2, bodyWidth, bodyHeight, baseSize * 0.1);
    ctx.fill(); ctx.stroke();
    
    // Arms and Hands
    const shoulderY = bodyCenterY - bodyHeight / 3;
    const armLength = baseSize * 0.3;

    // Non-weapon arm (on the left side when direction is 1)
    ctx.fillStyle = skinColor;
    ctx.strokeStyle = shirtColor;
    ctx.lineWidth = armThickness;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-bodyWidth/2 + (baseSize * 0.05), shoulderY); 
    ctx.lineTo(-bodyWidth/2 - armLength, shoulderY + armLength * 0.8); 
    ctx.stroke(); 
    
    ctx.fillStyle = skinColor;
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = baseSize * 0.06;
    ctx.beginPath();
    ctx.arc(-bodyWidth/2 - armLength, shoulderY + armLength * 0.8, handRadius, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.lineCap = 'butt';

    // Weapon Arm
    const weaponHandX = bodyWidth/2 + (baseSize*0.05);
    const weaponHandY = shoulderY + armLength * 0.2;
    ctx.fillStyle = skinColor;
    ctx.strokeStyle = shirtColor;
    ctx.lineWidth = armThickness;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(bodyWidth/2 - (baseSize * 0.05) , shoulderY);
    ctx.lineTo(weaponHandX, weaponHandY);
    ctx.stroke(); 
 
    ctx.fillStyle = skinColor;
    ctx.strokeStyle = outlineColor; 
    ctx.lineWidth = baseSize * 0.06;
    ctx.beginPath();
    ctx.arc(weaponHandX, weaponHandY, handRadius, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.lineCap = 'butt';

    // Scarf
    const scarfYPos = bodyCenterY - bodyHeight / 2 - scarfHeight / 2 + baseSize * 0.04;
    ctx.fillStyle = scarfColor;
    drawRoundedRect(ctx, -bodyWidth * 0.4, scarfYPos, bodyWidth * 0.8, scarfHeight, baseSize * 0.05);
    ctx.fill(); ctx.stroke();

    // Head
    const headRelativeY = scarfYPos - headRadiusY + baseSize * 0.02; 
    ctx.fillStyle = skinColor;
    ctx.beginPath();
    ctx.ellipse(0, headRelativeY, headRadiusX, headRadiusY, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Hair
    ctx.fillStyle = hairColor;
    ctx.beginPath();
    const hairTopRelY = headRelativeY - headRadiusY * 0.5;
    const hairBottomRelY = headRelativeY + headRadiusY * 0.3;
    ctx.moveTo(-headRadiusX * 0.9 + hairOffsetX, hairBottomRelY);
    ctx.quadraticCurveTo(-headRadiusX * 1.1 + hairOffsetX, hairTopRelY - hairOffsetY, 0 + hairOffsetX, hairTopRelY - hairOffsetY * 1.5);
    ctx.quadraticCurveTo(headRadiusX * 1.1 + hairOffsetX, hairTopRelY - hairOffsetY, headRadiusX * 0.9 + hairOffsetX, hairBottomRelY);
    ctx.quadraticCurveTo(0 + hairOffsetX, headRelativeY + headRadiusY * 0.6, -headRadiusX * 0.9 + hairOffsetX, hairBottomRelY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Eyes
    ctx.fillStyle = outlineColor; 
    const eyeRelY = headRelativeY - baseSize * 0.03; 
    const eyeSpacing = headRadiusX * 0.35;
    ctx.beginPath();
    ctx.arc(-eyeSpacing, eyeRelY, eyeRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(eyeSpacing, eyeRelY, eyeRadius, 0, Math.PI * 2);
    ctx.fill();

    // Weapon Drawing Logic
    ctx.save();
    ctx.translate(weaponHandX, weaponHandY);

    const weaponName = equippedItems?.weapon?.name;
    const weaponType = combatStats.weaponRepresentation;
    const weaponSizeScale = baseSize / 20;

    if (weaponName === 'Cajado do Necromante') {
        ctx.rotate(Math.PI / 8);
        drawNecromancerStaff(ctx, weaponSizeScale);
    } else if (weaponName === 'Cajado da Natureza') {
        ctx.rotate(Math.PI / 8);
        drawNatureStaff(ctx, weaponSizeScale);
    } else if (weaponType === 'sword' || weaponType === 'axe') {
        ctx.rotate(Math.PI / 5);
        drawRunicBlade(ctx, weaponSizeScale);
    } else if (weaponType === 'dagger') {
        ctx.rotate(Math.PI / 5);
        const daggerLength = 10 * weaponSizeScale;
        const daggerWidth = 2.5 * weaponSizeScale;
        ctx.fillStyle = '#B0BEC5';
        drawRoundedRect(ctx, -daggerWidth/2, -daggerLength, daggerWidth, daggerLength, daggerWidth*0.3);
        ctx.fill(); ctx.stroke();
    } else if (weaponType === 'bow') {
        ctx.rotate(Math.PI / 2.5);
        ctx.strokeStyle = '#8D6E63';
        const originalLineWidth = ctx.lineWidth;
        ctx.lineWidth = 2 * weaponSizeScale;
        const bowRadius = 10 * weaponSizeScale;
        ctx.beginPath();
        ctx.arc(0, 0, bowRadius, Math.PI * 0.8, Math.PI * 2.2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(bowRadius * Math.cos(Math.PI*0.8), bowRadius * Math.sin(Math.PI*0.8));
        ctx.lineTo(bowRadius * Math.cos(Math.PI*2.2), bowRadius * Math.sin(Math.PI*2.2));
        ctx.stroke();
        ctx.lineWidth = originalLineWidth;
        ctx.strokeStyle = outlineColor;
    } else if (weaponType === 'hammer') {
        ctx.rotate(Math.PI / 5);
        drawCorruptedHammer(ctx, weaponSizeScale);
    } else if (weaponType === 'lute') {
        ctx.rotate(Math.PI / 4);
        ctx.translate(0, -5 * weaponSizeScale);
        drawBardLute(ctx, weaponSizeScale * 0.8);
    } else if (weaponType === 'staff') {
        ctx.rotate(Math.PI / 8);
        const staffLength = 18 * weaponSizeScale;
        const staffWidth = 2.5 * weaponSizeScale;
        const gemRadius = 4 * weaponSizeScale;
        ctx.fillStyle = '#A1887F';
        drawRoundedRect(ctx, -staffWidth/2, -staffLength + gemRadius, staffWidth, staffLength,1*weaponSizeScale);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = combatStats.color || '#4FC3F7';
        ctx.beginPath();
        ctx.arc(0, -staffLength + gemRadius*0.8, gemRadius, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
    } else if (weaponType === 'shield') {
        const shieldW = 12 * weaponSizeScale;
        const shieldH = 15 * weaponSizeScale;
        const shieldOffsetX = -shieldW * 0.3;
        ctx.fillStyle = '#A1887F';
        drawRoundedRect(ctx, -shieldW/2 + shieldOffsetX, -shieldH*0.7, shieldW, shieldH, 3*weaponSizeScale);
        ctx.fill();ctx.stroke();
    }
    ctx.restore(); // Restore from weapon hand translation

    // Undo scaling and translation for the character drawing
    ctx.restore();
}

export function drawTree(ctx: CanvasRenderingContext2D, scenery: TreeSceneryElement) {
    ctx.save();
    ctx.globalAlpha = scenery.alpha;

    const { x, y, size, biomeName } = scenery;

    const trunkHeightRatio = 0.4;
    const trunkWidthRatio = 0.15;
    const foliageHeightRatio = 0.6;

    const fSize = Math.floor(size);
    const fX = Math.floor(x);
    const fY = Math.floor(y);

    const fTrunkHeight = Math.floor(fSize * trunkHeightRatio);
    const fTrunkWidth = Math.floor(fSize * trunkWidthRatio);
    const fFoliageHeight = Math.floor(fSize * foliageHeightRatio);

    const fTrunkX = Math.floor(fX - fTrunkWidth / 2);
    const fTrunkY = Math.floor(fY - fTrunkHeight);

    switch (biomeName) {
        case 'FLORESTA':
            const foliageColor = `rgba(60, 145, 90, ${scenery.alpha})`;
            const foliageHighlight = `rgba(100, 180, 120, ${scenery.alpha})`;
            const trunkColor = `rgba(100, 60, 20, ${scenery.alpha})`;
            const outlineColor = `rgba(40, 60, 40, ${scenery.alpha * 0.8})`;

            // Trunk
            ctx.fillStyle = trunkColor;
            ctx.strokeStyle = outlineColor;
            ctx.lineWidth = 2;
            drawRoundedRect(ctx, fTrunkX, fTrunkY, fTrunkWidth, fTrunkHeight, 3);
            ctx.fill();
            ctx.stroke();

            // Foliage
            ctx.fillStyle = foliageColor;
            const foliageY = fY - fTrunkHeight - (fFoliageHeight * 0.6);
            const foliageRadius = fSize * 0.4;
            ctx.beginPath();
            ctx.ellipse(fX, foliageY, foliageRadius, foliageRadius * 1.1, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Highlight
            ctx.fillStyle = foliageHighlight;
            ctx.beginPath();
            ctx.ellipse(fX - foliageRadius * 0.2, foliageY - foliageRadius * 0.2, foliageRadius * 0.7, foliageRadius * 0.8, -Math.PI / 4, 0, Math.PI * 2);
            ctx.fill();
            break;
        case 'NEVE':
            const fSnowFoliageWidth = Math.floor(fSize * 0.4);
            ctx.fillStyle = `rgba(80, 50, 10, ${scenery.alpha})`;
            ctx.fillRect(fTrunkX, fTrunkY, fTrunkWidth, fTrunkHeight);

            const snowFoliageColor = `rgba(0, 100, 0, ${scenery.alpha * 0.9})`;
            const snowColor = `rgba(240, 248, 255, ${scenery.alpha})`;

            ctx.fillStyle = snowFoliageColor;
            ctx.beginPath();
            ctx.moveTo(Math.floor(fX - fSnowFoliageWidth * 0.8), Math.floor(fY - fTrunkHeight));
            ctx.lineTo(Math.floor(fX + fSnowFoliageWidth * 0.8), Math.floor(fY - fTrunkHeight));
            ctx.lineTo(fX, Math.floor(fY - fTrunkHeight - fFoliageHeight * 1.5));
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = snowColor;
            const fSnowLayerHeight = Math.floor(fFoliageHeight * 0.3);
            ctx.beginPath();
            ctx.ellipse(fX, Math.floor(fY - fTrunkHeight - fFoliageHeight * 0.2), Math.floor(fSnowFoliageWidth * 0.7), fSnowLayerHeight, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(fX, Math.floor(fY - fTrunkHeight - fFoliageHeight * 0.7), Math.floor(fSnowFoliageWidth * 0.5), Math.floor(fSnowLayerHeight * 0.8), 0, 0, Math.PI * 2);
            ctx.fill();
            break;
        case 'DESERTO':
            const cactusColor = `rgba(60, 179, 113, ${scenery.alpha})`;
            const cactusOutlineColor = `rgba(46, 139, 87, ${scenery.alpha * 1.2})`;

            const fMainBodyWidth = Math.floor(fSize * 0.3);
            const fMainBodyHeight = Math.floor(fSize * 0.7);
            const fMainBodyX = Math.floor(fX - fMainBodyWidth / 2);
            const fMainBodyY = Math.floor(fY - fMainBodyHeight);

            ctx.fillStyle = cactusColor;
            ctx.strokeStyle = cactusOutlineColor;
            ctx.lineWidth = 2;

            drawRoundedRect(ctx, fMainBodyX, fMainBodyY, fMainBodyWidth, fMainBodyHeight, Math.floor(fMainBodyWidth * 0.3));
            ctx.fill();
            ctx.stroke();

            const numArms = scenery.cactus?.numArms || 0;
            const fArmWidth = Math.floor(fMainBodyWidth * 0.7);

            if (numArms >= 1 && scenery.cactus?.arm1) {
                const fArm1Height = Math.floor(fMainBodyHeight * scenery.cactus.arm1.heightRatio);
                const fArm1X = Math.floor(fMainBodyX - fArmWidth * 0.7);
                const fArm1Y = Math.floor(fMainBodyY + fMainBodyHeight * scenery.cactus.arm1.yOffsetRatio);
                drawRoundedRect(ctx, fArm1X, fArm1Y, fArmWidth, fArm1Height, Math.floor(fArmWidth * 0.4));
                ctx.fill();
                ctx.stroke();
                const fArm1TipX = Math.floor(fArm1X + fArmWidth / 2);
                const fArm1TipY = Math.floor(fArm1Y - fArm1Height * 0.3);
                drawRoundedRect(ctx, Math.floor(fArm1TipX - fArmWidth*0.35), fArm1TipY, Math.floor(fArmWidth*0.7), Math.floor(fArm1Height*0.6), Math.floor(fArmWidth*0.2));
                ctx.fill();
                ctx.stroke();
            }
            if (numArms === 2 && scenery.cactus?.arm2) {
                const fArm2Height = Math.floor(fMainBodyHeight * scenery.cactus.arm2.heightRatio);
                const fArm2X = Math.floor(fMainBodyX + fMainBodyWidth - fArmWidth * 0.3);
                const fArm2Y = Math.floor(fMainBodyY + fMainBodyHeight * scenery.cactus.arm2.yOffsetRatio);
                drawRoundedRect(ctx, fArm2X, fArm2Y, fArmWidth, fArm2Height, Math.floor(fArmWidth * 0.4));
                ctx.fill();
                ctx.stroke();
                const fArm2TipX = Math.floor(fArm2X + fArmWidth / 2);
                const fArm2TipY = Math.floor(fArm2Y - fArm2Height * 0.3);
                drawRoundedRect(ctx, Math.floor(fArm2TipX - fArmWidth*0.35), fArm2TipY, Math.floor(fArmWidth*0.7), Math.floor(fArm2Height*0.6), Math.floor(fArmWidth*0.2));
                ctx.fill();
                ctx.stroke();
            }
            break;
        case 'PANTANO':
            const bushColor = `rgba(46, 139, 87, ${scenery.alpha * 0.9})`; // Seagreen
            const bushHighlight = `rgba(60, 179, 113, ${scenery.alpha})`; // Medium seagreen
            
            ctx.fillStyle = bushColor;
            ctx.beginPath();
            ctx.ellipse(fX, fY, fSize * 0.5, fSize * 0.35, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = bushHighlight;
            ctx.beginPath();
            ctx.ellipse(fX - fSize * 0.1, fY - fSize * 0.1, fSize * 0.3, fSize * 0.2, Math.PI / 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(fX + fSize * 0.15, fY, fSize * 0.35, fSize * 0.25, -Math.PI / 6, 0, Math.PI * 2);
            ctx.fill();
            break;
        default: // Fallback or generic tree
            ctx.fillStyle = `rgba(139, 69, 19, ${scenery.alpha})`; // Brown trunk
            ctx.fillRect(fTrunkX, fTrunkY, fTrunkWidth, fTrunkHeight);
            ctx.fillStyle = `rgba(0, 128, 0, ${scenery.alpha})`; // Green foliage
            ctx.beginPath();
            ctx.arc(fX, Math.floor(fY - fTrunkHeight - fFoliageHeight / 2), Math.floor(fSize * 0.4 * (scenery.foliageWidthMultiplier || 1)) , 0, Math.PI * 2);
            ctx.fill();
            break;
    }
    ctx.restore();
}

export function drawPineTree(ctx: CanvasRenderingContext2D, scenery: PineTreeSceneryElement) {
    ctx.save();
    ctx.globalAlpha = scenery.alpha;

    const { x, y, size } = scenery;
    const fX = Math.floor(x);
    const fY = Math.floor(y);
    const fSize = Math.floor(size);

    const trunkColor = `rgba(80, 50, 10, ${scenery.alpha})`;
    const foliageColor = `rgba(30, 90, 50, ${scenery.alpha})`;
    const foliageHighlight = `rgba(50, 120, 70, ${scenery.alpha})`;
    const outlineColor = `rgba(20, 40, 20, ${scenery.alpha * 0.8})`;

    // Trunk
    const fTrunkWidth = Math.floor(fSize * 0.15);
    const fTrunkHeight = Math.floor(fSize * 0.2);
    const fTrunkX = Math.floor(fX - fTrunkWidth / 2);
    const fTrunkY = Math.floor(fY - fTrunkHeight);
    ctx.fillStyle = trunkColor;
    ctx.fillRect(fTrunkX, fTrunkY, fTrunkWidth, fTrunkHeight);

    // Foliage tiers
    const tiers = 3;
    const tierHeight = (fSize * 0.8) / tiers;
    for (let i = 0; i < tiers; i++) {
        const tierY = fTrunkY - (i * tierHeight * 0.7);
        const tierWidth = fSize * 0.6 * (1 - i * 0.2);
        
        ctx.fillStyle = foliageColor;
        ctx.strokeStyle = outlineColor;
        ctx.lineWidth = 1.5;
        
        ctx.beginPath();
        ctx.moveTo(fX, tierY - tierHeight);
        ctx.lineTo(fX - tierWidth / 2, tierY);
        ctx.lineTo(fX + tierWidth / 2, tierY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Highlight
        ctx.fillStyle = foliageHighlight;
        ctx.beginPath();
        ctx.moveTo(fX, tierY - tierHeight);
        ctx.lineTo(fX - tierWidth / 2, tierY);
        ctx.lineTo(fX, tierY);
        ctx.closePath();
        ctx.fill();
    }

    ctx.restore();
}

export function drawPuddle(ctx: CanvasRenderingContext2D, scenery: PuddleSceneryElement) {
    if (!scenery.points || scenery.points.length < 3) return;
    ctx.save();
    ctx.globalAlpha = scenery.alpha;
    
    const { x, y } = scenery;
    const waterColor = `rgba(135, 206, 250, ${scenery.alpha * 0.6})`;
    const waterEdge = `rgba(100, 180, 220, ${scenery.alpha * 0.8})`;

    // Main water body
    ctx.beginPath();
    ctx.moveTo(x + scenery.points[0].dx, y + scenery.points[0].dy);
    for (let i = 1; i < scenery.points.length; i++) {
        const p = scenery.points[i];
        const prev = scenery.points[i-1];
        const xc = (p.dx + prev.dx) / 2;
        const yc = (p.dy + prev.dy) / 2;
        ctx.quadraticCurveTo(x + prev.dx, y + prev.dy, x + xc, y + yc);
    }
    const last = scenery.points[scenery.points.length-1];
    const first = scenery.points[0];
    const xc = (last.dx + first.dx) / 2;
    const yc = (last.dy + first.dy) / 2;
    ctx.quadraticCurveTo(x + last.dx, y + last.dy, x + xc, y + yc);

    ctx.closePath();
    ctx.fillStyle = waterColor;
    ctx.fill();

    // Edge highlight
    ctx.strokeStyle = waterEdge;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Water shine
    ctx.fillStyle = `rgba(255, 255, 255, ${scenery.alpha * 0.3})`;
    ctx.beginPath();
    ctx.ellipse(x, y - scenery.size * 0.1, scenery.size * 0.3, scenery.size * 0.15, -Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

export function drawFlower(ctx: CanvasRenderingContext2D, scenery: FlowerSceneryElement) {
    ctx.save();
    ctx.globalAlpha = scenery.alpha;

    const { x, y, size, flowerType } = scenery;
    const petalColor = flowerType === 'pink' ? '#FFC0CB' : '#FFFFFF';
    const centerColor = '#FFD700'; // Gold
    const stemColor = '#006400'; // DarkGreen
    const outlineColor = `rgba(0, 0, 0, ${scenery.alpha * 0.4})`;

    // Stem
    ctx.strokeStyle = stemColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - size);
    ctx.stroke();

    // Petals
    const numPetals = 5;
    const headY = y - size;
    ctx.fillStyle = petalColor;
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 0.5;
    for (let i = 0; i < numPetals; i++) {
        const angle = (i / numPetals) * Math.PI * 2;
        const petalX = x + Math.cos(angle) * size * 0.4;
        const petalY = headY + Math.sin(angle) * size * 0.4;
        ctx.beginPath();
        ctx.arc(petalX, petalY, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }

    // Center
    ctx.fillStyle = centerColor;
    ctx.beginPath();
    ctx.arc(x, headY, size * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
}

export function drawRock(ctx: CanvasRenderingContext2D, scenery: RockSceneryElement) {
    ctx.save();
    ctx.globalAlpha = scenery.alpha;

    const { x, y, size, biomeName, rockPoints } = scenery;
    const fX = Math.floor(x);
    const fY = Math.floor(y);
    const fSize = Math.floor(size);


    let baseColor = `rgba(128, 128, 128, ${scenery.alpha})`; // Default grey
    let highlightColor = `rgba(169, 169, 169, ${scenery.alpha})`;
    let shadowColor = `rgba(105, 105, 105, ${scenery.alpha})`;

    switch (biomeName) {
        case 'FLORESTA':
            baseColor = `rgba(112, 128, 144, ${scenery.alpha})`; // Slate grey
            highlightColor = `rgba(119, 136, 153, ${scenery.alpha * 0.8})`;
            shadowColor = `rgba(70, 80, 90, ${scenery.alpha})`;
            break;
        case 'NEVE':
            baseColor = `rgba(176, 196, 222, ${scenery.alpha})`; // Light steel blue
            highlightColor = `rgba(220, 220, 220, ${scenery.alpha * 0.9})`; // Gainsboro
            shadowColor = `rgba(119, 136, 153, ${scenery.alpha})`; // Light slate grey
            break;
        case 'DESERTO':
            baseColor = `rgba(188, 143, 143, ${scenery.alpha})`; // Rosy brown
            highlightColor = `rgba(210, 180, 140, ${scenery.alpha * 0.8})`; // Tan
            shadowColor = `rgba(139, 69, 19, ${scenery.alpha * 0.7})`; // Saddle brown
            break;
    }

    if (!rockPoints || rockPoints.length < 3) {
        // Not enough points to draw a polygon
        ctx.restore();
        return;
    }

    // Main rock shape
    ctx.beginPath();
    ctx.moveTo(Math.floor(fX + rockPoints[0].dx), Math.floor(fY + rockPoints[0].dy));
    for (let i = 1; i < rockPoints.length; i++) {
        ctx.lineTo(Math.floor(fX + rockPoints[i].dx), Math.floor(fY + rockPoints[i].dy));
    }
    ctx.closePath();

    ctx.fillStyle = baseColor;
    ctx.fill();

    // Highlight
    ctx.fillStyle = highlightColor;
    ctx.beginPath();
    // Simple highlight on top-left-ish facets
    ctx.moveTo(Math.floor(fX + rockPoints[0].dx), Math.floor(fY + rockPoints[0].dy - fSize*0.03));
    ctx.lineTo(Math.floor(fX + rockPoints[1].dx - fSize*0.03), Math.floor(fY + rockPoints[1].dy - fSize*0.03));
    ctx.lineTo(Math.floor(fX + rockPoints[2].dx), Math.floor(fY + rockPoints[2].dy)); // Example, adjust points as needed
    ctx.closePath();
    ctx.fill();

    // Shadow
    ctx.fillStyle = shadowColor;
    ctx.beginPath();
    // Simple shadow on bottom-right-ish facets
    const numRockPoints = rockPoints.length;
    ctx.moveTo(Math.floor(fX + rockPoints[numRockPoints-1].dx), Math.floor(fY + rockPoints[numRockPoints-1].dy + fSize*0.03));
    ctx.lineTo(Math.floor(fX + rockPoints[numRockPoints-2].dx + fSize*0.03), Math.floor(fY + rockPoints[numRockPoints-2].dy + fSize*0.03));
    ctx.lineTo(Math.floor(fX + rockPoints[numRockPoints-3].dx), Math.floor(fY + rockPoints[numRockPoints-3].dy)); // Example
    ctx.closePath();
    ctx.fill();

    if (biomeName === 'PANTANO') {
        ctx.fillStyle = `rgba(85, 107, 47, ${scenery.alpha * 0.6})`; // DarkOliveGreen slime
        ctx.beginPath();
        // A simple dripping shape on top
        ctx.moveTo(fX - fSize * 0.4, fY - fSize * 0.3);
        ctx.bezierCurveTo(
            fX - fSize * 0.5, fY,
            fX + fSize * 0.5, fY,
            fX + fSize * 0.4, fY - fSize * 0.3
        );
        // Drip 1
        ctx.bezierCurveTo(
            fX + fSize * 0.3, fY + fSize * 0.1,
            fX + fSize * 0.1, fY + fSize * 0.3,
            fX, fY + fSize * 0.1
        );
        // Drip 2
        ctx.bezierCurveTo(
            fX - fSize * 0.1, fY + fSize * 0.3,
            fX - fSize * 0.3, fY + fSize * 0.1,
            fX - fSize * 0.4, fY - fSize * 0.3
        );
        ctx.closePath();
        ctx.fill();
    }

    // Outline
    ctx.strokeStyle = `rgba(50, 50, 50, ${scenery.alpha * 0.4})`; // Darker outline
    ctx.lineWidth = 1;

    // Re-stroke the main polygon shape using floored coordinates
    ctx.beginPath();
    ctx.moveTo(Math.floor(fX + rockPoints[0].dx), Math.floor(fY + rockPoints[0].dy));
    for (let i = 1; i < rockPoints.length; i++) {
        ctx.lineTo(Math.floor(fX + rockPoints[i].dx), Math.floor(fY + rockPoints[i].dy));
    }
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
}

export function drawRiver(ctx: CanvasRenderingContext2D, scenery: RiverSceneryElement) {
    if (!scenery.path || scenery.path.length < 2) return;

    ctx.save();
    
    const waterColor = `rgba(85, 107, 47, 0.7)`; // DarkOliveGreen
    const bankColor = `rgba(67, 89, 27, 0.8)`;  // Darker green for banks

    // Draw river banks first (wider line)
    ctx.strokeStyle = bankColor;
    ctx.lineWidth = scenery.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(scenery.path[0].x, scenery.path[0].y);
    for (let i = 0; i < scenery.path.length - 2; i++) {
        const xc = (scenery.path[i].x + scenery.path[i + 1].x) / 2;
        const yc = (scenery.path[i].y + scenery.path[i + 1].y) / 2;
        ctx.quadraticCurveTo(scenery.path[i].x, scenery.path[i].y, xc, yc);
    }
    // For the last segment, curve to the last point
    const last = scenery.path.length - 1;
    ctx.quadraticCurveTo(scenery.path[last-1].x, scenery.path[last-1].y, scenery.path[last].x, scenery.path[last].y);
    ctx.stroke();

    // Draw main water body (thinner line on top)
    ctx.strokeStyle = waterColor;
    ctx.lineWidth = scenery.width * 0.8; // slightly thinner
    ctx.beginPath();
    ctx.moveTo(scenery.path[0].x, scenery.path[0].y);
    for (let i = 0; i < scenery.path.length - 2; i++) {
        const xc = (scenery.path[i].x + scenery.path[i + 1].x) / 2;
        const yc = (scenery.path[i].y + scenery.path[i + 1].y) / 2;
        ctx.quadraticCurveTo(scenery.path[i].x, scenery.path[i].y, xc, yc);
    }
    const last2 = scenery.path.length - 1;
    ctx.quadraticCurveTo(scenery.path[last2-1].x, scenery.path[last2-1].y, scenery.path[last2].x, scenery.path[last2].y);
    ctx.stroke();
    
    ctx.restore();
}

export function drawArrow(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, angle: number, fletchingColor: string) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    const length = 18; // total length
    const headL = 6;
    const headW = 5;

    // Fletching
    ctx.beginPath();
    ctx.moveTo(-length/2, 0);
    ctx.lineTo(-length/2-5, 3);
    ctx.moveTo(-length/2, 0);
    ctx.lineTo(-length/2-5, -3);
    ctx.strokeStyle = fletchingColor;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Shaft
    ctx.beginPath();
    ctx.moveTo(-length/2, 0);
    ctx.lineTo(length/2, 0);
    ctx.strokeStyle = '#A1887F'; // Brownish-grey
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Head
    ctx.beginPath();
    ctx.moveTo(length/2, 0);
    ctx.lineTo(length/2 - headL, headW);
    ctx.lineTo(length/2 - headL, -headW);
    ctx.closePath();
    ctx.fillStyle = '#546E7A'; // Slate-grey
    ctx.fill();

    ctx.restore();
}

export function drawMagicOrb(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
    ctx.save();
    ctx.translate(x, y);

    const coreRadius = size * 0.6;
    const glowRadius = size * (1.2 + Math.sin(Date.now() * 0.005) * 0.3); // Pulsating glow
    const particleOrbitRadius = size * 1.5;
    const numParticles = 3;

    // Outer glow
    const gradient = ctx.createRadialGradient(0, 0, coreRadius * 0.5, 0, 0, glowRadius);
    gradient.addColorStop(0, `rgba(255, 255, 255, 0.8)`);
    gradient.addColorStop(0.5, `${color}88`); // Semi-transparent color
    gradient.addColorStop(1, `${color}00`); // Fully transparent
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    // Core
    ctx.fillStyle = color;
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, coreRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Orbiting particles
    ctx.fillStyle = 'white';
    for (let i = 0; i < numParticles; i++) {
        const angle = (Date.now() * 0.001) + (i * (Math.PI * 2 / numParticles));
        const px = Math.cos(angle) * particleOrbitRadius;
        const py = Math.sin(angle) * particleOrbitRadius * 0.5; // Elliptical orbit
        const pSize = size * 0.2 * (0.8 + Math.sin(angle * 2) * 0.2);
        ctx.beginPath();
        ctx.arc(px, py, pSize, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

export function drawSkullOrb(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
    ctx.save();
    ctx.translate(x, y);

    const coreSize = size;
    const glowRadius = coreSize * 2.5;

    // Outer glow based on the provided image
    const glowColor = '#003300'; // Very dark green
    const gradient = ctx.createRadialGradient(0, 0, coreSize * 0.5, 0, 0, glowRadius);
    gradient.addColorStop(0, `${color}80`); // Center is the orb color but transparent
    gradient.addColorStop(0.5, `${glowColor}99`);
    gradient.addColorStop(1, `${glowColor}00`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    // Skull itself
    const skullColor = color;
    ctx.fillStyle = skullColor;
    
    // Main skull shape (a bit like a wide "U" with a top)
    const w = coreSize * 1.4;
    const h = coreSize * 1.5;
    ctx.beginPath();
    ctx.moveTo(-w / 2, -h * 0.1);
    ctx.quadraticCurveTo(0, -h / 2, w / 2, -h * 0.1); // Top curve
    ctx.quadraticCurveTo(w / 2, h / 2, 0, h / 2); // Bottom right
    ctx.quadraticCurveTo(-w / 2, h / 2, -w / 2, -h * 0.1); // Bottom left
    ctx.closePath();
    ctx.fill();

    // Eyes and nose
    ctx.fillStyle = '#001a00'; // Even darker green for sockets
    const eyeW = w * 0.25;
    const eyeH = h * 0.3;
    const eyeY = -h * 0.05;
    const eyeX = w * 0.22;
    
    // Left Eye
    ctx.beginPath();
    ctx.ellipse(-eyeX, eyeY, eyeW, eyeH, -0.2, 0, Math.PI * 2);
    ctx.fill();
    
    // Right Eye
    ctx.beginPath();
    ctx.ellipse(eyeX, eyeY, eyeW, eyeH, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Nose
    const noseY = h * 0.25;
    const noseW = w * 0.15;
    const noseH = h * 0.15;
    ctx.beginPath();
    ctx.moveTo(0, noseY - noseH / 2);
    ctx.lineTo(-noseW, noseY + noseH / 2);
    ctx.lineTo(noseW, noseY + noseH / 2);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}
