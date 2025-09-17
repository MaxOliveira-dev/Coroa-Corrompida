
import React from 'react';

interface TabsProps {
  activeTab: 'explore' | 'hero';
  onTabChange: (tab: 'explore' | 'hero') => void;
}

const Tabs: React.FC<TabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="tabs flex bg-tab-bg shrink-0">
      <button
        className={`tab-button flex-grow p-4 border-none text-lg font-bold cursor-pointer border-b-4 transition-colors duration-150 ${
          activeTab === 'explore'
            ? 'bg-tab-button-active-bg text-tab-button-active-text border-accent hover:bg-accent-hover'
            : 'bg-tab-button-inactive-bg text-tab-button-inactive-text border-transparent hover:bg-tab-button-inactive-hover-bg'
        }`}
        data-tab="explore-content"
        onClick={() => onTabChange('explore')}
        aria-pressed={activeTab === 'explore'}
      >
        Explorar
      </button>
      <button
        className={`tab-button flex-grow p-4 border-none text-lg font-bold cursor-pointer border-b-4 transition-colors duration-150 ${
          activeTab === 'hero'
            ? 'bg-tab-button-active-bg text-tab-button-active-text border-accent hover:bg-accent-hover'
            : 'bg-tab-button-inactive-bg text-tab-button-inactive-text border-transparent hover:bg-tab-button-inactive-hover-bg'
        }`}
        data-tab="hero-content"
        onClick={() => onTabChange('hero')}
        aria-pressed={activeTab === 'hero'}
      >
        Herói
      </button>
    </div>
  );
};

export default Tabs;