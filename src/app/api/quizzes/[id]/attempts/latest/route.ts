import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth-helpers";
import { connectToDatabase } from "@/lib/mongodb";
import { Attempt } from "@/models/Attempt";
import mongoose from "mongoose";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    await connectToDatabase();

    const { id } = await context.params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Quiz invalide" }, { status: 400 });
    }

    const attempt = await Attempt.findOne({
      userId: new mongoose.Types.ObjectId(session.user!.id),
      quizId: new mongoose.Types.ObjectId(id),
    })
    .sort({ createdAt: -1 })
    .lean();

    if (!attempt) {
      return NextResponse.json({ error: "Aucune tentative trouvée" }, { status: 404 });
    }

    return NextResponse.json({
      score: attempt.score,
      total: attempt.answers.length,
      answers: attempt.answers,
      createdAt: attempt.createdAt,
    });
  } catch (error) {
    const status = (error && typeof error === 'object' && 'status' in error && typeof error.status === 'number') ? error.status : 500;
    const message = status === 401 ? "Non autorisé" : "Erreur serveur";
    return NextResponse.json({ error: message }, { status });
  }
}
