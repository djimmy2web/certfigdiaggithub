import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { VocabularyWord } from '@/models/VocabularyWord';

interface MemoryCard {
  id: number;
  content: string;
  type: 'word' | 'definition';
  pairId: number;
}

interface SpeedQuestion {
  question: string;
  answer: string;
  options: string[];
}

interface PuzzleSentence {
  sentence: string;
  words: string[];
  hint: string;
}

interface QuizQuestion {
  question: string;
  answer: string;
  options: string[];
  category: string;
}

interface MemoryGameData {
  type: 'memory';
  cards: MemoryCard[];
}

interface SpeedGameData {
  type: 'speed';
  questions: SpeedQuestion[];
}

interface PuzzleGameData {
  type: 'puzzle';
  sentences: PuzzleSentence[];
}

interface WordleGameData {
  type: 'wordle';
  targetWord: string;
  validWords: string[];
  maxAttempts: number;
}

interface QuizGameData {
  type: 'quiz';
  questions: QuizQuestion[];
}

type GameData = MemoryGameData | SpeedGameData | PuzzleGameData | WordleGameData | QuizGameData;

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const gameType = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '10');

    let data: GameData;

    switch (gameType) {
      case 'memory':
        // Récupérer des mots pour le jeu de mémoire
        const memoryWords = await VocabularyWord.aggregate([
          { $sample: { size: Math.min(limit, 6) } },
          { $project: { word: 1, correctDefinition: 1 } }
        ]);
        
        data = {
          type: 'memory',
          cards: memoryWords.map((word, index) => [
            { id: index * 2, content: word.word, type: 'word' as const, pairId: index },
            { id: index * 2 + 1, content: word.correctDefinition, type: 'definition' as const, pairId: index }
          ]).flat().sort(() => Math.random() - 0.5)
        };
        break;

      case 'speed':
        // Récupérer des questions pour le jeu de vitesse
        const speedQuestions = await VocabularyWord.aggregate([
          { $sample: { size: limit } },
          { $project: { word: 1, correctDefinition: 1, wrongDefinitions: 1 } }
        ]);

        data = {
          type: 'speed',
          questions: speedQuestions.map(q => ({
            question: `Quel est le sens du mot "${q.word}" ?`,
            answer: q.correctDefinition,
            options: [q.correctDefinition, ...q.wrongDefinitions].sort(() => Math.random() - 0.5)
          }))
        };
        break;

      case 'puzzle':
        // Phrases prédéfinies pour le puzzle
        data = {
          type: 'puzzle',
          sentences: [
            {
              sentence: "Le chat dort paisiblement sur le canapé",
              words: ["Le", "chat", "dort", "paisiblement", "sur", "le", "canapé"],
              hint: "Un animal domestique se repose"
            },
            {
              sentence: "La pluie tombe doucement sur les fleurs",
              words: ["La", "pluie", "tombe", "doucement", "sur", "les", "fleurs"],
              hint: "Précipitations météorologiques"
            },
            {
              sentence: "Les oiseaux chantent joyeusement dans les arbres",
              words: ["Les", "oiseaux", "chantent", "joyeusement", "dans", "les", "arbres"],
              hint: "Des animaux volants font de la musique"
            },
            {
              sentence: "Le soleil brille intensément dans le ciel bleu",
              words: ["Le", "soleil", "brille", "intensément", "dans", "le", "ciel", "bleu"],
              hint: "L'astre du jour illumine l'atmosphère"
            }
          ]
        };
        break;

      case 'wordle':
        // Mots de 5 lettres pour Wordle
        const wordleWords = [
          "MOTIF", "CHIEN", "LIVRE", "TABLE", "PLAGE", "MUSIC", "POMME", "FLEUR",
          "MAISON", "VOYAGE", "TRAVAIL", "AMITIE", "BONHEUR", "LIBERTE", "JUSTICE"
        ].filter(word => word.length === 5);
        
        data = {
          type: 'wordle',
          targetWord: wordleWords[Math.floor(Math.random() * wordleWords.length)],
          validWords: wordleWords,
          maxAttempts: 6
        };
        break;

      case 'quiz':
        // Questions de culture générale
        data = {
          type: 'quiz',
          questions: [
            {
              question: "Quelle est la capitale de la France ?",
              answer: "Paris",
              options: ["Paris", "Lyon", "Marseille", "Toulouse"],
              category: "géographie"
            },
            {
              question: "Combien font 2 + 2 ?",
              answer: "4",
              options: ["3", "4", "5", "6"],
              category: "mathématiques"
            },
            {
              question: "Quel est le plus grand océan du monde ?",
              answer: "Pacifique",
              options: ["Atlantique", "Pacifique", "Indien", "Arctique"],
              category: "géographie"
            },
            {
              question: "Qui a peint la Joconde ?",
              answer: "Léonard de Vinci",
              options: ["Michel-Ange", "Léonard de Vinci", "Raphaël", "Botticelli"],
              category: "art"
            },
            {
              question: "Quel est le symbole chimique de l'or ?",
              answer: "Au",
              options: ["Ag", "Au", "Fe", "Cu"],
              category: "sciences"
            },
            {
              question: "En quelle année a eu lieu la Révolution française ?",
              answer: "1789",
              options: ["1789", "1799", "1769", "1779"],
              category: "histoire"
            }
          ]
        };
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Type de jeu non reconnu' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des données de jeu:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des données de jeu' },
      { status: 500 }
    );
  }
}
