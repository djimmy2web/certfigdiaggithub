import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth-helpers";
import { connectToDatabase } from "@/lib/mongodb";
import { Quiz } from "@/models/Quiz";
import { Attempt } from "@/models/Attempt";
import { Badge } from "@/models/Badge";
import { UserBadge } from "@/models/UserBadge";
import mongoose from "mongoose";

const SubmitSchema = z.object({
  answers: z.array(
    z.object({ questionIndex: z.number().int().min(0), choiceIndex: z.number().int().min(0) })
  ),
});

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    await connectToDatabase();

    const { id } = await context.params;
    if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Quiz invalide" }, { status: 400 });

    const quiz = await Quiz.findById(id).lean();
    if (!quiz || !quiz.isPublished) return NextResponse.json({ error: "Quiz introuvable" }, { status: 404 });

    const body = await req.json();
    const { answers } = SubmitSchema.parse(body);

    let score = 0;
    const detailed = answers.map(({ questionIndex, choiceIndex }) => {
      const q = quiz.questions[questionIndex];
      const ok = Boolean(q && q.choices?.[choiceIndex]?.isCorrect);
      if (ok) score += 1;
      return { questionIndex, choiceIndex, isCorrect: ok };
    });

    await Attempt.create({
      userId: new mongoose.Types.ObjectId(session.user!.id),
      quizId: new mongoose.Types.ObjectId(id),
      score,
      answers: detailed,
    });

    // Attribution de badges actifs
    const activeBadges = await Badge.find({ isActive: true }).lean();
    const eligible = activeBadges.filter((b: unknown) => {
      const badge = b as { criteria?: { minScore?: number; quizId?: unknown } };
      const okScore = badge.criteria?.minScore == null || score >= badge.criteria.minScore;
      const okQuiz = !badge.criteria?.quizId || String(badge.criteria.quizId) === String(quiz._id);
      return okScore && okQuiz;
    });
    if (eligible.length > 0) {
      const userId = new mongoose.Types.ObjectId(session.user!.id);
      for (const b of eligible) {
        try {
          const badge = b as { _id: unknown };
          await UserBadge.updateOne(
            { userId, badgeId: badge._id },
            { $setOnInsert: { awardedAt: new Date() } },
            { upsert: true }
          );
        } catch {}
      }
    }

    return NextResponse.json({ score, total: quiz.questions.length });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues.map((i) => i.message).join(", ") || "Données invalides";
      return NextResponse.json({ error: message }, { status: 400 });
    }
    const status = (error && typeof error === 'object' && 'status' in error && typeof error.status === 'number') ? error.status : 500;
    const message = status === 401 ? "Non autorisé" : status === 403 ? "Interdit" : "Erreur serveur";
    return NextResponse.json({ error: message }, { status });
  }
}


