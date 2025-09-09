"use client";
import LivesHearts from "./LivesHearts";

export default function LivesHeartsDemo() {
  return (
    <div className="space-y-6 p-6 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold">Démonstration des cœurs de vies</h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Vies avec cœurs (5 vies max)</h4>
          <div className="space-y-2">
            <LivesHearts currentLives={5} maxLives={5} />
            <LivesHearts currentLives={4} maxLives={5} />
            <LivesHearts currentLives={3} maxLives={5} />
            <LivesHearts currentLives={2} maxLives={5} />
            <LivesHearts currentLives={1} maxLives={5} />
            <LivesHearts currentLives={0} maxLives={5} />
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Différentes tailles de cœurs</h4>
          <div className="space-y-2">
            <LivesHearts currentLives={3} maxLives={5} heartSize="sm" />
            <LivesHearts currentLives={3} maxLives={5} heartSize="md" />
            <LivesHearts currentLives={3} maxLives={5} heartSize="lg" />
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Variantes sans label ou sans compteur</h4>
          <div className="space-y-2">
            <LivesHearts currentLives={3} maxLives={5} showLabel={false} />
            <LivesHearts currentLives={3} maxLives={5} showCount={false} />
            <LivesHearts currentLives={3} maxLives={5} showLabel={false} showCount={false} />
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Différents nombres de vies</h4>
          <div className="space-y-2">
            <LivesHearts currentLives={3} maxLives={3} />
            <LivesHearts currentLives={5} maxLives={7} />
            <LivesHearts currentLives={2} maxLives={10} />
          </div>
        </div>
      </div>
    </div>
  );
}
