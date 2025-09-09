"use client";

interface LivesHeartsProps {
  currentLives: number;
  maxLives: number;
  className?: string;
  showLabel?: boolean;
  showCount?: boolean;
  heartSize?: "sm" | "md" | "lg";
}

export default function LivesHearts({ 
  currentLives, 
  maxLives, 
  className = "", 
  showLabel = true,
  showCount = true,
  heartSize = "md"
}: LivesHeartsProps) {
  const getHeartSize = () => {
    switch (heartSize) {
      case "sm": return "text-sm";
      case "lg": return "text-xl";
      default: return "text-lg";
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {showLabel && (
        <span className="text-sm text-gray-600">Vies :</span>
      )}
      
      <div className="flex items-center space-x-1">
        {[...Array(maxLives)].map((_, i) => (
          <span
            key={i}
            className={`${getHeartSize()} ${
              i < currentLives ? 'text-red-500' : 'text-gray-300'
            } transition-colors duration-200`}
          >
            ❤️
          </span>
        ))}
      </div>
      
      {showCount && (
        <span className="text-sm font-medium text-gray-700 ml-1">
          {currentLives}/{maxLives}
        </span>
      )}
    </div>
  );
}
