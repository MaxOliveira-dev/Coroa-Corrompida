/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./gameData/**/*.{ts,tsx}",
  ],
  safelist: [
    {
      pattern: /^(bg|text|border)-item-tier-(1|2|3|4)$/,
    },
  ],
  theme: {
    extend: {
        fontFamily: {
            'fredoka': ['"Fredoka"', 'sans-serif'],
        },
        colors: {
            // New Palette based on image
            'brand-background': '#302B4B', // Dark purple/indigo
            'brand-surface': '#3D385B', // Slightly lighter purple for surfaces
            'brand-card': '#4B4670', // Card background
            'brand-card-locked': '#3A3655', // Darker for locked cards
            'brand-primary': '#88D1FF', // Light blue/teal for text, icons
            'brand-secondary': '#A09CC9', // Lighter purple text/details
            'brand-accent': '#FFD700', // Gold/Yellow for highlights (active nav)
            'brand-accent-text': '#302B4B', // Text on accent

            'hero-area-bg': '#FDF6E3', // Soft beige for hero display area
            'equipment-title-bg': '#FFC107', // Amber/gold for "Equipment" title bar

            // Item Tier Colors (renamed from item-quality)
            'item-quality-common': '#4A5568', // gray-600 (Kept for truly common items if needed)
            'item-tier-1': '#48BB78', // green-500 (Uncommon -> Tier 1)
            'item-tier-2': '#4299E1', // blue-500 (Rare -> Tier 2)
            'item-tier-3': '#9F7AEA', // purple-500 (Epic -> Tier 3)
            'item-tier-4': '#ED8936', // orange-500 (Legendary -> Tier 4)
            
            'item-notification-bg': '#E53E3E', // red-600

            'progress-bar-fill': '#2EE6D0', // Teal/cyan for progress
            'progress-bar-bg': '#302B4B', // Dark background for progress track
            
            'text-light': '#E0DDEF', // General light text
            'text-muted': '#A09CC9', // Muted text

            // Old colors (some might be repurposed or removed gradually)
            'primary-bg': '#302B4B', 
            'container-bg': '#3D385B', 
            'border-game': '#5A5482', 
            'accent': '#FFD700', 
            'accent-hover': '#E5C100', 
            'accent-text': '#302B4B', 
            'accent-shadow': '#B8860B', 

            'main-menu-bg': '#3D385B', 
            'tab-bg': '#302B4B', 
            'tab-button-inactive-bg': '#4B4670',
            'tab-button-inactive-text': '#A09CC9',
            'tab-button-inactive-hover-bg': '#5A5482',
            'tab-button-active-bg': '#FFD700',
            'tab-button-active-text': '#302B4B',

            'explore-content-bg': '#3D385B',
            'hero-content-bg': '#302B4B', // Updated Hero tab background to match overall theme
            'boss-card-bg': '#4B4670', 
            
            'modal-overlay-bg': 'rgba(48, 43, 75, 0.85)', 
            'modal-content-bg': '#3D385B', 
            'message-display-bg': 'rgba(75, 70, 112, 0.9)',

            'health-bar-hero': '#50C878', 
            'health-bar-enemy': '#D22B2B', 
            'health-bar-bg': 'rgba(0, 0, 0, 0.4)',

            'button-danger-bg': '#C0392B',
            'button-danger-hover-bg': '#A93226',
            'button-success-bg': '#27AE60',
            'button-success-hover-bg': '#229954',
            
            'text-primary-light': '#E0DDEF', 
            'text-primary-dark': '#302B4B',  

            'slot-bg': 'rgba(224, 221, 239, 0.05)', 
            'slot-hover-bg': 'rgba(224, 221, 239, 0.1)',
            'slot-border': 'rgba(160, 156, 201, 0.25)',
        },
        boxShadow: {
            'button-active': '0 1px #B8860B',
            'button-default': '0 3px #B8860B',
            'game-wrapper': '0 8px 20px rgba(48, 43, 75, 0.2)',
            'map-card-hover': '0 6px 12px rgba(0,0,0,0.1)',
            'map-card-active': '0 0 0 2px #FFD700, 0 4px 8px rgba(0,0,0,0.1)',
            'generic-interactive-shadow': '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
            'hover-strong-shadow': '0 4px 12px rgba(0,0,0,0.15)',
            'facility-card': '0 2px 8px rgba(0,0,0,0.2)',
            'slot-item': 'inset 0 1px 2px rgba(0,0,0,0.3)',
        }
    }
  },
  plugins: [],
}