import DivisionRanking from '@/components/DivisionRanking';

export default function ClassementDivisionsPage() {
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">🏆 Classements par Division</h1>
        <p className="text-gray-600">
          Découvrez les meilleurs joueurs de chaque division. Les classements se mettent à jour chaque semaine.
        </p>
      </div>

      <DivisionRanking />
    </div>
  );
}
