import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { connectToDatabase } from "@/lib/mongodb";
import { Attempt } from "@/models/Attempt";

export async function GET() {
  try {
    await requireAdmin();
    await connectToDatabase();

    // Récupérer toutes les tentatives
    const attempts = await Attempt.find().lean();
    
    // Calculer les statistiques
    const total = attempts.length;
    
    // Score moyen
    const totalScore = attempts.reduce((sum, attempt) => sum + attempt.score, 0);
    const averageScore = total > 0 ? Math.round((totalScore / total) * 100) / 100 : 0;
    
    // Nombre d'utilisateurs uniques
    const uniqueUsers = new Set(attempts.map(attempt => String(attempt.userId))).size;
    
    // Tentatives récentes (dernières 7 jours)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const recentAttempts = attempts.filter(attempt => 
      new Date(attempt.createdAt) > oneWeekAgo
    ).length;

    return NextResponse.json({
      total,
      averageScore,
      totalUsers: uniqueUsers,
      recentAttempts,
    });
  } catch (error) {
    const status = (error && typeof error === 'object' && 'status' in error && typeof error.status === 'number') ? error.status : 500;
    const message = status === 401 ? "Non autorisé" : status === 403 ? "Interdit" : "Erreur serveur";
    return NextResponse.json({ error: message }, { status });
  }
}
