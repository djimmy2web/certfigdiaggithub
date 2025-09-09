import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { UserError } from '@/models/UserError';
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
    const quizType = searchParams.get('quizType'); // 'vocabulary' ou 'thematic'

    // Calculer la date limite
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - days);

    const filter: Record<string, unknown> = {
      userId: session.user.id,
      createdAt: { $gte: dateLimit }
    };

    if (quizType) {
      filter.quizType = quizType;
    }

    const errors = await UserError.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit);

    // Grouper les erreurs par question pour éviter les doublons
    const uniqueErrors = errors.reduce((acc, error) => {
      const key = `${error.quizType}-${error.questionId}`;
      if (!acc[key] || acc[key].createdAt < error.createdAt) {
        acc[key] = error;
      }
      return acc;
    }, {} as Record<string, unknown>);

    const uniqueErrorsArray = Object.values(uniqueErrors);

    return NextResponse.json({
      success: true,
      errors: uniqueErrorsArray,
      total: uniqueErrorsArray.length
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des erreurs:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des erreurs' },
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
    const { quizType, questionId, question, userAnswer, correctAnswer, quizTitle, difficulty, category } = body;

    // Validation des données
    if (!quizType || !questionId || !question || !userAnswer || !correctAnswer || !difficulty) {
      return NextResponse.json(
        { success: false, error: 'Tous les champs obligatoires doivent être fournis' },
        { status: 400 }
      );
    }

    // Créer la nouvelle erreur
    const newError = new UserError({
      userId: session.user.id,
      quizType,
      questionId,
      question,
      userAnswer,
      correctAnswer,
      quizTitle,
      difficulty,
      category
    });

    await newError.save();

    return NextResponse.json({
      success: true,
      error: newError,
      message: 'Erreur enregistrée avec succès'
    }, { status: 201 });

  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de l\'erreur:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de l\'enregistrement de l\'erreur' },
      { status: 500 }
    );
  }
}
