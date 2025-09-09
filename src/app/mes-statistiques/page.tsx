"use client";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Heatmap from "@/components/Heatmap";
import UserDivision from "@/components/UserDivision";

type Totals = { totalAttempts: number; totalScore: number; avgScore: number; streak: number };

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

interface AttemptByDay {
  day: string;
  attempts: number;
  score: number;
}

interface Category {
  category: string;
  attempts: number;
  avgScore: number;
}

interface BestQuiz {
  id: string;
  title: string;
  attempts: number;
  totalScore: number;
}

interface RecentAttempt {
  id: string;
  quizTitle: string;
  createdAt: string;
  score: number;
}

export default function MyStatsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [attemptsByDay, setAttemptsByDay] = useState<AttemptByDay[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [bestQuizzes, setBestQuizzes] = useState<BestQuiz[]>([]);
  const [recentAttempts, setRecentAttempts] = useState<RecentAttempt[]>([]);
  const [userPoints, setUserPoints] = useState(0);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [selectedDays, setSelectedDays] = useState(30);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Charger les statistiques
      const statsRes = await fetch(`/api/stats/me?days=${selectedDays}${selectedCategory ? `&category=${encodeURIComponent(selectedCategory)}` : ""}`);
      const statsData = await statsRes.json();
      if (!statsRes.ok) throw new Error(statsData?.error || "Erreur");
      
      setTotals(statsData.totals);
      setAttemptsByDay(statsData.attemptsByDay);
      setCategories(statsData.categories);
      setBestQuizzes(statsData.bestQuizzes);
      setRecentAttempts(statsData.recentAttempts);

      // Charger les points utilisateur
      const pointsRes = await fetch('/api/me/progress');
      const pointsData = await pointsRes.json();
      if (pointsRes.ok) {
        setUserPoints(pointsData.points || 0);
      }

      // Générer les achievements basés sur les stats
      generateAchievements(statsData.totals);
      
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [selectedDays, selectedCategory]);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      router.replace("/connexion");
      return;
    }
    loadAllData();
  }, [status, session, router, loadAllData]);

  const generateAchievements = (totals: Totals) => {
    const newAchievements: Achievement[] = [
      {
        id: 'first_quiz',
        title: 'Premier Quiz',
        description: 'Terminez votre premier quiz',
        icon: '🎯',
        unlocked: totals.totalAttempts >= 1
      },
      {
        id: 'quiz_master',
        title: 'Maître Quiz',
        description: 'Complétez 10 quiz',
        icon: '🏆',
        unlocked: totals.totalAttempts >= 10,
        progress: totals.totalAttempts,
        maxProgress: 10
      },
      {
        id: 'quiz_legend',
        title: 'Légende du Quiz',
        description: 'Complétez 50 quiz',
        icon: '👑',
        unlocked: totals.totalAttempts >= 50,
        progress: totals.totalAttempts,
        maxProgress: 50
      },
      {
        id: 'streak_starter',
        title: 'Série Débutante',
        description: 'Maintenez une série de 3 jours',
        icon: '🔥',
        unlocked: totals.streak >= 3,
        progress: totals.streak,
        maxProgress: 3
      },
      {
        id: 'streak_master',
        title: 'Maître de la Régularité',
        description: 'Maintenez une série de 7 jours',
        icon: '⚡',
        unlocked: totals.streak >= 7,
        progress: totals.streak,
        maxProgress: 7
      },
      {
        id: 'high_scorer',
        title: 'Excellent Score',
        description: 'Obtenez un score moyen de 80+',
        icon: '⭐',
        unlocked: totals.avgScore >= 80
      }
    ];
    
    setAchievements(newAchievements);
  };


  useEffect(() => {
    (async () => {
      const res = await fetch("/api/stats/categories");
      const data = await res.json();
      if (res.ok) setCategories(data.categories || []);
    })();
  }, []);

  const getStatCardStyle = (value: number, type: 'attempts' | 'score' | 'avg' | 'streak') => {
    let bgGradient = '';
    let textColor = '';
    let icon = '';
    
    switch (type) {
      case 'attempts':
        if (value >= 50) { bgGradient = 'bg-gradient-to-br from-purple-500 to-pink-500'; textColor = 'text-white'; icon = '🚀'; }
        else if (value >= 20) { bgGradient = 'bg-gradient-to-br from-blue-500 to-purple-500'; textColor = 'text-white'; icon = '⭐'; }
        else if (value >= 10) { bgGradient = 'bg-gradient-to-br from-green-400 to-blue-500'; textColor = 'text-white'; icon = '🎯'; }
        else { bgGradient = 'bg-gradient-to-br from-gray-400 to-gray-500'; textColor = 'text-white'; icon = '📝'; }
        break;
      case 'score':
        if (value >= 1000) { bgGradient = 'bg-gradient-to-br from-yellow-400 to-orange-500'; textColor = 'text-white'; icon = '👑'; }
        else if (value >= 500) { bgGradient = 'bg-gradient-to-br from-orange-400 to-red-500'; textColor = 'text-white'; icon = '🏆'; }
        else if (value >= 100) { bgGradient = 'bg-gradient-to-br from-green-400 to-teal-500'; textColor = 'text-white'; icon = '🎖️'; }
        else { bgGradient = 'bg-gradient-to-br from-gray-400 to-gray-500'; textColor = 'text-white'; icon = '📊'; }
        break;
      case 'avg':
        if (value >= 90) { bgGradient = 'bg-gradient-to-br from-emerald-400 to-teal-500'; textColor = 'text-white'; icon = '💎'; }
        else if (value >= 80) { bgGradient = 'bg-gradient-to-br from-blue-400 to-indigo-500'; textColor = 'text-white'; icon = '⭐'; }
        else if (value >= 70) { bgGradient = 'bg-gradient-to-br from-green-400 to-blue-500'; textColor = 'text-white'; icon = '📈'; }
        else { bgGradient = 'bg-gradient-to-br from-gray-400 to-gray-500'; textColor = 'text-white'; icon = '📊'; }
        break;
      case 'streak':
        if (value >= 15) { bgGradient = 'bg-gradient-to-br from-red-500 to-pink-500'; textColor = 'text-white'; icon = '🔥'; }
        else if (value >= 7) { bgGradient = 'bg-gradient-to-br from-orange-400 to-red-500'; textColor = 'text-white'; icon = '⚡'; }
        else if (value >= 3) { bgGradient = 'bg-gradient-to-br from-yellow-400 to-orange-500'; textColor = 'text-white'; icon = '✨'; }
        else { bgGradient = 'bg-gradient-to-br from-gray-400 to-gray-500'; textColor = 'text-white'; icon = '📅'; }
        break;
    }
    
    return { bgGradient, textColor, icon };
  };

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center p-12"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mb-6"
        />
        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-purple-600 font-semibold text-lg"
        >
          Chargement de vos exploits... ⚡
        </motion.p>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center p-8 bg-red-50 border border-red-200 rounded-2xl"
      >
        <div className="text-4xl mb-4">😰</div>
        <p className="text-red-600 font-semibold">{error}</p>
      </motion.div>
    );
  }

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-8"
    >
      {/* Header avec division */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center">
              📊 Mes Statistiques ⚡
            </h1>
            <p className="text-indigo-100 opacity-90 text-lg">
              Suivez votre progression et vos performances ! 🚀
            </p>
          </div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="text-right"
          >
            <UserDivision points={userPoints} className="text-xl mb-2" />
            <div className="bg-white/20 rounded-xl p-3 backdrop-blur-sm">
              <p className="text-sm text-indigo-100">Points totaux</p>
              <p className="text-3xl font-black text-yellow-300">{userPoints}</p>
            </div>
          </motion.div>
        </div>

        {/* Filtres */}
        <div className="flex items-center gap-4 bg-white/10 rounded-xl p-4 backdrop-blur-sm">
          <label className="text-sm font-medium text-purple-100 flex items-center">
            📅 Période :
          </label>
          <motion.select 
            whileFocus={{ scale: 1.05 }}
            value={selectedDays} 
            onChange={(e) => setSelectedDays(Number(e.target.value))} 
            className="border-2 border-purple-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 transition-all duration-300"
          >
            <option value={7}>7 jours</option>
            <option value={30}>30 jours</option>
            <option value={90}>90 jours</option>
          </motion.select>
          
          <label className="text-sm font-medium text-purple-100 flex items-center ml-4">
            🎯 Catégorie :
          </label>
          <motion.select 
            whileFocus={{ scale: 1.05 }}
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)} 
            className="border-2 border-purple-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 transition-all duration-300"
          >
            <option value="">Toutes</option>
            {categories.map((c: Category) => <option key={c.category} value={c.category}>{c.category}</option>)}
          </motion.select>
        </div>
      </motion.div>

      <div className="space-y-10">
        {/* Cartes de statistiques gamifiées */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {[
            { label: 'Tentatives', value: totals?.totalAttempts ?? 0, type: 'attempts' as const },
            { label: 'Score Total', value: totals?.totalScore ?? 0, type: 'score' as const },
            { label: 'Score Moyen', value: totals?.avgScore ?? 0, type: 'avg' as const },
            { label: 'Série (jours)', value: totals?.streak ?? 0, type: 'streak' as const }
          ].map((stat, index) => {
            const style = getStatCardStyle(stat.value, stat.type);
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8, rotateY: 90 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                whileHover={{ 
                  scale: 1.05, 
                  rotateY: 5,
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" 
                }}
                className={`${style.bgGradient} ${style.textColor} rounded-2xl p-6 shadow-xl relative overflow-hidden`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-medium opacity-90">{stat.label}</div>
                    <div className="text-2xl">{style.icon}</div>
                  </div>
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                    className="text-3xl font-black"
                  >
                    {stat.value}
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-6"
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center text-orange-700">
            🏆 Achievements Débloqués
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {achievements.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                whileHover={{ scale: 1.03 }}
                className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  achievement.unlocked 
                    ? 'bg-gradient-to-br from-green-100 to-emerald-100 border-green-300 shadow-lg shadow-green-200/50' 
                    : 'bg-gray-100 border-gray-300 opacity-60'
                }`}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <div className="text-2xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <h3 className={`font-bold ${achievement.unlocked ? 'text-green-800' : 'text-gray-600'}`}>
                      {achievement.title}
                    </h3>
                    <p className={`text-sm ${achievement.unlocked ? 'text-green-600' : 'text-gray-500'}`}>
                      {achievement.description}
                    </p>
                  </div>
                  {achievement.unlocked && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
                      className="text-green-600 text-xl"
                    >
                      ✅
                    </motion.div>
                  )}
                </div>
                {achievement.maxProgress && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((achievement.progress || 0) / achievement.maxProgress * 100, 100)}%` }}
                      transition={{ duration: 1, delay: 0.8 + index * 0.1 }}
                      className={`h-2 rounded-full ${achievement.unlocked ? 'bg-green-500' : 'bg-yellow-500'}`}
                    />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Heatmap */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-6 text-white">
            <h2 className="text-2xl font-bold flex items-center">
              🔥 Activité Quotidienne
            </h2>
            <p className="text-blue-100 opacity-90">Votre régularité jour par jour</p>
          </div>
          <div className="p-6">
            <Heatmap attempts={attemptsByDay} />
          </div>
        </motion.div>

        {/* Catégories */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-white">
            <h2 className="text-2xl font-bold flex items-center">
              📚 Performance par Catégories
            </h2>
          </div>
          <div className="p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((c: Category, index) => (
                <motion.div
                  key={c.category}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                  whileHover={{ scale: 1.03, x: 5 }}
                  className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-300"
                >
                  <div className="font-bold text-gray-800 mb-2 flex items-center">
                    📖 {c.category}
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>✅ Tentatives: <span className="font-semibold text-blue-600">{c.attempts}</span></div>
                    <div>⭐ Score moyen: <span className="font-semibold text-green-600">{c.avgScore}</span></div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Meilleurs quizz et tentatives récentes */}
        <div className="grid gap-8 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
              <h2 className="text-xl font-bold flex items-center">
                🏅 Meilleurs Quiz
              </h2>
            </div>
            <div className="p-6 space-y-3">
              {bestQuizzes.map((b: BestQuiz, index) => (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.9 + index * 0.1 }}
                  whileHover={{ scale: 1.02, x: 5 }}
                  className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-800">{b.title}</span>
                    <div className="text-sm text-amber-600 font-medium">
                      🎯 {b.attempts} tentatives • 🏆 {b.totalScore} pts
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-6 text-white">
              <h2 className="text-xl font-bold flex items-center">
                ⏰ Tentatives Récentes
              </h2>
            </div>
            <div className="p-6 space-y-3">
              {recentAttempts.map((r: RecentAttempt, index) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 1.0 + index * 0.1 }}
                  whileHover={{ scale: 1.02, x: 5 }}
                  className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-800">{r.quizTitle}</span>
                    <div className="text-sm text-indigo-600 font-medium">
                      📅 {new Date(r.createdAt).toLocaleDateString()} • 🎯 {r.score} pts
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}


