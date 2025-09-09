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
    endDate.setDate(endDate.getDate() + 6);

    console.log(`🚀 Début du processus hebdomadaire pour la semaine du ${startDate.toISOString()}`);

    // Étape 1: Calculer les classements
    console.log('📊 Calcul des classements...');
    const divisions = await Division.find({}).sort({ order: 1 });

    for (const division of divisions) {
      const userQuery: Record<string, unknown> = { points: { $gte: division.minPoints } };
      if (division.maxPoints) {
        (userQuery.points as Record<string, unknown>).$lte = division.maxPoints;
      }

      const users = await User.find(userQuery)
        .sort({ points: -1 })
        .select('_id username points');

      const rankings = users.map((user, index) => ({
        userId: user._id,
        username: user.name,
        points: user.points,
        rank: index + 1,
        status: 'new' as const
      }));

      let weeklyRanking = await WeeklyRanking.findOne({
        weekStart: startDate,
        divisionId: division._id
      });

      if (weeklyRanking) {
        weeklyRanking.rankings = rankings;
        weeklyRanking.weekEnd = endDate;
        await weeklyRanking.save();
      } else {
        weeklyRanking = new WeeklyRanking({
          weekStart: startDate,
          weekEnd: endDate,
          divisionId: division._id,
          rankings
        });
        await weeklyRanking.save();
      }

      console.log(`✅ Classement calculé pour ${division.name}: ${rankings.length} joueurs`);
    }

    // Étape 2: Traiter les promotions et rétrogradations
    console.log('🔄 Traitement des promotions et rétrogradations...');
    
    for (let i = 0; i < divisions.length; i++) {
      const division = divisions[i];
      
      const weeklyRanking = await WeeklyRanking.findOne({
        weekStart: startDate,
        divisionId: division._id
      });

      if (!weeklyRanking) continue;

      const rankings = weeklyRanking.rankings;
      const promotedPlayers = rankings.slice(0, division.promotionThreshold);
      const relegatedPlayers = rankings.slice(-division.relegationThreshold);

      // Mettre à jour les statuts
      for (const ranking of rankings) {
        if (promotedPlayers.some((p: { userId: unknown }) => String(p.userId) === ranking.userId.toString())) {
          ranking.status = 'promoted';
        } else if (relegatedPlayers.some((p: { userId: unknown }) => String(p.userId) === ranking.userId.toString())) {
          ranking.status = 'relegated';
        } else {
          ranking.status = 'stayed';
        }
      }

      // Appliquer les changements de division
      for (const player of promotedPlayers) {
        if (i > 0) {
          const previousDivision = divisions[i - 1];
          await User.findByIdAndUpdate(player.userId, {
            points: previousDivision.minPoints + 1
          });
          console.log(`⬆️ ${player.username} promu de ${division.name} vers ${previousDivision.name}`);
        }
      }

      for (const player of relegatedPlayers) {
        if (i < divisions.length - 1) {
          const nextDivision = divisions[i + 1];
          await User.findByIdAndUpdate(player.userId, {
            points: nextDivision.minPoints + 1
          });
          console.log(`⬇️ ${player.username} rétrogradé de ${division.name} vers ${nextDivision.name}`);
        }
      }

      weeklyRanking.isProcessed = true;
      await weeklyRanking.save();
    }

    console.log('✅ Processus hebdomadaire terminé avec succès');

    return NextResponse.json({
      success: true,
      message: 'Processus hebdomadaire terminé avec succès',
      weekStart: startDate,
      weekEnd: endDate,
      summary: {
        divisionsProcessed: divisions.length,
        totalRankings: await WeeklyRanking.countDocuments({ weekStart: startDate })
      }
    });

  } catch (error: unknown) {
    console.error('❌ Erreur lors du processus hebdomadaire:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors du processus hebdomadaire' },
      { status: 500 }
    );
  }
}
