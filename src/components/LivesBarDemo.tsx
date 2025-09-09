"use client";
import LivesBar from "./LivesBar";
import LivesBarLime from "./LivesBarLime";

export default function LivesBarDemo() {
  return (
    <div className="space-y-6 p-6 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold">Démonstration des barres de vies</h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Barre de vies standard (couleurs adaptatives)</h4>
          <div className="space-y-2">
            <LivesBar currentLives={5} maxLives={5} />
            <LivesBar currentLives={4} maxLives={5} />
            <LivesBar currentLives={3} maxLives={5} />
            <LivesBar currentLives={2} maxLives={5} />
            <LivesBar currentLives={1} maxLives={5} />
            <LivesBar currentLives={0} maxLives={5} />
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Barre de vies Lime Green (style moderne)</h4>
          <div className="space-y-2">
            <LivesBarLime currentLives={5} maxLives={5} />
            <LivesBarLime currentLives={4} maxLives={5} />
            <LivesBarLime currentLives={3} maxLives={5} />
            <LivesBarLime currentLives={2} maxLives={5} />
            <LivesBarLime currentLives={1} maxLives={5} />
            <LivesBarLime currentLives={0} maxLives={5} />
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Variantes sans label ou sans compteur</h4>
          <div className="space-y-2">
            <LivesBar currentLives={3} maxLives={5} showLabel={false} />
            <LivesBar currentLives={3} maxLives={5} showCount={false} />
            <LivesBar currentLives={3} maxLives={5} showLabel={false} showCount={false} />
          </div>
        </div>
      </div>
    </div>
  );
}
