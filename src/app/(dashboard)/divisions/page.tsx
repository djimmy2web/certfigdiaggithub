"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import UserDivision from '@/components/UserDivision';
import Link from 'next/link';

interface Division {
  _id: string;
  name: string;
  color: string;
  minPoints: number;
  maxPoints?: number;
  order: number;
}

export default function DivisionsPage() {
  const { data: session } = useSession();
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDivisions();
    if (session?.user) {
      loadUserPoints();
    }
  }, [session]);

  const loadDivisions = async () => {
    try {
      const response = await fetch('/api/divisions');
      const data = await response.json();
      
      if (data.success) {
        setDivisions(data.divisions.sort((a: Division, b: Division) => b.order - a.order));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des divisions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserPoints = async () => {
    try {
      const response = await fetch('/api/me/progress');
      const data = await response.json();
      
      if (data.success) {
        setUserPoints(data.points || 0);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des points:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">🏆 Système de Divisions</h1>
        <p className="text-gray-600 text-lg">
          Montez en grade en gagnant des points et en vous classant parmi les meilleurs !
        </p>
      </div>

      {/* Division actuelle de l'utilisateur */}
      {session?.user && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Votre Division Actuelle</h2>
          <div className="flex items-center justify-between">
            <UserDivision points={userPoints} className="text-lg" />
            <div className="text-right">
              <p className="text-sm text-gray-600">Points totaux</p>
              <p className="text-2xl font-bold text-blue-600">{userPoints}</p>
            </div>
          </div>
        </div>
      )}

      {/* Explication du système */}
      <div className="bg-white border rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">📋 Comment ça marche ?</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-lg mb-3">🎯 Objectif</h3>
            <p className="text-gray-600 mb-4">
              Gagnez des points en réussissant vos quiz et montez dans les divisions pour affronter des joueurs de votre niveau.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• <strong>Quiz réussis :</strong> +10 points par bonne réponse</li>
              <li>• <strong>Bonus de vie :</strong> +5 points par vie restante</li>
              <li>• <strong>Bonus de rapidité :</strong> +2 points par seconde restante</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-3">🔄 Promotions & Rétrogradations</h3>
            <p className="text-gray-600 mb-4">
              Chaque lundi, les classements sont mis à jour automatiquement.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• <strong>Top 5 :</strong> Promotion vers la division supérieure</li>
              <li>• <strong>Bottom 5 :</strong> Rétrogradation vers la division inférieure</li>
              <li>• <strong>Entre les deux :</strong> Maintien dans la division actuelle</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Divisions disponibles */}
      <div className="bg-white border rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">🏅 Divisions Disponibles</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {divisions.map((division) => (
            <div
              key={division._id}
              className="border rounded-lg p-4 relative overflow-hidden"
              style={{ borderLeftColor: division.color, borderLeftWidth: '4px' }}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg">{division.name}</h3>
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: division.color }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                {division.minPoints}+ points
                {division.maxPoints && ` - ${division.maxPoints} points`}
              </p>
              <div className="text-xs text-gray-500">
                {division.order === 1 && "🏆 Division d'élite"}
                {division.order === 2 && "🥇 Division supérieure"}
                {division.order === 3 && "🥈 Division intermédiaire"}
                {division.order === 4 && "🥉 Division débutante"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <Link 
          href="/classement-divisions"
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 text-center"
        >
          <h3 className="text-xl font-semibold mb-2">📊 Voir les Classements</h3>
          <p className="text-blue-100">
            Découvrez qui sont les meilleurs joueurs de chaque division
          </p>
        </Link>
        
        <Link 
          href="/reviser"
          className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 text-center"
        >
          <h3 className="text-xl font-semibold mb-2">🎯 Commencer à Réviser</h3>
          <p className="text-green-100">
            Gagnez des points en réussissant vos quiz
          </p>
        </Link>
      </div>

      {/* Informations supplémentaires */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-800 mb-2">💡 Conseils</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Les classements se mettent à jour automatiquement chaque lundi à 00:00</li>
          <li>• Plus vous répondez vite et correctement, plus vous gagnez de points</li>
          <li>• Gardez vos vies pour maximiser votre score</li>
          <li>• Consultez régulièrement les classements pour voir votre progression</li>
        </ul>
      </div>
    </div>
  );
}
