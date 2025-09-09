import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { connectToDatabase } from "@/lib/mongodb";
import { QuizProgress } from "@/models/QuizProgress";

export async function GET() {
  try {
    await requireAdmin();
    await connectToDatabase();

    // Récupérer toutes les progressions avec les détails des quiz et utilisateurs
    const progressions = await QuizProgress.aggregate([
      {
        $lookup: {
          from: "quizzes",
          localField: "quizId",
          foreignField: "_id",
          as: "quiz"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: "$quiz"
      },
      {
        $unwind: "$user"
      },
      {
        $project: {
          quizId: 1,
          userId: 1,
          quizTitle: "$quiz.title",
          userName: "$user.name",
          userEmail: "$user.email",
          lives: 1,
          currentQuestionIndex: 1,
          isCompleted: 1,
          isFailed: 1,
          startedAt: 1,
          completedAt: 1,
          lastActivityAt: 1,
          correctAnswers: { $size: { $filter: { input: "$answers", cond: "$$this.isCorrect" } } },
          totalAnswers: { $size: "$answers" }
        }
      }
    ]);

    // Statistiques globales
    const totalProgressions = progressions.length;
    const completedProgressions = progressions.filter(p => p.isCompleted).length;
    const failedProgressions = progressions.filter(p => p.isFailed).length;
    const activeProgressions = progressions.filter(p => !p.isCompleted && !p.isFailed).length;

    // Statistiques par quiz
    const quizStats = await QuizProgress.aggregate([
      {
        $lookup: {
          from: "quizzes",
          localField: "quizId",
          foreignField: "_id",
          as: "quiz"
        }
      },
      {
        $unwind: "$quiz"
      },
      {
        $group: {
          _id: "$quizId",
          quizTitle: { $first: "$quiz.title" },
          totalAttempts: { $sum: 1 },
          completedAttempts: { $sum: { $cond: ["$isCompleted", 1, 0] } },
          failedAttempts: { $sum: { $cond: ["$isFailed", 1, 0] } },
          activeAttempts: { $sum: { $cond: [{ $and: ["$isCompleted", "$isFailed"] }, 0, 1] } },
          avgLivesRemaining: { $avg: "$lives" },
          avgCorrectAnswers: { $avg: { $size: { $filter: { input: "$answers", cond: "$$this.isCorrect" } } } }
        }
      },
      {
        $sort: { totalAttempts: -1 }
      }
    ]);

    // Statistiques par utilisateur
    const userStats = await QuizProgress.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: "$user"
      },
      {
        $group: {
          _id: "$userId",
          userName: { $first: "$user.name" },
          userEmail: { $first: "$user.email" },
          totalAttempts: { $sum: 1 },
          completedAttempts: { $sum: { $cond: ["$isCompleted", 1, 0] } },
          failedAttempts: { $sum: { $cond: ["$isFailed", 1, 0] } },
          activeAttempts: { $sum: { $cond: [{ $and: ["$isCompleted", "$isFailed"] }, 0, 1] } },
          avgLivesRemaining: { $avg: "$lives" },
          avgCorrectAnswers: { $avg: { $size: { $filter: { input: "$answers", cond: "$$this.isCorrect" } } } }
        }
      },
      {
        $sort: { totalAttempts: -1 }
      }
    ]);

    // Progression récente (dernières 10 activités)
    const recentProgressions = progressions
      .sort((a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime())
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      stats: {
        global: {
          totalProgressions,
          completedProgressions,
          failedProgressions,
          activeProgressions,
          completionRate: totalProgressions > 0 ? Math.round((completedProgressions / totalProgressions) * 100) : 0,
          failureRate: totalProgressions > 0 ? Math.round((failedProgressions / totalProgressions) * 100) : 0,
        },
        byQuiz: quizStats,
        byUser: userStats,
        recent: recentProgressions,
      },
    });

  } catch (error) {
    console.error("Erreur récupération statistiques progression:", error);
    const status = (error && typeof error === 'object' && 'status' in error && typeof error.status === 'number') ? error.status : 500;
    const message = status === 401 ? "Non autorisé" : status === 403 ? "Interdit" : "Erreur serveur";
    return NextResponse.json({ error: message }, { status });
  }
}
