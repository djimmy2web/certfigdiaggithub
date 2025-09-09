"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Division {
  _id: string;
  name: string;
  color: string;
  minPoints: number;
  maxPoints?: number;
  order: number;
}

export default function AdminDivisionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user.role !== 'admin') {
      router.push('/connexion');
      return;
    }

    loadDivisions();
  }, [session, status, router]);

  const loadDivisions = async () => {
    try {
      const response = await fetch('/api/divisions');
      const data = await response.json();
      
      if (data.success) {
        setDivisions(data.divisions);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des divisions:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeDivisions = async () => {
    try {
      setProcessing(true);
      const response = await fetch('/api/admin/divisions/init', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        alert('Divisions initialisées avec succès !');
        await loadDivisions();
      } else {
        alert('Erreur lors de l\'initialisation');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'initialisation');
    } finally {
      setProcessing(false);
    }
  };

  const triggerAutoProcess = async () => {
    try {
      setProcessing(true);
      const response = await fetch('/api/admin/rankings/auto-process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET_TOKEN || 'admin-trigger'}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        alert('Processus automatique déclenché avec succès !');
      } else {
        alert('Erreur lors du déclenchement du processus automatique');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors du déclenchement du processus automatique');
    } finally {
      setProcessing(false);
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
        <h1 className="text-3xl font-bold mb-4">🏆 Gestion des Divisions</h1>
        <p className="text-gray-600">
          Gérez les divisions et les classements hebdomadaires
        </p>
      </div>

      {/* Divisions existantes */}
      <div className="bg-white border rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Divisions actuelles</h2>
        
        {divisions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">Aucune division configurée</p>
            <button
              onClick={initializeDivisions}
              disabled={processing}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {processing ? 'Initialisation...' : 'Initialiser les divisions'}
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {divisions.map((division) => (
              <div
                key={division._id}
                className="border rounded-lg p-4"
                style={{ borderLeftColor: division.color, borderLeftWidth: '4px' }}
              >
                <h3 className="font-semibold text-lg">{division.name}</h3>
                <p className="text-sm text-gray-600">
                  {division.minPoints}+ points
                  {division.maxPoints && ` - ${division.maxPoints} points`}
                </p>
                <div className="mt-2">
                  <span
                    className="inline-block w-4 h-4 rounded-full"
                    style={{ backgroundColor: division.color }}
                  ></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

             {/* Processus automatique */}
       <div className="bg-white border rounded-lg p-6">
         <h2 className="text-xl font-semibold mb-4">🔄 Processus Automatique</h2>
         
         <div className="space-y-4">
           <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
             <h3 className="font-semibold text-blue-800 mb-2">⚡ Système Automatisé</h3>
             <p className="text-blue-700 text-sm">
               Le système traite automatiquement les divisions chaque lundi à 00:00.
               Vous pouvez également déclencher le processus manuellement si nécessaire.
             </p>
           </div>

           <div className="flex space-x-4">
             <button
               onClick={triggerAutoProcess}
               disabled={processing}
               className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
             >
               {processing ? '⏳ Traitement...' : '🚀 Déclencher maintenant'}
             </button>
           </div>

           <div className="text-sm text-gray-600 mt-4">
             <p><strong>📋 Ce que fait le processus automatique :</strong></p>
             <ol className="list-decimal list-inside space-y-1 mt-2">
               <li>Calcule les classements pour la semaine actuelle</li>
               <li>Traite les promotions (top 5) et rétrogradations (bottom 5)</li>
               <li>Met à jour automatiquement les points des utilisateurs</li>
               <li>Évite les doublons (ne s&apos;exécute qu&apos;une fois par semaine)</li>
             </ol>
           </div>

           <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
             <h3 className="font-semibold text-yellow-800 mb-2">💡 Pour l&apos;automatisation locale :</h3>
             <div className="text-yellow-700 text-sm space-y-1">
               <p><strong>Option 1 - Script manuel :</strong></p>
               <code className="bg-yellow-100 px-2 py-1 rounded">npm run auto-process</code>
               
               <p><strong>Option 2 - Cron job local :</strong></p>
               <code className="bg-yellow-100 px-2 py-1 rounded">npm run cron:start</code>
               
               <p><strong>Option 3 - Test :</strong></p>
               <code className="bg-yellow-100 px-2 py-1 rounded">npm run cron:test</code>
             </div>
           </div>
         </div>
       </div>
    </div>
  );
}
