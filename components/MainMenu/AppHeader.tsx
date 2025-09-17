import React from 'react';

interface AppHeaderProps {
  gems: number;
  coins: number;
  kingImageUrl: string;
  onSignOut: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ gems, coins, kingImageUrl, onSignOut }) => {
  return (
    <div className="bg-brand-surface p-3 shadow-md">
      <div className="flex justify-between items-center mb-3">
        <div className="flex space-x-3">
          <div className="bg-brand-card text-text-light px-3 py-1 rounded-full text-sm flex items-center shadow-sm transition-all duration-200 ease-in-out hover:scale-105 hover:brightness-110">
            <span className="text-brand-accent mr-1.5 text-lg">💎</span> {gems}
          </div>
          <div className="bg-brand-card text-text-light px-3 py-1 rounded-full text-sm flex items-center shadow-sm transition-all duration-200 ease-in-out hover:scale-105 hover:brightness-110">
            <span className="text-brand-accent mr-1.5 text-lg">💰</span> {coins}
          </div>
        </div>
        <div>
           <button onClick={onSignOut} className="text-text-muted hover:text-text-light text-xs font-semibold bg-brand-card px-2 py-1 rounded-md transition-colors duration-150">Sair</button>
        </div>
      </div>
      {/* The h-28 div that was here has been removed */}
    </div>
  );
};

export default AppHeader;