import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth-helpers';
import { connectToDatabase } from '@/lib/mongodb';
import { Attempt } from '@/models/Attempt';
import { QuizProgress } from '@/models/QuizProgress';

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const weekStart = searchParams.get('weekStart');

    // Calculer la semaine actuelle si non spécifiée
    let startDate: Date;
    if (weekStart) {
      startDate = new Date(weekStart);
    } else {
      const now = new Date();
      const monday = new Date(now);
      monday.setDate(now.getDate() - now.getDay() + 1); // Lundi de cette semaine
      monday.setHours(0, 0, 0, 0);
      startDate = monday;
    }

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);

    console.log(`📊 Statistiques personnelles du ${startDate.toLocaleDateString('fr-FR')} au ${endDate.toLocaleDateString('fr-FR')}`);

    // Statistiques des tentatives personnelles (quiz terminés)
    const attemptsStats = await Attempt.aggregate([
      {
        $match: {
          userId: session.user!.id,
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 },
          totalScore: { $sum: "$score" },
          avgScore: { $avg: "$score" },
          totalTime: { $sum: "$timeSpent" }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Statistiques des progressions personnelles (quiz en cours)
    const progressStats = await QuizProgress.aggregate([
      {
        $match: {
          userId: session.user!.id,
          startedAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$startedAt" }
          },
          started: { $sum: 1 },
          completed: {
            $sum: {
              $cond: [{ $eq: ["$isCompleted", true] }, 1, 0]
            }
          },
          failed: {
            $sum: {
              $cond: [{ $eq: ["$isFailed", true] }, 1, 0]
            }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Statistiques par jour de la semaine
    const daysOfWeek = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const weeklyData = [];

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayName = daysOfWeek[currentDate.getDay()];

      const attemptsForDay = attemptsStats.find(stat => stat._id === dateStr) || {
        count: 0,
        totalScore: 0,
        avgScore: 0,
        totalTime: 0
      };

      const progressForDay = progressStats.find(stat => stat._id === dateStr) || {
        started: 0,
        completed: 0,
        failed: 0
      };

      weeklyData.push({
        date: dateStr,
        dayName,
        attempts: attemptsForDay.count,
        avgScore: Math.round(attemptsForDay.avgScore * 100) / 100,
        totalTime: Math.round(attemptsForDay.totalTime / 60), // Convertir en minutes
        started: progressForDay.started,
        completed: progressForDay.completed,
        failed: progressForDay.failed
      });
    }

    // Statistiques globales de la semaine
    const totalAttempts = attemptsStats.reduce((sum, stat) => sum + stat.count, 0);
    const totalStarted = progressStats.reduce((sum, stat) => sum + stat.started, 0);
    const totalCompleted = progressStats.reduce((sum, stat) => sum + stat.completed, 0);
    const totalFailed = progressStats.reduce((sum, stat) => sum + stat.failed, 0);
    const totalTime = attemptsStats.reduce((sum, stat) => sum + stat.totalTime, 0);
    const avgScore = attemptsStats.length > 0 
      ? Math.round(attemptsStats.reduce((sum, stat) => sum + stat.avgScore, 0) / attemptsStats.length * 100) / 100
      : 0;

    return NextResponse.json({
      success: true,
      weekStart: startDate,
      weekEnd: endDate,
      weeklyData,
      summary: {
        totalAttempts,
        totalStarted,
        totalCompleted,
        totalFailed,
        totalTime: Math.round(totalTime / 60), // Convertir en minutes
        avgScore,
        completionRate: totalStarted > 0 ? Math.round((totalCompleted / totalStarted) * 100) : 0
      }
    });

  } catch (error: unknown) {
    console.error('Erreur lors de la récupération des statistiques personnelles:', error);
    const status = (error && typeof error === 'object' && 'status' in error && typeof error.status === 'number') ? error.status : 500;
    const message = status === 401 ? 'Non autorisé' : status === 403 ? 'Interdit' : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status });
  }
}
