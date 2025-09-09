import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { UserError } from '@/models/UserError';
import { VocabularyWord } from '@/models/VocabularyWord';
import { Quiz } from '@/models/Quiz';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const days = parseInt(searchParams.get('days') || '30');
    const quizType = searchParams.get('quizType'); // 'vocabulary', 'thematic', ou undefined pour tous

    // Calculer la date limite
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - days);

    // Construire le filtre
    const filter: Record<string, unknown> = {
      userId: session.user.id,
      createdAt: { $gte: dateLimit }
    };

    if (quizType) {
      filter.quizType = quizType;
    }

    // Récupérer les erreurs récentes
    const userErrors = await UserError.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit);

    if (userErrors.length === 0) {
      return NextResponse.json({
        success: true,
        errors: [],
        total: 0,
        message: 'Aucune erreur récente trouvée'
      });
    }

    // Enrichir les erreurs avec les détails des questions
    const enrichedErrors = await Promise.all(
      userErrors.map(async (error) => {
        let questionDetails = null;
        let category = error.category;
        let difficulty = error.difficulty;

        try {
          if (error.quizType === 'vocabulary') {
            // Récupérer les détails du mot de vocabulaire
            const word = await VocabularyWord.findById(error.questionId);
            if (word) {
              questionDetails = {
                word: word.word,
                correctDefinition: word.correctDefinition,
                wrongDefinitions: word.wrongDefinitions,
                difficulty: word.difficulty,
                category: word.category
              };
              category = word.category;
              difficulty = word.difficulty;
            }
          } else if (error.quizType === 'thematic') {
            // Récupérer les détails du quiz thématique
            const quiz = await Quiz.findById(error.questionId);
            if (quiz && quiz.questions && quiz.questions.length > 0) {
              const question = quiz.questions[0];
              questionDetails = {
                questionText: question.text,
                choices: question.choices,
                explanation: question.explanation,
                difficulty: quiz.difficulty,
                category: quiz.themeSlug
              };
              category = quiz.themeSlug;
              difficulty = quiz.difficulty;
            }
          }
        } catch (e) {
          console.error('Erreur lors de la récupération des détails:', e);
        }

        return {
          id: error._id,
          quizType: error.quizType,
          questionId: error.questionId,
          question: error.question,
          userAnswer: error.userAnswer,
          correctAnswer: error.correctAnswer,
          quizTitle: error.quizTitle,
          difficulty: difficulty || error.difficulty,
          category: category || error.category,
          createdAt: error.createdAt,
          questionDetails,
          // Calculer le temps écoulé
          timeAgo: getTimeAgo(error.createdAt)
        };
      })
    );

    // Grouper par type de quiz
    const groupedErrors = {
      vocabulary: enrichedErrors.filter(e => e.quizType === 'vocabulary'),
      thematic: enrichedErrors.filter(e => e.quizType === 'thematic'),
      all: enrichedErrors
    };

    // Statistiques rapides
    const stats = {
      total: enrichedErrors.length,
      vocabulary: groupedErrors.vocabulary.length,
      thematic: groupedErrors.thematic.length,
      byDifficulty: enrichedErrors.reduce((acc, error) => {
        acc[error.difficulty] = (acc[error.difficulty] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byCategory: enrichedErrors.reduce((acc, error) => {
        if (error.category) {
          acc[error.category] = (acc[error.category] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>)
    };

    return NextResponse.json({
      success: true,
      errors: groupedErrors,
      stats,
      total: enrichedErrors.length,
      daysCovered: days
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des erreurs récentes:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des erreurs récentes' },
      { status: 500 }
    );
  }
}

// Fonction utilitaire pour calculer le temps écoulé
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return 'À l\'instant';
  if (diffInMinutes < 60) return `Il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
  if (diffInHours < 24) return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
  if (diffInDays < 7) return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
  return `Il y a ${Math.floor(diffInDays / 7)} semaine${Math.floor(diffInDays / 7) > 1 ? 's' : ''}`;
}
