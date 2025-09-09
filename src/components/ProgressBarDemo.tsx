"use client";
import ProgressBar from "./ProgressBar";

export default function ProgressBarDemo() {
  return (
    <div className="space-y-6 p-6 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold">Démonstration de la barre de progression</h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Progression dans un quiz (10 questions)</h4>
          <div className="space-y-2">
            <ProgressBar current={1} total={10} />
            <ProgressBar current={3} total={10} />
            <ProgressBar current={5} total={10} />
            <ProgressBar current={7} total={10} />
            <ProgressBar current={9} total={10} />
            <ProgressBar current={10} total={10} />
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Progression dans un quiz (5 questions)</h4>
          <div className="space-y-2">
            <ProgressBar current={1} total={5} />
            <ProgressBar current={2} total={5} />
            <ProgressBar current={3} total={5} />
            <ProgressBar current={4} total={5} />
            <ProgressBar current={5} total={5} />
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Variantes sans label</h4>
          <div className="space-y-2">
            <ProgressBar current={3} total={10} showLabel={false} />
            <ProgressBar current={7} total={10} showLabel={false} />
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Barres de différentes largeurs</h4>
          <div className="space-y-2">
            <ProgressBar current={3} total={10} width="w-24" />
            <ProgressBar current={3} total={10} width="w-32" />
            <ProgressBar current={3} total={10} width="w-40" />
            <ProgressBar current={3} total={10} width="w-48" />
          </div>
        </div>
      </div>
    </div>
  );
}
