import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-helpers';
import { connectToDatabase } from '@/lib/mongodb';
import Division from '@/models/Division';
import WeeklyRanking from '@/models/WeeklyRanking';
import { User } from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    await connectToDatabase();

    const { weekStart } = await request.json();
    
    if (!weekStart) {
      return NextResponse.json(
        { error: 'Date de début de semaine requise' },
        { status: 400 }
      );
    }

    const startDate = new Date(weekStart);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6); // Fin de semaine (dimanche)

    // Récupérer toutes les divisions
    const divisions = await Division.find({}).sort({ order: 1 });

    // Pour chaque division, calculer le classement
    for (const division of divisions) {
      // Construire la requête pour les utilisateurs dans cette division
      const userQuery: Record<string, unknown> = { points: { $gte: division.minPoints } };
      if (division.maxPoints) {
        (userQuery.points as Record<string, unknown>).$lte = division.maxPoints;
      }

      // Récupérer les utilisateurs de cette division, triés par points
      const users = await User.find(userQuery)
        .sort({ points: -1 })
        .select('_id username points');

      // Créer les rankings pour cette division
      const rankings = users.map((user, index) => ({
        userId: user._id,
        username: user.name,
        points: user.points,
        rank: index + 1,
        status: 'new' as const
      }));

      // Vérifier s'il existe déjà un classement pour cette semaine
      let weeklyRanking = await WeeklyRanking.findOne({
        weekStart: startDate,
        divisionId: division._id
      });

      if (weeklyRanking) {
        // Mettre à jour le classement existant
        weeklyRanking.rankings = rankings;
        weeklyRanking.weekEnd = endDate;
        await weeklyRanking.save();
      } else {
        // Créer un nouveau classement
        weeklyRanking = new WeeklyRanking({
          weekStart: startDate,
          weekEnd: endDate,
          divisionId: division._id,
          rankings
        });
        await weeklyRanking.save();
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Classements hebdomadaires calculés avec succès',
      weekStart: startDate,
      weekEnd: endDate
    });

  } catch (error: unknown) {
    console.error('Erreur lors du calcul des classements:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors du calcul' },
      { status: 500 }
    );
  }
}
