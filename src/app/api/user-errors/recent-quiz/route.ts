import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { UserError } from '@/models/UserError';
import { VocabularyWord } from '@/models/VocabularyWord';
import { Quiz } from '@/models/Quiz';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface QuizQuestion {
  id: string;
  type: string;
  question: string;
  correctAnswer: string;
  wrongAnswers: string[];
  difficulty?: string;
  category?: string;
  source: string;
  originalError?: unknown;
}

interface Choice {
  text: string;
  isCorrect: boolean;
}

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
    const limit = parseInt(searchParams.get('limit') || '10');
    const days = parseInt(searchParams.get('days') || '30');

    // Calculer la date limite
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - days);

    // Récupérer les erreurs récentes de l'utilisateur
    const userErrors = await UserError.find({
      userId: session.user.id,
      createdAt: { $gte: dateLimit }
    }).sort({ createdAt: -1 });

    if (userErrors.length === 0) {
      // Si aucune erreur, générer un quiz de vocabulaire aléatoire
      const randomWords = await VocabularyWord.aggregate([
        { $sample: { size: Math.min(limit, 10) } }
      ]);

      const quizQuestions = randomWords.map((word, index) => ({
        id: `random-${index}`,
        type: 'vocabulary',
        question: `Quel est le sens du mot "${word.word}" ?`,
        correctAnswer: word.correctDefinition,
        wrongAnswers: word.wrongDefinitions,
        difficulty: word.difficulty,
        category: word.category,
        source: 'random'
      }));

      return NextResponse.json({
        success: true,
        quiz: {
          title: 'Quiz de Révision Générale',
          description: 'Quiz de vocabulaire pour maintenir vos compétences',
          questions: quizQuestions,
          totalQuestions: quizQuestions.length,
          source: 'random'
        }
      });
    }

    // Grouper les erreurs par type et créer des questions de quiz
    const quizQuestions: QuizQuestion[] = [];
    const processedQuestions = new Set();

    // Traiter les erreurs de vocabulaire
    const vocabularyErrors = userErrors.filter(error => error.quizType === 'vocabulary');
    for (const error of vocabularyErrors) {
      if (processedQuestions.has(error.questionId)) continue;
      
      try {
        // Essayer de récupérer le mot de vocabulaire original
        let word = null;
        
        // Vérifier si questionId est un ObjectId valide
        if (error.questionId.match(/^[0-9a-fA-F]{24}$/)) {
          word = await VocabularyWord.findById(error.questionId);
        } else {
          // Si ce n'est pas un ObjectId valide, chercher par mot ou utiliser les données de l'erreur
          console.log(`QuestionId non valide pour vocabulaire: ${error.questionId}, utilisation des données d'erreur`);
        }
        
        if (word) {
          quizQuestions.push({
            id: `vocab-${error.questionId}`,
            type: 'vocabulary',
            question: `Quel est le sens du mot "${word.word}" ?`,
            correctAnswer: word.correctDefinition,
            wrongAnswers: word.wrongDefinitions,
            difficulty: word.difficulty,
            category: word.category,
            source: 'user-error',
            originalError: {
              userAnswer: error.userAnswer,
              correctAnswer: error.correctAnswer
            }
          });
          processedQuestions.add(error.questionId);
        } else {
          // Utiliser les données de l'erreur directement
          quizQuestions.push({
            id: `vocab-${error.questionId}`,
            type: 'vocabulary',
            question: error.question,
            correctAnswer: error.correctAnswer,
            wrongAnswers: [
              error.userAnswer,
              "Réponse incorrecte 1",
              "Réponse incorrecte 2"
            ].filter(answer => answer !== error.correctAnswer).slice(0, 3),
            difficulty: error.difficulty,
            category: error.category,
            source: 'user-error',
            originalError: {
              userAnswer: error.userAnswer,
              correctAnswer: error.correctAnswer
            }
          });
          processedQuestions.add(error.questionId);
        }
      } catch (e) {
        console.error('Erreur lors de la récupération du mot:', e);
      }
    }

    // Traiter les erreurs thématiques
    const thematicErrors = userErrors.filter(error => error.quizType === 'thematic');
    for (const error of thematicErrors) {
      if (processedQuestions.has(error.questionId)) continue;
      
      try {
        // Essayer de récupérer le quiz original
        let quiz = null;
        
        // Vérifier si questionId est un ObjectId valide
        if (error.questionId.match(/^[0-9a-fA-F]{24}$/)) {
          quiz = await Quiz.findById(error.questionId);
        } else {
          // Si ce n'est pas un ObjectId valide, utiliser les données de l'erreur
          console.log(`QuestionId non valide pour thématique: ${error.questionId}, utilisation des données d'erreur`);
        }
        
        if (quiz && quiz.questions && quiz.questions.length > 0) {
          // Prendre la première question du quiz pour simplifier
          const question = quiz.questions[0];
          if (question.choices && question.choices.length >= 2) {
            const correctOption = question.choices.find((opt: Choice) => opt.isCorrect);
            const wrongOptions = question.choices.filter((opt: Choice) => !opt.isCorrect).map((opt: Choice) => opt.text);
            
            quizQuestions.push({
              id: `thematic-${error.questionId}`,
              type: 'thematic',
              question: question.text,
              correctAnswer: correctOption?.text || 'Réponse correcte non trouvée',
              wrongAnswers: wrongOptions,
              difficulty: quiz.difficulty,
              category: quiz.themeSlug,
              source: 'user-error',
              originalError: {
                userAnswer: error.userAnswer,
                correctAnswer: error.correctAnswer
              }
            });
            processedQuestions.add(error.questionId);
          }
        } else {
          // Utiliser les données de l'erreur directement
          quizQuestions.push({
            id: `thematic-${error.questionId}`,
            type: 'thematic',
            question: error.question,
            correctAnswer: error.correctAnswer,
            wrongAnswers: [
              error.userAnswer,
              "Réponse incorrecte 1",
              "Réponse incorrecte 2"
            ].filter(answer => answer !== error.correctAnswer).slice(0, 3),
            difficulty: error.difficulty,
            category: error.category,
            source: 'user-error',
            originalError: {
              userAnswer: error.userAnswer,
              correctAnswer: error.correctAnswer
            }
          });
          processedQuestions.add(error.questionId);
        }
      } catch (e) {
        console.error('Erreur lors de la récupération du quiz:', e);
      }
    }

    // Si pas assez de questions d'erreurs, compléter avec du vocabulaire aléatoire
    if (quizQuestions.length < limit) {
      const remainingCount = limit - quizQuestions.length;
      const randomWords = await VocabularyWord.aggregate([
        { $sample: { size: remainingCount } }
      ]);

      randomWords.forEach((word) => {
        if (!processedQuestions.has(`random-${word._id}`)) {
          quizQuestions.push({
            id: `random-${word._id}`,
            type: 'vocabulary',
            question: `Quel est le sens du mot "${word.word}" ?`,
            correctAnswer: word.correctDefinition,
            wrongAnswers: word.wrongDefinitions,
            difficulty: word.difficulty,
            category: word.category,
            source: 'random'
          });
          processedQuestions.add(`random-${word._id}`);
        }
      });
    }

    // Mélanger les questions
    const shuffledQuestions = quizQuestions.sort(() => Math.random() - 0.5).slice(0, limit);

    // Statistiques des erreurs
    const errorStats = {
      totalErrors: userErrors.length,
      vocabularyErrors: vocabularyErrors.length,
      thematicErrors: thematicErrors.length,
      daysCovered: days,
      errorRate: userErrors.length > 0 ? Math.round((userErrors.filter(e => e.createdAt >= dateLimit).length / userErrors.length) * 100) : 0
    };

    return NextResponse.json({
      success: true,
      quiz: {
        title: 'Quiz des Erreurs Récentes',
        description: `Quiz personnalisé basé sur vos ${userErrors.length} erreurs récentes`,
        questions: shuffledQuestions,
        totalQuestions: shuffledQuestions.length,
        source: 'user-errors',
        stats: errorStats
      }
    });

  } catch (error) {
    console.error('Erreur lors de la génération du quiz des erreurs:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la génération du quiz' },
      { status: 500 }
    );
  }
}
