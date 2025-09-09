"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface Theme {
  id: string;
  name: string;
  slug: string;
  description?: string;
  quizCount?: number;
  color?: string;
}

interface Quiz {
  id: string;
  title: string;
  description?: string;
  questionsCount?: number;
  difficulty?: "debutant" | "intermediaire" | "expert";
  themeSlug?: string;
}

interface ThemeProgress {
  themeSlug: string;
  currentLevel: "debutant" | "intermediaire" | "expert";
  totalScore: number;
  totalQuizzesCompleted: number;
  lastActivityAt: string;
  completedQuizzes: Array<{
    quizId: string;
    score: number;
    totalQuestions: number;
    completedAt: string;
    difficulty: "debutant" | "intermediaire" | "expert";
  }>;
  levelStats: {
    debutant: { completed: number; totalScore: number; averageScore: number };
    intermediaire: { completed: number; totalScore: number; averageScore: number };
    expert: { completed: number; totalScore: number; averageScore: number };
  };
  quizzesByLevel: {
    debutant: Quiz[];
    intermediaire: Quiz[];
    expert: Quiz[];
  };
  canAccessLevel: {
    debutant: boolean;
    intermediaire: boolean;
    expert: boolean;
  };
}

export default function ThematiquesPage() {
  const { data: session } = useSession();
  const [themes, setThemes] = useState<Theme[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string>("");
  const [themeProgress, setThemeProgress] = useState<ThemeProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [themesRes, quizzesRes] = await Promise.all([
          fetch("/api/themes"),
          fetch("/api/quizzes")
        ]);
        
        const themesData = await themesRes.json();
        const quizzesData = await quizzesRes.json();
        
        if (!themesRes.ok) throw new Error(themesData?.error || "Erreur");
        if (!quizzesRes.ok) throw new Error(quizzesData?.error || "Erreur");
        
        setThemes(themesData.themes || []);
        setQuizzes(quizzesData.quizzes || []);
      } catch (e: unknown) {
        setError((e as Error).message || "Erreur lors du chargement");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Charger la progression quand un thème est sélectionné
  useEffect(() => {
    if (!selectedTheme || !session?.user) return;

    const fetchProgress = async () => {
      try {
        const progressRes = await fetch(`/api/themes/progress?themeSlug=${selectedTheme}`);
        const progressData = await progressRes.json();
        
        if (progressRes.ok) {
          setThemeProgress(progressData.progress);
        }
      } catch (e: unknown) {
        console.error('Erreur lors du chargement de la progression:', e);
      }
    };

    fetchProgress();
  }, [selectedTheme, session]);

  const getThemeColor = (index: number) => {
    const colors = [
      "bg-gradient-to-br from-blue-500 to-blue-600",
      "bg-gradient-to-br from-green-500 to-green-600",
      "bg-gradient-to-br from-purple-500 to-purple-600",
      "bg-gradient-to-br from-red-500 to-red-600",
      "bg-gradient-to-br from-yellow-500 to-yellow-600",
      "bg-gradient-to-br from-pink-500 to-pink-600",
      "bg-gradient-to-br from-indigo-500 to-indigo-600",
      "bg-gradient-to-br from-teal-500 to-teal-600"
    ];
    return colors[index % colors.length];
  };

  const getDifficultyInfo = (difficulty: string) => {
    switch (difficulty) {
      case "debutant":
        return { label: "Débutant", emoji: "🖐️", color: "bg-green-100 text-green-800" };
      case "intermediaire":
        return { label: "Intermédiaire", emoji: "🧠", color: "bg-yellow-100 text-yellow-800" };
      case "expert":
        return { label: "Expert", emoji: "🏆", color: "bg-red-100 text-red-800" };
      default:
        return { label: "Tous niveaux", emoji: "📚", color: "bg-gray-100 text-gray-800" };
    }
  };

  const getLevelProgressInfo = (level: "debutant" | "intermediaire" | "expert") => {
    if (!themeProgress) return { completed: 0, total: 0, percentage: 0, canAccess: level === "debutant" };
    
    const levelQuizzes = themeProgress.quizzesByLevel[level];
    const levelStats = themeProgress.levelStats[level];
    const canAccess = themeProgress.canAccessLevel[level];
    
    return {
      completed: levelStats.completed,
      total: levelQuizzes.length,
      percentage: levelQuizzes.length > 0 ? Math.round((levelStats.completed / levelQuizzes.length) * 100) : 0,
      canAccess,
      averageScore: levelStats.averageScore
    };
  };

  const getLevelColor = (level: "debutant" | "intermediaire" | "expert") => {
    const progressInfo = getLevelProgressInfo(level);
    
    if (!progressInfo.canAccess) return "bg-gray-200 text-gray-500";
    if (progressInfo.percentage === 100) return "bg-green-500 text-white";
    if (progressInfo.percentage >= 50) return "bg-yellow-500 text-white";
    return "bg-blue-500 text-white";
  };

  // const filteredQuizzes = selectedTheme 
  //   ? quizzes.filter(quiz => quiz.themeSlug === selectedTheme)
  //   : quizzes;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erreur</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête avec gamification */}
        <div className="text-center mb-16">
          <div className="text-8xl mb-6 animate-bounce">🎯</div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-800 bg-clip-text text-transparent mb-6">
            Maîtrise des Thématiques
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Progressez niveau par niveau ! Débloquez les défis avancés en maîtrisant les bases
          </p>
          
          {/* Badge de progression globale */}
          {themeProgress && (
            <div className="mt-8 inline-flex items-center bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-full font-semibold shadow-lg">
              <span className="mr-2">⭐</span>
              Niveau Actuel : {themeProgress.currentLevel.charAt(0).toUpperCase() + themeProgress.currentLevel.slice(1)}
              <span className="ml-2">🔥</span>
            </div>
          )}
          
          <Link 
            href="/reviser"
            className="inline-flex items-center mt-6 text-purple-600 hover:text-purple-700 font-medium transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour à la révision
          </Link>
        </div>

        {/* Filtres par thème */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => setSelectedTheme("")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedTheme === "" 
                  ? "bg-purple-600 text-white" 
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              Toutes les thématiques
            </button>
                         {themes.map((theme) => (
               <button
                 key={theme.id}
                 onClick={() => setSelectedTheme(theme.slug)}
                 className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                   selectedTheme === theme.slug 
                     ? "bg-purple-600 text-white" 
                     : "bg-white text-gray-700 hover:bg-gray-100"
                 }`}
               >
                 {theme.name}
               </button>
             ))}
          </div>
        </div>

        {/* Grille des thématiques */}
        {selectedTheme === "" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {themes.map((theme, index) => {
              const themeQuizzes = quizzes.filter(quiz => quiz.themeSlug === theme.slug);
              const themeColor = getThemeColor(index);
              
              return (
                                 <div key={theme.id} className="group cursor-pointer" onClick={() => setSelectedTheme(theme.slug)}>
                  <div className={`${themeColor} rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform group-hover:scale-105 p-6 h-48 flex flex-col justify-between text-white`}>
                    <div>
                      <h3 className="text-2xl font-bold mb-2">{theme.name}</h3>
                      {theme.description && (
                        <p className="text-white/90 text-sm line-clamp-2">
                          {theme.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/80 text-sm">
                        {themeQuizzes.length} quiz disponible{themeQuizzes.length > 1 ? 's' : ''}
                      </span>
                      <div className="transform group-hover:translate-x-2 transition-transform duration-300">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Progression par niveau pour la thématique sélectionnée */}
        {selectedTheme !== "" && themeProgress && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900">
                {themes.find(t => t.slug === selectedTheme)?.name}
              </h2>
              <button
                onClick={() => setSelectedTheme("")}
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                Voir toutes les thématiques
              </button>
            </div>

            {/* Barre de progression globale */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl shadow-2xl p-8 mb-8 border-2 border-purple-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-gray-900">Progression Globale</h3>
                <div className="text-right">
                  <div className="text-3xl font-bold text-purple-600">{themeProgress.totalQuizzesCompleted}</div>
                  <div className="text-sm text-gray-600">Quiz complétés</div>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-4 rounded-full transition-all duration-1000"
                  style={{ 
                    width: `${themeProgress.totalQuizzesCompleted > 0 ? Math.round((themeProgress.totalScore / (themeProgress.totalQuizzesCompleted * 100)) * 100) : 0}%` 
                  }}
                ></div>
              </div>
              
              <div className="text-center">
                <span className="text-lg font-semibold text-gray-700">
                  Score moyen: {themeProgress.totalQuizzesCompleted > 0 ? Math.round(themeProgress.totalScore / themeProgress.totalQuizzesCompleted) : 0}%
                </span>
              </div>
            </div>

            {/* Niveaux de progression */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {(["debutant", "intermediaire", "expert"] as const).map((level) => {
                const progressInfo = getLevelProgressInfo(level);
                const levelColor = getLevelColor(level);
                const levelInfo = getDifficultyInfo(level);
                
                return (
                  <div key={level} className={`${levelColor} rounded-2xl shadow-lg p-6 transition-all duration-300 transform hover:scale-105`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-2xl">{levelInfo.emoji}</div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {progressInfo.completed}/{progressInfo.total}
                        </div>
                        <div className="text-sm opacity-80">Quiz</div>
                      </div>
                    </div>
                    
                    <h4 className="text-lg font-bold mb-2">{levelInfo.label}</h4>
                    
                    <div className="w-full bg-black/20 rounded-full h-2 mb-3">
                      <div 
                        className="bg-white h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${progressInfo.percentage}%` }}
                      ></div>
                    </div>
                    
                    <div className="text-sm opacity-80">
                      {progressInfo.canAccess ? (
                        <>
                          <div>Score moyen: {progressInfo.averageScore}%</div>
                          <div>Progression: {progressInfo.percentage}%</div>
                        </>
                      ) : (
                        <div className="text-center">
                          🔒 Niveau verrouillé
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quiz par niveau */}
            {(["debutant", "intermediaire", "expert"] as const).map((level) => {
              const progressInfo = getLevelProgressInfo(level);
              const levelQuizzes = themeProgress.quizzesByLevel[level];
              
              if (levelQuizzes.length === 0) return null;
              
              return (
                <div key={level} className="mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                      {getDifficultyInfo(level).emoji} {getDifficultyInfo(level).label}
                      {!progressInfo.canAccess && (
                        <span className="ml-2 text-sm bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                          🔒 Verrouillé
                        </span>
                      )}
                    </h3>
                    <div className="text-sm text-gray-600">
                      {progressInfo.completed}/{progressInfo.total} complétés
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {levelQuizzes.map((quiz) => {
                      const difficultyInfo = getDifficultyInfo(quiz.difficulty || "");
                      const isCompleted = themeProgress.completedQuizzes.some(q => q.quizId === quiz.id);
                      
                      return (
                        <div key={quiz.id} className={`group block ${!progressInfo.canAccess ? 'pointer-events-none' : ''}`}>
                          <div className={`bg-white rounded-2xl shadow-lg transition-all duration-300 transform group-hover:scale-105 p-6 h-full border-2 ${
                            !progressInfo.canAccess ? 'opacity-50 border-gray-200' : 
                            isCompleted ? 'border-green-200 bg-green-50' : 'border-purple-200 hover:border-purple-300'
                          }`}>
                            {/* En-tête du quiz */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="text-4xl">
                                {isCompleted ? '✅' : !progressInfo.canAccess ? '🔒' : '🎯'}
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${difficultyInfo.color}`}>
                                {difficultyInfo.emoji} {difficultyInfo.label}
                              </span>
                            </div>
                            
                            {/* Titre et description */}
                            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                              {quiz.title}
                            </h3>
                            {quiz.description && (
                              <p className="text-gray-600 mb-4 line-clamp-2">
                                {quiz.description}
                              </p>
                            )}
                            
                            {/* Statistiques */}
                            <div className="flex items-center justify-between text-sm text-gray-500">
                              <span>{quiz.questionsCount || 0} questions</span>
                              {progressInfo.canAccess ? (
                                <Link
                                  href={`/reviser/${quiz.id}`}
                                  className="flex items-center text-purple-600 font-medium"
                                >
                                  {isCompleted ? 'Revoir' : 'Commencer'}
                                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </Link>
                              ) : (
                                <span className="text-gray-400">Verrouillé</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Statistiques des thématiques */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-6 text-center">📊 Statistiques des thématiques</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold">{themes.length}</div>
                <div className="text-purple-200">Thématiques</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{quizzes.length}</div>
                <div className="text-purple-200">Quiz total</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {themes.length > 0 ? Math.round(quizzes.length / themes.length) : 0}
                </div>
                <div className="text-purple-200">Quiz/thématique</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {quizzes.filter(q => q.difficulty === 'expert').length}
                </div>
                <div className="text-purple-200">Quiz expert</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
