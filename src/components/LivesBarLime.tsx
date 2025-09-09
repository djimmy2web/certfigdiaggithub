"use client";

interface LivesBarLimeProps {
  currentLives: number;
  maxLives: number;
  className?: string;
  showLabel?: boolean;
  showCount?: boolean;
}

export default function LivesBarLime({ 
  currentLives, 
  maxLives, 
  className = "", 
  showLabel = true,
  showCount = true 
}: LivesBarLimeProps) {
  const percentage = (currentLives / maxLives) * 100;
  
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {showLabel && (
        <span className="text-sm text-gray-600">Vies :</span>
      )}
      
      <div className="relative">
        {/* Barre de fond - couleur charcoal grey comme dans l'image */}
        <div className="w-32 bg-gray-700 rounded-full h-2 shadow-inner">
          {/* Barre de progression - lime green comme dans l'image */}
          <div 
            className="bg-lime-400 h-2 rounded-full transition-all duration-500 ease-out shadow-sm"
            style={{ 
              width: `${percentage}%`,
              background: `linear-gradient(180deg, #a3e635 0%, #84cc16 100%)`,
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2)'
            }}
          >
            {/* Effet de brillance subtil */}
            <div className="w-full h-1 bg-white bg-opacity-20 rounded-full"></div>
          </div>
        </div>
        
        {/* Indicateur de danger quand les vies sont basses */}
        {percentage <= 20 && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg"></div>
        )}
      </div>
      
      {showCount && (
        <span className={`text-sm font-medium ${
          percentage <= 20 ? 'text-red-600' : 
          percentage <= 40 ? 'text-orange-600' : 
          percentage <= 60 ? 'text-yellow-600' : 'text-lime-600'
        }`}>
          {currentLives}/{maxLives}
        </span>
      )}
    </div>
  );
}
