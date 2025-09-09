import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth-helpers";
import { connectToDatabase } from "@/lib/mongodb";
import { Quiz } from "@/models/Quiz";
import { QuizProgress } from "@/models/QuizProgress";
import mongoose from "mongoose";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    await connectToDatabase();

    const { id } = await context.params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Quiz invalide" }, { status: 400 });
    }

    const quiz = await Quiz.findById(id).lean();
    if (!quiz || !quiz.isPublished) {
      return NextResponse.json({ error: "Quiz introuvable" }, { status: 404 });
    }

    const userId = new mongoose.Types.ObjectId(session.user!.id);
    const quizId = new mongoose.Types.ObjectId(id);

    // Supprimer la progression existante
    await QuizProgress.deleteOne({ userId, quizId });

    // Créer une nouvelle progression avec 5 vies
    const newProgress = new QuizProgress({
      userId,
      quizId,
      lives: 5,
      currentQuestionIndex: 0,
      answers: [],
      isCompleted: false,
      isFailed: false,
      startedAt: new Date(),
      lastActivityAt: new Date()
    });

    await newProgress.save();

    // Récupérer la première question
    const firstQuestion = quiz.questions[0];
    const questionWithChoices = {
      index: 0,
      text: firstQuestion.text,
      explanation: firstQuestion.explanation,
      media: firstQuestion.media,
      choices: firstQuestion.choices.map((choice: unknown, index: number) => ({
        index,
        text: (choice as { text: string }).text,
        media: (choice as { media?: unknown }).media
      }))
    };

    return NextResponse.json({
      success: true,
      message: "Quiz réinitialisé avec succès",
      progress: {
        lives: 5,
        currentQuestionIndex: 0,
        totalQuestions: quiz.questions.length,
        isCompleted: false,
        isFailed: false,
        startedAt: newProgress.startedAt,
        lastActivityAt: newProgress.lastActivityAt
      },
      question: questionWithChoices
    });

  } catch (error) {
    console.error("Erreur lors de la réinitialisation:", error);
    const status = (error && typeof error === 'object' && 'status' in error && typeof error.status === 'number') ? error.status : 500;
    const message = status === 401 ? "Non autorisé" : status === 403 ? "Interdit" : "Erreur serveur";
    return NextResponse.json({ error: message }, { status });
  }
}
