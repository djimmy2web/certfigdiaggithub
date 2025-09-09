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

    // Récupérer toutes les divisions triées par ordre
    const divisions = await Division.find({}).sort({ order: 1 });

    // Traiter chaque division
    for (let i = 0; i < divisions.length; i++) {
      const division = divisions[i];
      
      // Récupérer le classement de cette division pour cette semaine
      const weeklyRanking = await WeeklyRanking.findOne({
        weekStart: startDate,
        divisionId: division._id
      });

      if (!weeklyRanking) continue;

      const rankings = weeklyRanking.rankings;

      // Traiter les promotions (top 5)
      const promotedPlayers = rankings.slice(0, division.promotionThreshold);
      
      // Traiter les rétrogradations (bottom 5)
      const relegatedPlayers = rankings.slice(-division.relegationThreshold);

      // Mettre à jour les statuts dans le classement
      for (const ranking of rankings) {
        if (promotedPlayers.some((p: { userId: unknown }) => String(p.userId) === ranking.userId.toString())) {
          ranking.status = 'promoted';
        } else if (relegatedPlayers.some((p: { userId: unknown }) => String(p.userId) === ranking.userId.toString())) {
          ranking.status = 'relegated';
        } else {
          ranking.status = 'stayed';
        }
      }

      // Appliquer les changements de division aux utilisateurs
      for (const player of promotedPlayers) {
        if (i > 0) { // Pas de promotion depuis la division la plus haute
          const previousDivision = divisions[i - 1];
          await User.findByIdAndUpdate(player.userId, {
            points: previousDivision.minPoints + 1 // Juste au-dessus du seuil minimum
          });
        }
      }

      for (const player of relegatedPlayers) {
        if (i < divisions.length - 1) { // Pas de rétrogradation depuis la division la plus basse
          const nextDivision = divisions[i + 1];
          await User.findByIdAndUpdate(player.userId, {
            points: nextDivision.minPoints + 1 // Juste au-dessus du seuil minimum
          });
        }
      }

      // Marquer le classement comme traité
      weeklyRanking.isProcessed = true;
      await weeklyRanking.save();
    }

    return NextResponse.json({
      success: true,
      message: 'Promotions et rétrogradations traitées avec succès'
    });

  } catch (error: unknown) {
    console.error('Erreur lors du traitement des promotions:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors du traitement' },
      { status: 500 }
    );
  }
}
