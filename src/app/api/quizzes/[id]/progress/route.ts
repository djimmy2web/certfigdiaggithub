import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth-helpers";
import { connectToDatabase } from "@/lib/mongodb";
import { Quiz } from "@/models/Quiz";
import { QuizProgress } from "@/models/QuizProgress";
import mongoose from "mongoose";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
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

    // Récupérer la progression actuelle
    const progress = await QuizProgress.findOne({ userId, quizId }).lean();

    if (!progress) {
      return NextResponse.json({
        hasProgress: false,
        quiz: {
          id: quiz._id,
          title: quiz.title,
          description: quiz.description,
          totalQuestions: quiz.questions.length,
        },
      });
    }

    // Si le quiz est terminé, retourner les résultats finaux
    if (progress.isCompleted || progress.isFailed) {
      const correctAnswers = progress.answers.filter(a => a.isCorrect).length;
      return NextResponse.json({
        hasProgress: true,
        progress: {
          lives: progress.lives,
          currentQuestionIndex: progress.currentQuestionIndex,
          totalQuestions: quiz.questions.length,
          isCompleted: progress.isCompleted,
          isFailed: progress.isFailed,
          startedAt: progress.startedAt,
          completedAt: progress.completedAt,
          correctAnswers,
          totalAnswers: progress.answers.length,
          percentage: progress.answers.length > 0 ? Math.round((correctAnswers / progress.answers.length) * 100) : 0,
        },
        quiz: {
          id: quiz._id,
          title: quiz.title,
          description: quiz.description,
        },
      });
    }

    // Si le quiz est en cours, retourner la question actuelle
    const currentQuestion = quiz.questions[progress.currentQuestionIndex];
    if (!currentQuestion) {
      return NextResponse.json({ error: "Question introuvable" }, { status: 404 });
    }

    return NextResponse.json({
      hasProgress: true,
      progress: {
        lives: progress.lives,
        currentQuestionIndex: progress.currentQuestionIndex,
        totalQuestions: quiz.questions.length,
        isCompleted: progress.isCompleted,
        isFailed: progress.isFailed,
        startedAt: progress.startedAt,
        lastActivityAt: progress.lastActivityAt,
      },
      currentQuestion: {
        index: progress.currentQuestionIndex,
        text: currentQuestion.text,
        explanation: currentQuestion.explanation,
        media: currentQuestion.media,
        choices: currentQuestion.choices.map((choice, index) => ({
          index,
          text: choice.text,
          media: choice.media,
        })),
      },
      quiz: {
        id: quiz._id,
        title: quiz.title,
        description: quiz.description,
      },
    });

  } catch (error) {
    console.error("Erreur lors de la récupération de la progression:", error);
    const status = (error && typeof error === 'object' && 'status' in error && typeof error.status === 'number') ? error.status : 500;
    const message = status === 401 ? "Non autorisé" : status === 403 ? "Interdit" : "Erreur serveur";
    return NextResponse.json({ error: message }, { status });
  }
}
