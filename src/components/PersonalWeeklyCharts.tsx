"use client";
import { useState, useEffect, useCallback } from 'react';

interface WeeklyData {
  date: string;
  dayName: string;
  attempts: number;
  avgScore: number;
  totalTime: number;
  started: number;
  completed: number;
  failed: number;
}

interface WeeklySummary {
  totalAttempts: number;
  totalStarted: number;
  totalCompleted: number;
  totalFailed: number;
  totalTime: number;
  avgScore: number;
  completionRate: number;
}

interface WeeklyStats {
  weekStart: string;
  weekEnd: string;
  weeklyData: WeeklyData[];
  summary: WeeklySummary;
}

export default function PersonalWeeklyCharts() {
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState<string>('');

  const loadWeeklyStats = useCallback(async () => {
    try {
      setLoading(true);
      const url = selectedWeek 
        ? `/api/me/stats/weekly?weekStart=${selectedWeek}`
        : '/api/me/stats/weekly';
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setStats(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedWeek]);

  useEffect(() => {
    loadWeeklyStats();
  }, [loadWeeklyStats]);

  const getMaxValue = (data: WeeklyData[]) => {
    const maxAttempts = Math.max(...data.map(d => d.attempts));
    const maxStarted = Math.max(...data.map(d => d.started));
    const maxCompleted = Math.max(...data.map(d => d.completed));
    return Math.max(maxAttempts, maxStarted, maxCompleted, 1);
  };

  const getBarHeight = (value: number, maxValue: number) => {
    return Math.max((value / maxValue) * 100, 2);
  };

  const getBarColor = (type: 'attempts' | 'started' | 'completed' | 'failed') => {
    switch (type) {
      case 'attempts': return 'bg-blue-500';
      case 'started': return 'bg-green-500';
      case 'completed': return 'bg-emerald-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
  };

  if (loading) {
    return (
      <div className="bg-white border rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white border rounded-lg p-6">
        <p className="text-gray-500">Aucune donnée disponible</p>
      </div>
    );
  }

  const maxValue = getMaxValue(stats.weeklyData);

  return (
    <div className="space-y-6">
      {/* En-tête avec sélecteur de semaine */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">📊 Mon Activité Hebdomadaire</h2>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Semaine :</label>
            <input
              type="date"
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            />
          </div>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          Semaine du {new Date(stats.weekStart).toLocaleDateString('fr-FR')} au {new Date(stats.weekEnd).toLocaleDateString('fr-FR')}
        </p>

        {/* Statistiques globales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.summary.totalAttempts}</div>
            <div className="text-sm text-blue-700">Quiz terminés</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.summary.totalStarted}</div>
            <div className="text-sm text-green-700">Quiz commencés</div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600">{stats.summary.completionRate}%</div>
            <div className="text-sm text-emerald-700">Taux de réussite</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{formatTime(stats.summary.totalTime)}</div>
            <div className="text-sm text-purple-700">Temps total</div>
          </div>
        </div>
      </div>

      {/* Graphique des activités par jour */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">📈 Mon Activité par Jour</h3>
        
        <div className="flex items-end justify-between h-64 space-x-2">
          {stats.weeklyData.map((day) => (
            <div key={day.date} className="flex-1 flex flex-col items-center">
              {/* Barres empilées */}
              <div className="w-full h-48 flex flex-col justify-end space-y-1">
                {/* Quiz terminés */}
                <div
                  className={`${getBarColor('attempts')} rounded-t transition-all duration-300`}
                  style={{ height: `${getBarHeight(day.attempts, maxValue)}%` }}
                  title={`${day.attempts} quiz terminés`}
                ></div>
                
                {/* Quiz commencés */}
                <div
                  className={`${getBarColor('started')} transition-all duration-300`}
                  style={{ height: `${getBarHeight(day.started, maxValue)}%` }}
                  title={`${day.started} quiz commencés`}
                ></div>
                
                {/* Quiz échoués */}
                <div
                  className={`${getBarColor('failed')} rounded-b transition-all duration-300`}
                  style={{ height: `${getBarHeight(day.failed, maxValue)}%` }}
                  title={`${day.failed} quiz échoués`}
                ></div>
              </div>
              
              {/* Jour de la semaine */}
              <div className="mt-2 text-xs text-gray-600 text-center">
                <div className="font-medium">{day.dayName.slice(0, 3)}</div>
                <div className="text-xs">{new Date(day.date).getDate()}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Légende */}
        <div className="flex justify-center space-x-6 mt-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Terminés</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Commençés</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Échoués</span>
          </div>
        </div>
      </div>

      {/* Tableau détaillé */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">📋 Mes Détails par Jour</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Jour</th>
                <th className="text-center py-2">Terminés</th>
                <th className="text-center py-2">Commençés</th>
                <th className="text-center py-2">Échoués</th>
                <th className="text-center py-2">Score Moyen</th>
                <th className="text-center py-2">Temps</th>
              </tr>
            </thead>
            <tbody>
              {stats.weeklyData.map((day) => (
                <tr key={day.date} className="border-b hover:bg-gray-50">
                  <td className="py-2 font-medium">{day.dayName}</td>
                  <td className="py-2 text-center">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                      {day.attempts}
                    </span>
                  </td>
                  <td className="py-2 text-center">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                      {day.started}
                    </span>
                  </td>
                  <td className="py-2 text-center">
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                      {day.failed}
                    </span>
                  </td>
                  <td className="py-2 text-center font-medium">
                    {day.avgScore > 0 ? `${day.avgScore}%` : '-'}
                  </td>
                  <td className="py-2 text-center text-sm">
                    {day.totalTime > 0 ? formatTime(day.totalTime) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>


    </div>
  );
}
