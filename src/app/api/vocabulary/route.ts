import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { VocabularyWord } from '@/models/VocabularyWord';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const difficulty = searchParams.get('difficulty');
    const category = searchParams.get('category');
    const language = searchParams.get('language') || 'fr';
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const random = searchParams.get('random') === 'true';

    // Construire le filtre
    const filter: Record<string, unknown> = { language };
    
    if (difficulty) {
      filter.difficulty = difficulty;
    }
    
    if (category) {
      filter.category = category;
    }

    // Calculer le skip pour la pagination
    const skip = (page - 1) * limit;

    let words;

    // Si random est demandé, utiliser l'agrégation
    if (random) {
      words = await VocabularyWord.aggregate([
        { $match: filter },
        { $sample: { size: limit } }
      ]);
    } else {
      words = await VocabularyWord.find(filter).skip(skip).limit(limit);
    }

    // Compter le total pour la pagination
    const total = await VocabularyWord.countDocuments(filter);

    // Calculer les statistiques
    const stats = await VocabularyWord.aggregate([
      { $match: { language } },
      {
        $group: {
          _id: '$difficulty',
          count: { $sum: 1 }
        }
      }
    ]);

    const statsByCategory = await VocabularyWord.aggregate([
      { $match: { language } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    return NextResponse.json({
      success: true,
      words,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: {
        byDifficulty: stats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {} as Record<string, number>),
        byCategory: statsByCategory.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {} as Record<string, number>),
        total: total
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des mots de vocabulaire:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la récupération des mots de vocabulaire' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { word, correctDefinition, wrongDefinitions, difficulty, category, language, examples, synonyms, antonyms, etymology } = body;

    // Validation des données
    if (!word || !correctDefinition || !wrongDefinitions || !difficulty || !category) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Tous les champs obligatoires doivent être fournis' 
        },
        { status: 400 }
      );
    }

    if (wrongDefinitions.length < 2 || wrongDefinitions.length > 4) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Il faut au moins 2 mauvaises définitions et maximum 4' 
        },
        { status: 400 }
      );
    }

    // Vérifier si le mot existe déjà
    const existingWord = await VocabularyWord.findOne({ word, language });
    if (existingWord) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Ce mot existe déjà dans la base de données' 
        },
        { status: 409 }
      );
    }

    // Créer le nouveau mot
    const newWord = new VocabularyWord({
      word,
      correctDefinition,
      wrongDefinitions,
      difficulty,
      category,
      language: language || 'fr',
      examples: examples || [],
      synonyms: synonyms || [],
      antonyms: antonyms || [],
      etymology: etymology || ''
    });

    await newWord.save();

    return NextResponse.json({
      success: true,
      word: newWord,
      message: 'Mot de vocabulaire ajouté avec succès'
    }, { status: 201 });

  } catch (error) {
    console.error('Erreur lors de l\'ajout du mot de vocabulaire:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de l\'ajout du mot de vocabulaire' 
      },
      { status: 500 }
    );
  }
}
