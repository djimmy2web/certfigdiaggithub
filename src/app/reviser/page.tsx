"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface RevisionCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  href: string;
  count?: number;
}

export default function ReviserPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    vocabularyCount: 0,
    recentErrors: 0,
    gamesCount: 0,
    themesCount: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Récupérer les statistiques pour afficher les compteurs
        const [themesRes, quizzesRes] = await Promise.all([
          fetch("/api/themes"),
          fetch("/api/quizzes")
        ]);
        
        const themesData = await themesRes.json();
        const quizzesData = await quizzesRes.json();
        
        setStats({
          vocabularyCount: quizzesData.quizzes?.filter((q: { category: string }) => q.category === 'vocabulary').length || 0,
          recentErrors: 0, // À implémenter avec l'API des erreurs récentes
          gamesCount: quizzesData.quizzes?.filter((q: { category: string }) => q.category === 'game').length || 0,
          themesCount: themesData.themes?.length || 0
        });
      } catch (error) {
        console.error("Erreur lors du chargement des statistiques:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const revisionCards: RevisionCard[] = [
    {
      id: "vocabulary",
      title: "Vocabulaire",
      description: "Apprenez et révisez le vocabulaire essentiel",
      icon: "📚",
      color: "bg-blue-500 hover:bg-blue-600",
      href: "/reviser/vocabulaire",
      count: stats.vocabularyCount
    },
    {
      id: "errors",
      title: "Erreurs récentes",
      description: "Révisez vos erreurs pour progresser",
      icon: "❌",
      color: "bg-red-500 hover:bg-red-600",
      href: "/reviser/erreurs-recentes",
      count: stats.recentErrors
    },
    {
      id: "games",
      title: "Jeux",
      description: "Apprenez en vous amusant avec des quiz interactifs",
      icon: "🎮",
      color: "bg-green-500 hover:bg-green-600",
      href: "/reviser/jeux",
      count: stats.gamesCount
    },
    {
      id: "themes",
      title: "Thématiques",
      description: "Explorez les quiz par thème",
      icon: "🎯",
      color: "bg-purple-500 hover:bg-purple-600",
      href: "/reviser/thematiques",
      count: stats.themesCount
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choisissez votre mode de révision
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Sélectionnez la thématique qui vous intéresse pour commencer votre session de révision
          </p>
        </div>

        {/* Grille des 4 carrés */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {revisionCards.map((card) => (
            <Link
              key={card.id}
              href={card.href}
              className="group block"
            >
              <div className={`
                relative overflow-hidden rounded-2xl shadow-lg transition-all duration-300 
                transform group-hover:scale-105 group-hover:shadow-xl
                ${card.color} text-white
              `}>
                {/* Fond avec motif */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                
                {/* Contenu */}
                <div className="relative p-8 h-64 flex flex-col justify-between">
                  {/* En-tête avec icône et titre */}
                  <div className="flex items-start justify-between">
                    <div className="text-6xl mb-4">{card.icon}</div>
                    {card.count !== undefined && (
                      <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-semibold">
                        {card.count}
                      </div>
                    )}
                  </div>
                  
                  {/* Titre et description */}
                  <div>
                    <h2 className="text-2xl font-bold mb-3">{card.title}</h2>
                    <p className="text-white/90 text-lg leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                  
                  {/* Indicateur de clic */}
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-white/80 font-medium">
                      Commencer
                    </span>
                    <div className="transform group-hover:translate-x-2 transition-transform duration-300">
                      <svg 
                        className="w-6 h-6" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M17 8l4 4m0 0l-4 4m4-4H3" 
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Section de statistiques */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Vos statistiques de révision
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{stats.vocabularyCount}</div>
                <div className="text-gray-600">Quiz vocabulaire</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{stats.recentErrors}</div>
                <div className="text-gray-600">Erreurs récentes</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{stats.gamesCount}</div>
                <div className="text-gray-600">Jeux disponibles</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{stats.themesCount}</div>
                <div className="text-gray-600">Thématiques</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


