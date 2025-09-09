import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ThemeProgress } from '@/models/ThemeProgress';
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
    const themeSlug = searchParams.get('themeSlug');

    if (themeSlug) {
      // Récupérer la progression pour un thème spécifique
      let progress = await ThemeProgress.findOne({
        userId: session.user.id,
        themeSlug: themeSlug.toLowerCase()
      });

      if (!progress) {
        // Créer une nouvelle progression si elle n'existe pas
        progress = new ThemeProgress({
          userId: session.user.id,
          themeSlug: themeSlug.toLowerCase(),
          currentLevel: 'debutant',
          completedQuizzes: [],
          totalScore: 0,
          totalQuizzesCompleted: 0,
          lastActivityAt: new Date()
        });
        await progress.save();
      }

      // Récupérer les quiz disponibles pour ce thème
      const availableQuizzes = await Quiz.find({
        themeSlug: themeSlug.toLowerCase(),
        isPublished: true
      }).select('title description difficulty questions').lean();

      // Organiser les quiz par niveau
      const quizzesByLevel = {
        debutant: availableQuizzes.filter(q => q.difficulty === 'debutant'),
        intermediaire: availableQuizzes.filter(q => q.difficulty === 'intermediaire'),
        expert: availableQuizzes.filter(q => q.difficulty === 'expert')
      };

      // Calculer les statistiques de progression manuellement
      const levelStats = {
        debutant: {
          completed: progress.completedQuizzes.filter(q => q.difficulty === 'debutant').length,
          totalScore: progress.completedQuizzes.filter(q => q.difficulty === 'debutant').reduce((sum, q) => sum + q.score, 0),
          averageScore: 0
        },
        intermediaire: {
          completed: progress.completedQuizzes.filter(q => q.difficulty === 'intermediaire').length,
          totalScore: progress.completedQuizzes.filter(q => q.difficulty === 'intermediaire').reduce((sum, q) => sum + q.score, 0),
          averageScore: 0
        },
        expert: {
          completed: progress.completedQuizzes.filter(q => q.difficulty === 'expert').length,
          totalScore: progress.completedQuizzes.filter(q => q.difficulty === 'expert').reduce((sum, q) => sum + q.score, 0),
          averageScore: 0
        }
      };

      // Calculer les scores moyens
      if (levelStats.debutant.completed > 0) {
        levelStats.debutant.averageScore = Math.round(levelStats.debutant.totalScore / levelStats.debutant.completed);
      }
      if (levelStats.intermediaire.completed > 0) {
        levelStats.intermediaire.averageScore = Math.round(levelStats.intermediaire.totalScore / levelStats.intermediaire.completed);
      }
      if (levelStats.expert.completed > 0) {
        levelStats.expert.averageScore = Math.round(levelStats.expert.totalScore / levelStats.expert.completed);
      }

      // Déterminer les niveaux accessibles
      const canAccessLevel = {
        debutant: true, // Le niveau débutant est toujours accessible
        intermediaire: levelStats.debutant.completed >= 2 && levelStats.debutant.averageScore >= 70,
        expert: levelStats.intermediaire.completed >= 2 && levelStats.intermediaire.averageScore >= 75
      };

      return NextResponse.json({
        success: true,
        progress: {
          themeSlug: progress.themeSlug,
          currentLevel: progress.currentLevel,
          totalScore: progress.totalScore,
          totalQuizzesCompleted: progress.totalQuizzesCompleted,
          lastActivityAt: progress.lastActivityAt,
          completedQuizzes: progress.completedQuizzes.map(q => ({
            quizId: q.quizId.toString(),
            score: q.score,
            totalQuestions: q.totalQuestions,
            completedAt: q.completedAt.toISOString(),
            difficulty: q.difficulty
          })),
          levelStats,
          quizzesByLevel,
          canAccessLevel
        }
      });
    } else {
      // Récupérer la progression pour tous les thèmes
      const allProgress = await ThemeProgress.find({
        userId: session.user.id
      }).sort({ lastActivityAt: -1 });

      return NextResponse.json({
        success: true,
        progress: allProgress.map(p => ({
          themeSlug: p.themeSlug,
          currentLevel: p.currentLevel,
          totalScore: p.totalScore,
          totalQuizzesCompleted: p.totalQuizzesCompleted,
          lastActivityAt: p.lastActivityAt
        }))
      });
    }

  } catch (error) {
    console.error('Erreur lors de la récupération de la progression:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération de la progression' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const body = await request.json();
    const { themeSlug, quizId, score, totalQuestions, difficulty } = body;

    if (!themeSlug || !quizId || score === undefined || !totalQuestions || !difficulty) {
      return NextResponse.json(
        { success: false, error: 'Données manquantes' },
        { status: 400 }
      );
    }

    // Trouver ou créer la progression pour ce thème
    let progress = await ThemeProgress.findOne({
      userId: session.user.id,
      themeSlug: themeSlug.toLowerCase()
    });

    if (!progress) {
      progress = new ThemeProgress({
        userId: session.user.id,
        themeSlug: themeSlug.toLowerCase(),
        currentLevel: 'debutant',
        completedQuizzes: [],
        totalScore: 0,
        totalQuizzesCompleted: 0,
        lastActivityAt: new Date()
      });
    }

    // Vérifier si ce quiz n'a pas déjà été complété
    const alreadyCompleted = progress.completedQuizzes.some(q => 
      q.quizId.toString() === quizId
    );

    if (!alreadyCompleted) {
      // Ajouter le quiz complété
      progress.completedQuizzes.push({
        quizId,
        score,
        totalQuestions,
        completedAt: new Date(),
        difficulty
      });

      // Mettre à jour les statistiques
      progress.totalScore += score;
      progress.totalQuizzesCompleted += 1;
      progress.lastActivityAt = new Date();

      // Mettre à jour le niveau actuel manuellement
      const debutantProgress = progress.completedQuizzes.filter(q => q.difficulty === 'debutant');
      const intermediaireProgress = progress.completedQuizzes.filter(q => q.difficulty === 'intermediaire');
      
      if (debutantProgress.length >= 2) {
        const debutantAvg = debutantProgress.reduce((sum, q) => sum + q.score, 0) / debutantProgress.length;
        if (debutantAvg >= 70) {
          progress.currentLevel = 'intermediaire';
        }
      }
      
      if (intermediaireProgress.length >= 2) {
        const intermediaireAvg = intermediaireProgress.reduce((sum, q) => sum + q.score, 0) / intermediaireProgress.length;
        if (intermediaireAvg >= 75) {
          progress.currentLevel = 'expert';
        }
      }

      await progress.save();
    }

    // Calculer les statistiques mises à jour
    const levelStats = {
      debutant: {
        completed: progress.completedQuizzes.filter(q => q.difficulty === 'debutant').length,
        totalScore: progress.completedQuizzes.filter(q => q.difficulty === 'debutant').reduce((sum, q) => sum + q.score, 0),
        averageScore: 0
      },
      intermediaire: {
        completed: progress.completedQuizzes.filter(q => q.difficulty === 'intermediaire').length,
        totalScore: progress.completedQuizzes.filter(q => q.difficulty === 'intermediaire').reduce((sum, q) => sum + q.score, 0),
        averageScore: 0
      },
      expert: {
        completed: progress.completedQuizzes.filter(q => q.difficulty === 'expert').length,
        totalScore: progress.completedQuizzes.filter(q => q.difficulty === 'expert').reduce((sum, q) => sum + q.score, 0),
        averageScore: 0
      }
    };

    // Calculer les scores moyens
    if (levelStats.debutant.completed > 0) {
      levelStats.debutant.averageScore = Math.round(levelStats.debutant.totalScore / levelStats.debutant.completed);
    }
    if (levelStats.intermediaire.completed > 0) {
      levelStats.intermediaire.averageScore = Math.round(levelStats.intermediaire.totalScore / levelStats.intermediaire.completed);
    }
    if (levelStats.expert.completed > 0) {
      levelStats.expert.averageScore = Math.round(levelStats.expert.totalScore / levelStats.expert.completed);
    }

    return NextResponse.json({
      success: true,
      progress: {
        themeSlug: progress.themeSlug,
        currentLevel: progress.currentLevel,
        totalScore: progress.totalScore,
        totalQuizzesCompleted: progress.totalQuizzesCompleted,
        levelStats
      }
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour de la progression:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la mise à jour de la progression' },
      { status: 500 }
    );
  }
}
