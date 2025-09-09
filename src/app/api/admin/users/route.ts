import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Attempt } from "@/models/Attempt";

export async function GET() {
  try {
    await requireAdmin();
    await connectToDatabase();

    // Récupérer tous les utilisateurs avec leurs tentatives
    const users = await User.find().lean();
    
    // Récupérer le nombre de tentatives par utilisateur
    const attemptsByUser = await Attempt.aggregate([
      {
        $group: {
          _id: "$userId",
          count: { $sum: 1 },
          lastAttempt: { $max: "$createdAt" }
        }
      }
    ]);

    // Créer un map pour les tentatives
    const attemptsMap = new Map();
    attemptsByUser.forEach(attempt => {
      attemptsMap.set(String(attempt._id), {
        count: attempt.count,
        lastAttempt: attempt.lastAttempt
      });
    });

    // Enrichir les utilisateurs avec les données des tentatives
    const enrichedUsers = users.map(user => ({
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      lastLogin: (user as { lastLogin?: unknown }).lastLogin || null,
      attemptsCount: attemptsMap.get(String(user._id))?.count || 0,
      lastAttempt: attemptsMap.get(String(user._id))?.lastAttempt || null,
    }));

    return NextResponse.json({
      success: true,
      users: enrichedUsers,
    });

  } catch (error) {
    console.error("Erreur récupération utilisateurs:", error);
    const status = (error && typeof error === 'object' && 'status' in error && typeof error.status === 'number') ? error.status : 500;
    const message = status === 401 ? "Non autorisé" : status === 403 ? "Interdit" : "Erreur serveur";
    return NextResponse.json({ error: message }, { status });
  }
}
