import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { UserError } from '@/models/UserError';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    // Calculer la date limite
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - days);

    // Statistiques générales
    const totalErrors = await UserError.countDocuments({ userId: session.user.id });
    const recentErrors = await UserError.countDocuments({ 
      userId: session.user.id, 
      createdAt: { $gte: dateLimit } 
    });

    // Statistiques par type de quiz
    const vocabularyErrors = await UserError.countDocuments({ 
      userId: session.user.id, 
      quizType: 'vocabulary',
      createdAt: { $gte: dateLimit }
    });

    const thematicErrors = await UserError.countDocuments({ 
      userId: session.user.id, 
      quizType: 'thematic',
      createdAt: { $gte: dateLimit }
    });

    // Statistiques par difficulté
    const difficultyStats = await UserError.aggregate([
      { $match: { userId: session.user.id, createdAt: { $gte: dateLimit } } },
      { $group: { _id: '$difficulty', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Statistiques par catégorie
    const categoryStats = await UserError.aggregate([
      { $match: { userId: session.user.id, createdAt: { $gte: dateLimit } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Tendances des 7 derniers jours
    const weeklyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const dayErrors = await UserError.countDocuments({
        userId: session.user.id,
        createdAt: { $gte: date, $lt: nextDate }
      });
      
      weeklyTrend.push({
        date: date.toISOString().split('T')[0],
        count: dayErrors
      });
    }

    // Calculer le taux d'erreur (si on a des données de quiz)
    const errorRate = totalErrors > 0 ? Math.round((recentErrors / totalErrors) * 100) : 0;

    // Recommandations basées sur les statistiques
    const recommendations = [];
    if (vocabularyErrors > thematicErrors) {
      recommendations.push('Concentrez-vous sur le vocabulaire - c\'est votre point faible actuel');
    }
    if (thematicErrors > vocabularyErrors) {
      recommendations.push('Les quiz thématiques nécessitent plus d\'attention');
    }
    if (recentErrors > 10) {
      recommendations.push('Beaucoup d\'erreurs récentes - temps de réviser !');
    }
    if (recentErrors < 3) {
      recommendations.push('Excellent ! Continuez sur cette lancée');
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalErrors,
        recentErrors,
        vocabularyErrors,
        thematicErrors,
        errorRate,
        daysCovered: days,
        difficultyBreakdown: difficultyStats,
        categoryBreakdown: categoryStats,
        weeklyTrend,
        recommendations
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des statistiques' },
      { status: 500 }
    );
  }
}
