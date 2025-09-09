"use client";
import { useState, useEffect } from 'react';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  weeklyActivity: {
    [key: string]: boolean; // date string -> completed
  };
}

export default function StreakTracker() {
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStreakData();
  }, []);

  const loadStreakData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/me/streak');
      const data = await response.json();
      
      if (data.success) {
        setStreakData(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du streak:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentWeekDates = () => {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1); // Lundi de cette semaine
    monday.setHours(0, 0, 0, 0);

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      weekDates.push(date);
    }
    return weekDates;
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getDayName = (date: Date) => {
    const days = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
    return days[date.getDay()];
  };

  if (loading) {
    return (
      <div className="bg-white border rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!streakData) {
    return (
      <div className="bg-white border rounded-lg p-6">
        <p className="text-gray-500">Aucune donnée de streak disponible</p>
      </div>
    );
  }

  const weekDates = getCurrentWeekDates();
  // const today = new Date();

  return (
    <div className="bg-white border rounded-lg p-6">
      {/* En-tête du streak */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            Série de {streakData.currentStreak} jour{streakData.currentStreak > 1 ? 's' : ''}
          </h3>
          {streakData.currentStreak === 0 ? (
            <p className="text-sm text-gray-600 mt-1">
              Termine une leçon aujourd&apos;hui pour commencer une nouvelle série !
            </p>
          ) : (
            <p className="text-sm text-gray-600 mt-1">
              Continuez comme ça ! Votre plus longue série : {streakData.longestStreak} jour{streakData.longestStreak > 1 ? 's' : ''}
            </p>
          )}
        </div>
        <div className="text-3xl">
          {streakData.currentStreak > 0 ? '🔥' : '💤'}
        </div>
      </div>

      {/* Calendrier hebdomadaire */}
      <div className="bg-gray-50 rounded-lg p-4">
        {/* Labels des jours */}
        <div className="flex justify-between mb-3">
          {weekDates.map((date) => (
            <div 
              key={date.toISOString()} 
              className={`text-center text-sm font-medium ${
                isToday(date) ? 'text-orange-600' : 'text-gray-600'
              }`}
            >
              {getDayName(date)}
            </div>
          ))}
        </div>

        {/* Indicateurs des jours */}
        <div className="flex justify-between">
          {weekDates.map((date) => {
            const dateStr = formatDate(date);
            const isCompleted = streakData.weeklyActivity[dateStr] || false;
            const isCurrentDay = isToday(date);
            
            return (
              <div key={dateStr} className="flex flex-col items-center">
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                    isCompleted 
                      ? 'bg-green-500 text-white' 
                      : isCurrentDay 
                        ? 'bg-orange-500 text-white' 
                        : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {isCompleted ? '✓' : date.getDate()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Statistiques supplémentaires */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{streakData.currentStreak}</div>
          <div className="text-xs text-blue-700">Série actuelle</div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{streakData.longestStreak}</div>
          <div className="text-xs text-purple-700">Meilleure série</div>
        </div>
      </div>

      {/* Message d'encouragement */}
      {streakData.currentStreak === 0 && (
        <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm text-orange-800 text-center">
            🎯 Commencez votre série aujourd&apos;hui en terminant un quiz !
          </p>
        </div>
      )}

      {streakData.currentStreak > 0 && streakData.currentStreak < 7 && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800 text-center">
            🚀 {7 - streakData.currentStreak} jour{7 - streakData.currentStreak > 1 ? 's' : ''} pour atteindre une semaine complète !
          </p>
        </div>
      )}

      {streakData.currentStreak >= 7 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 text-center">
            🏆 Incroyable ! Vous maintenez une série de plus d&apos;une semaine !
          </p>
        </div>
      )}
    </div>
  );
}
