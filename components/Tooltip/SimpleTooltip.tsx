import React from 'react';

interface SimpleTooltipProps {
  text: string | null;
  visible: boolean;
  position: { x: number; y: number };
}

const SimpleTooltip: React.FC<SimpleTooltipProps> = ({ text, visible, position }) => {
  if (!visible || !text) {
    return null;
  }

  const tooltipWidth = 200; // Adjust as needed
  const tooltipHeightEstimate = 50; // Rough estimate

  let x = position.x + 15;
  let y = position.y + 15;

  if (typeof window !== 'undefined') {
    if (x + tooltipWidth > window.innerWidth) {
      x = position.x - tooltipWidth - 15;
    }
    if (y + tooltipHeightEstimate > window.innerHeight) {
      y = position.y - tooltipHeightEstimate - 5;
    }
    if (x < 0) x = 5;
    if (y < 0) y = 5;
  }

  return (
    <div
      className="fixed p-2.5 rounded-md shadow-xl bg-brand-card border border-brand-primary text-xs text-text-light z-[110] transition-opacity duration-100 pointer-events-none"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        opacity: visible ? 1 : 0,
        maxWidth: `${tooltipWidth}px`,
      }}
      role="tooltip"
    >
      {text}
    </div>
  );
};

export default SimpleTooltip;
