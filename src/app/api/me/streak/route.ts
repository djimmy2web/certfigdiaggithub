import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth-helpers';
import { connectToDatabase } from '@/lib/mongodb';
import { Attempt } from '@/models/Attempt';

export async function GET() {
  try {
    const session = await requireSession();
    await connectToDatabase();

    // Calculer les dates pour cette semaine
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1); // Lundi de cette semaine
    monday.setHours(0, 0, 0, 0);

    const endDate = new Date(monday);
    endDate.setDate(endDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);

    // Récupérer toutes les tentatives de l'utilisateur
    const attempts = await Attempt.find({ 
      userId: session.user!.id 
    }).sort({ createdAt: -1 });

    // Calculer l'activité de cette semaine
    const weeklyActivity: { [key: string]: boolean } = {};
    const weekStart = new Date(monday);
    
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(weekStart);
      currentDate.setDate(weekStart.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // Vérifier s'il y a eu une tentative ce jour-là
      const hasActivity = attempts.some(attempt => {
        const attemptDate = attempt.createdAt.toISOString().split('T')[0];
        return attemptDate === dateStr;
      });
      
      weeklyActivity[dateStr] = hasActivity;
    }

    // Calculer le streak actuel
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Parcourir les tentatives du plus récent au plus ancien
    const sortedAttempts = attempts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    if (sortedAttempts.length > 0) {
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      
      // Vérifier le streak actuel (jours consécutifs depuis aujourd'hui)
      for (let i = 0; i < 365; i++) { // Limite à 1 an pour éviter les boucles infinies
        const dateStr = currentDate.toISOString().split('T')[0];
        const hasActivity = sortedAttempts.some(attempt => {
          const attemptDate = attempt.createdAt.toISOString().split('T')[0];
          return attemptDate === dateStr;
        });

        if (hasActivity) {
          currentStreak++;
          tempStreak++;
        } else {
          break; // Streak brisé
        }

        // Passer au jour précédent
        currentDate.setDate(currentDate.getDate() - 1);
      }

      // Calculer le streak le plus long
      tempStreak = 0;
      let lastDate: Date | null = null;

      for (const attempt of sortedAttempts) {
        const attemptDate = new Date(attempt.createdAt);
        attemptDate.setHours(0, 0, 0, 0);

        if (lastDate === null) {
          tempStreak = 1;
          lastDate = attemptDate;
        } else {
          const diffTime = Math.abs(lastDate.getTime() - attemptDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            // Jours consécutifs
            tempStreak++;
          } else {
            // Streak brisé, vérifier s'il est plus long que le record
            if (tempStreak > longestStreak) {
              longestStreak = tempStreak;
            }
            tempStreak = 1;
          }
          lastDate = attemptDate;
        }
      }

      // Vérifier le dernier streak
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    }

    return NextResponse.json({
      success: true,
      currentStreak,
      longestStreak,
      weeklyActivity
    });

  } catch (error: unknown) {
    console.error('Erreur lors de la récupération du streak:', error);
    const status = (error && typeof error === 'object' && 'status' in error && typeof error.status === 'number') ? error.status : 500;
    const message = status === 401 ? 'Non autorisé' : status === 403 ? 'Interdit' : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status });
  }
}
