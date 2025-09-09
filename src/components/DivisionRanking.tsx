"use client";
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Division {
  _id: string;
  name: string;
  color: string;
  minPoints: number;
  maxPoints?: number;
}

interface RankingPlayer {
  userId: string;
  username: string;
  points: number;
  rank: number;
  status: 'promoted' | 'relegated' | 'stayed' | 'new';
}

interface WeeklyRanking {
  _id: string;
  weekStart: string;
  weekEnd: string;
  divisionId: Division;
  rankings: RankingPlayer[];
  isProcessed: boolean;
}

export default function DivisionRanking() {
  const [rankings, setRankings] = useState<WeeklyRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState<string>('');

  const loadRankings = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedWeek) {
        params.append('weekStart', selectedWeek);
      }
      
      const response = await fetch(`/api/rankings/weekly?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setRankings(data.rankings);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des classements:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedWeek]);

  useEffect(() => {
    loadRankings();
  }, [loadRankings]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'promoted':
        return '🚀';
      case 'relegated':
        return '💔';
      case 'stayed':
        return '🔥';
      default:
        return '⭐';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'promoted':
        return { text: 'PROMU', bg: 'bg-gradient-to-r from-green-400 to-emerald-500', glow: 'shadow-green-300' };
      case 'relegated':
        return { text: 'RELÉGUÉ', bg: 'bg-gradient-to-r from-red-400 to-rose-500', glow: 'shadow-red-300' };
      case 'stayed':
        return { text: 'MAINTENU', bg: 'bg-gradient-to-r from-blue-400 to-indigo-500', glow: 'shadow-blue-300' };
      default:
        return { text: 'NOUVEAU', bg: 'bg-gradient-to-r from-purple-400 to-pink-500', glow: 'shadow-purple-300' };
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { icon: '👑', bg: 'bg-gradient-to-r from-yellow-400 to-amber-500', text: 'text-white' };
    if (rank === 2) return { icon: '🥈', bg: 'bg-gradient-to-r from-gray-300 to-gray-400', text: 'text-white' };
    if (rank === 3) return { icon: '🥉', bg: 'bg-gradient-to-r from-amber-600 to-orange-500', text: 'text-white' };
    if (rank <= 5) return { icon: '🏆', bg: 'bg-gradient-to-r from-indigo-400 to-purple-500', text: 'text-white' };
    return { icon: '', bg: 'bg-gray-100', text: 'text-gray-700' };
  };

  // const getStatusColor = (status: string) => {
  //   switch (status) {
  //     case 'promoted':
  //       return 'text-green-600';
  //     case 'relegated':
  //       return 'text-red-600';
  //     case 'stayed':
  //       return 'text-gray-600';
  //     default:
  //       return 'text-blue-600';
  //   }
  // };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600 mb-4"
        />
        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-purple-600 font-semibold"
        >
          Chargement des classements magiques... ✨
        </motion.p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2 flex items-center">
              🏆 Classements par Division ⚔️
            </h2>
            <p className="text-purple-100 opacity-90">
              Découvrez les champions de chaque division ! 🌟
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-purple-100">
              📅 Semaine :
            </label>
            <motion.input
              whileFocus={{ scale: 1.05 }}
              type="date"
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="border-2 border-purple-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 transition-all duration-300"
            />
          </div>
        </div>
      </motion.div>

      {rankings.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl"
        >
          <div className="text-6xl mb-4">😴</div>
          <p className="text-xl text-gray-600 font-medium">
            Aucun classement disponible pour cette semaine
          </p>
          <p className="text-gray-500 mt-2">
            Les champions se reposent... 💤
          </p>
        </motion.div>
      ) : (
        <motion.div 
          className="grid gap-6 md:grid-cols-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <AnimatePresence>
            {rankings.map((ranking, index) => (
              <motion.div
                key={ranking._id}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -50, scale: 0.9 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ 
                  scale: 1.02, 
                  boxShadow: "0 20px 40px -12px rgba(0, 0, 0, 0.2)" 
                }}
                className="bg-white border-2 border-gray-100 rounded-2xl shadow-lg overflow-hidden hover:border-purple-200 transition-all duration-300"
              >
                <motion.div
                  className="px-6 py-4 text-white font-semibold relative overflow-hidden"
                  style={{ backgroundColor: ranking.divisionId.color }}
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
                  <div className="relative z-10">
                    <h3 className="text-xl flex items-center">
                      ⚔️ {ranking.divisionId.name}
                    </h3>
                    <p className="text-sm opacity-90 flex items-center mt-1">
                      💎 {ranking.divisionId.minPoints}+ points
                      {ranking.divisionId.maxPoints && ` - ${ranking.divisionId.maxPoints} points`}
                    </p>
                  </div>
                </motion.div>

                <div className="p-6">
                  <div className="text-sm text-gray-600 mb-4 flex items-center">
                    📅 Semaine du {formatDate(ranking.weekStart)} au {formatDate(ranking.weekEnd)}
                  </div>

                  <div className="space-y-3">
                    {ranking.rankings.slice(0, 10).map((player, playerIndex) => {
                      const rankBadge = getRankBadge(player.rank);
                      const statusBadge = getStatusBadge(player.status);
                      
                      return (
                        <motion.div
                          key={player.userId}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: playerIndex * 0.05 }}
                          whileHover={{ 
                            scale: 1.03, 
                            x: 5,
                            transition: { duration: 0.2 }
                          }}
                          className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300"
                        >
                          <div className="flex items-center space-x-4">
                            <motion.div
                              whileHover={{ rotate: 360 }}
                              transition={{ duration: 0.5 }}
                              className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm ${rankBadge.bg} ${rankBadge.text} shadow-lg`}
                            >
                              {rankBadge.icon || `#${player.rank}`}
                            </motion.div>
                            
                            <div className="flex flex-col">
                              <span className="font-bold text-gray-800 text-lg">
                                {player.username}
                              </span>
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${statusBadge.bg} text-white shadow-md ${statusBadge.glow} shadow-sm`}
                              >
                                {getStatusIcon(player.status)} {statusBadge.text}
                              </motion.div>
                            </div>
                          </div>
                          
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            className="flex items-center space-x-2"
                          >
                            <span className="font-black text-2xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                              {player.points}
                            </span>
                            <span className="text-sm text-gray-500 font-medium">pts</span>
                          </motion.div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {ranking.rankings.length > 10 && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="text-center mt-6 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200"
                    >
                      <span className="text-sm text-gray-600 font-medium">
                        🎯 ... et {ranking.rankings.length - 10} autres champions en lice !
                      </span>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
}
