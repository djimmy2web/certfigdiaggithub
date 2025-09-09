import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Division from '@/models/Division';
import WeeklyRanking from '@/models/WeeklyRanking';
import { User } from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    // Vérifier une clé secrète pour sécuriser l'endpoint
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET_TOKEN || 'admin-trigger-local-2024';
    
    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      console.log('🔐 Token reçu:', authHeader);
      console.log('🔐 Token attendu:', `Bearer ${expectedToken}`);
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // Calculer automatiquement la semaine actuelle (lundi)
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1); // Lundi de cette semaine
    monday.setHours(0, 0, 0, 0);

    const startDate = monday;
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    console.log(`🚀 Processus automatique hebdomadaire - Semaine du ${startDate.toISOString()}`);

    // Vérifier si le processus a déjà été exécuté pour cette semaine
    const existingRankings = await WeeklyRanking.find({ weekStart: startDate });
    if (existingRankings.length > 0) {
      console.log('⚠️ Processus déjà exécuté pour cette semaine');
      return NextResponse.json({
        success: true,
        message: 'Processus déjà exécuté pour cette semaine',
        weekStart: startDate,
        weekEnd: endDate
      });
    }

    // Étape 1: Calculer les classements
    console.log('📊 Calcul automatique des classements...');
    const divisions = await Division.find({}).sort({ order: 1 });

    for (const division of divisions) {
      const userQuery: Record<string, unknown> = { points: { $gte: division.minPoints } };
      if (division.maxPoints) {
        (userQuery.points as Record<string, unknown>).$lte = division.maxPoints;
      }

      const users = await User.find(userQuery)
        .sort({ points: -1 })
        .select('_id name points');

      const rankings = users.map((user, index) => ({
        userId: user._id,
        username: user.name || 'Utilisateur',
        points: user.points || 0,
        rank: index + 1,
        status: 'new' as const
      }));

      const weeklyRanking = new WeeklyRanking({
        weekStart: startDate,
        weekEnd: endDate,
        divisionId: division._id,
        rankings
      });
      await weeklyRanking.save();

      console.log(`✅ Classement calculé pour ${division.name}: ${rankings.length} joueurs`);
    }

    // Étape 2: Traiter les promotions et rétrogradations
    console.log('🔄 Traitement automatique des promotions et rétrogradations...');
    
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

    console.log('✅ Processus automatique hebdomadaire terminé avec succès');

    return NextResponse.json({
      success: true,
      message: 'Processus automatique hebdomadaire terminé avec succès',
      weekStart: startDate,
      weekEnd: endDate,
      summary: {
        divisionsProcessed: divisions.length,
        totalRankings: await WeeklyRanking.countDocuments({ weekStart: startDate })
      }
    });

  } catch (error: unknown) {
    console.error('❌ Erreur lors du processus automatique:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors du processus automatique' },
      { status: 500 }
    );
  }
}
