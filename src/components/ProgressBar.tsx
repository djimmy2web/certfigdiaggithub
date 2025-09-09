"use client";

interface ProgressBarProps {
  current: number;
  total: number;
  className?: string;
  showLabel?: boolean;
  width?: string;
}

export default function ProgressBar({ 
  current, 
  total, 
  className = "", 
  showLabel = true,
  width = "w-32"
}: ProgressBarProps) {
  const percentage = Math.min((current / total) * 100, 100);
  
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {showLabel && (
        <span className="text-sm text-gray-600">
          {current} / {total}
        </span>
      )}
      
      <div className={`${width} bg-gray-700 rounded-full h-2 shadow-inner`}>
        <div 
          className="bg-lime-400 h-2 rounded-full transition-all duration-500 ease-out shadow-sm"
          style={{ 
            width: `${percentage}%`,
            background: `linear-gradient(180deg, #a3e635 0%, #84cc16 100%)`,
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2)'
          }}
        >
          <div className="w-full h-1 bg-white bg-opacity-20 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
