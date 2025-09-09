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

    // Vérifier s'il existe déjà une progression pour ce quiz
    let progress = await QuizProgress.findOne({ userId, quizId }).lean();

    if (!progress) {
      // Créer une nouvelle progression
      progress = await QuizProgress.create({
        userId,
        quizId,
        lives: 5,
        currentQuestionIndex: 0,
        answers: [],
        isCompleted: false,
        isFailed: false,
        startedAt: new Date(),
        lastActivityAt: new Date(),
      });
    } else {
      // Si la progression existe mais est terminée, la réinitialiser
      if (progress.isCompleted || progress.isFailed) {
        await QuizProgress.updateOne(
          { userId, quizId },
          {
            $set: {
              lives: 5,
              currentQuestionIndex: 0,
              answers: [],
              isCompleted: false,
              isFailed: false,
              startedAt: new Date(),
              lastActivityAt: new Date(),
            },
            $unset: { completedAt: 1 },
          }
        );
        progress = await QuizProgress.findOne({ userId, quizId }).lean();
      }
    }

    // Retourner la question actuelle
    const currentQuestion = quiz.questions[progress!.currentQuestionIndex];
    if (!currentQuestion) {
      return NextResponse.json({ error: "Question introuvable" }, { status: 404 });
    }

    return NextResponse.json({
      progress: {
        lives: progress!.lives,
        currentQuestionIndex: progress!.currentQuestionIndex,
        totalQuestions: quiz.questions.length,
        isCompleted: progress!.isCompleted,
        isFailed: progress!.isFailed,
      },
      question: {
        index: progress!.currentQuestionIndex,
        text: currentQuestion.text,
        explanation: currentQuestion.explanation,
        media: currentQuestion.media,
        choices: currentQuestion.choices.map((choice, index) => ({
          index,
          text: choice.text,
          media: choice.media,
        })),
      },
    });

  } catch (error) {
    console.error("Erreur lors du démarrage du quiz:", error);
    const status = (error && typeof error === 'object' && 'status' in error && typeof error.status === 'number') ? error.status : 500;
    const message = status === 401 ? "Non autorisé" : status === 403 ? "Interdit" : "Erreur serveur";
    return NextResponse.json({ error: message }, { status });
  }
}
