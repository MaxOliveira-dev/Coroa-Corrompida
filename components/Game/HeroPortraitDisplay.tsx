import React, { useRef, useEffect } from 'react';
import type { CombatStats, EquippedItems } from '../../types';
import { drawHeroCharacter } from './drawingUtils';

interface HeroPortraitDisplayProps {
  heroClassData: CombatStats & { weaponName?: string, weaponRepresentation?: string };
  width?: number;
  height?: number;
  baseSize?: number;
}

const HeroPortraitDisplay: React.FC<HeroPortraitDisplayProps> = ({ 
  heroClassData, 
  width = 70, 
  height = 70,
  baseSize = 35 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !heroClassData) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const canvasCenterX = canvas.width / 2;

    // Construct a minimal EquippedItems object for the drawing function
    // FIX: Replaced invalid 'ring' property with 'insignia' to match the EquippedItems type.
    const equippedItemsForDrawing: EquippedItems = {
        weapon: heroClassData.weaponName ? { name: heroClassData.weaponName, type: heroClassData.weaponRepresentation || 'unarmed', icon: '' } : null,
        armor: null, insignia: null, enchantment: null
    };

    // Call the centralized drawing function
    drawHeroCharacter(
        ctx,
        canvasCenterX,
        canvas.height - baseSize * 0.5, // Y-offset to position character at the bottom
        baseSize,
        1, // direction (always face forward for portraits)
        0, // tiltAngle (no tilt for portraits)
        0, // lunge (no lunge for portraits)
        heroClassData,
        equippedItemsForDrawing
    );
    
  }, [heroClassData, width, height, baseSize]); 

  return <canvas ref={canvasRef} width={width} height={height}></canvas>;
};

export default HeroPortraitDisplay;