"use client";

interface LivesBarProps {
  currentLives: number;
  maxLives: number;
  className?: string;
  showLabel?: boolean;
  showCount?: boolean;
}

export default function LivesBar({ 
  currentLives, 
  maxLives, 
  className = "", 
  showLabel = true,
  showCount = true 
}: LivesBarProps) {
  const percentage = (currentLives / maxLives) * 100;
  
  // Déterminer la couleur en fonction du nombre de vies restantes
  const getBarColor = () => {
    if (percentage >= 60) return 'bg-green-500'; // Vert pour beaucoup de vies
    if (percentage >= 40) return 'bg-yellow-500'; // Jaune pour vies moyennes
    if (percentage >= 20) return 'bg-orange-500'; // Orange pour peu de vies
    return 'bg-red-500'; // Rouge pour très peu de vies
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {showLabel && (
        <span className="text-sm text-gray-600">Vies :</span>
      )}
      
      <div className="relative">
        {/* Barre de fond */}
        <div className="w-32 bg-gray-200 rounded-full h-2 shadow-inner">
          {/* Barre de progression avec gradient */}
          <div 
            className={`${getBarColor()} h-2 rounded-full transition-all duration-500 ease-out shadow-sm`}
            style={{ 
              width: `${percentage}%`,
              background: `linear-gradient(180deg, ${getBarColor().replace('bg-', '')} 0%, ${getBarColor().replace('bg-', '').replace('-500', '-600')} 100%)`
            }}
          >
            {/* Effet de brillance */}
            <div className="w-full h-1 bg-white bg-opacity-30 rounded-full"></div>
          </div>
        </div>
        
        {/* Indicateur de danger quand les vies sont basses */}
        {percentage <= 20 && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
        )}
      </div>
      
      {showCount && (
        <span className={`text-sm font-medium ${
          percentage <= 20 ? 'text-red-600' : 
          percentage <= 40 ? 'text-orange-600' : 
          percentage <= 60 ? 'text-yellow-600' : 'text-green-600'
        }`}>
          {currentLives}/{maxLives}
        </span>
      )}
    </div>
  );
}
