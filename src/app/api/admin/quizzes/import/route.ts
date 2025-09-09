import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { connectToDatabase } from "@/lib/mongodb";
import { Quiz } from "@/models/Quiz";
import { z } from "zod";

interface ImportSuccess {
  line: number;
  title: string;
  difficulty: string;
  questionsCount: number;
  isPublished: boolean;
  quizId: string;
  action: "updated" | "created";
}

interface ImportError {
  line: number;
  title: string;
  error: string;
}

// Schéma de validation pour chaque ligne CSV
const QuizImportSchema = z.object({
  title: z.string().min(1, "Titre requis"),
  description: z.string().optional(),
  difficulty: z.enum(["debutant", "intermediaire", "expert"]).default("debutant"),
  isPublished: z.boolean().default(false),
  questions: z.array(z.object({
    text: z.string().min(1, "Texte de question requis"),
    explanation: z.string().optional(),
    choices: z.array(z.object({
      text: z.string().min(1, "Texte de choix requis"),
      isCorrect: z.boolean(),
      explanation: z.string().optional(),
    })).min(2, "Au moins 2 choix requis"),
  })).min(1, "Au moins 1 question requise"),
});

// Schéma pour le corps de la requête
const ImportRequestSchema = z.object({
  quizzes: z.array(QuizImportSchema),
  overwrite: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    await connectToDatabase();

    const body = await req.json();
    const { quizzes, overwrite } = ImportRequestSchema.parse(body);

    const results = {
      success: [] as ImportSuccess[],
      errors: [] as ImportError[],
      summary: {
        total: quizzes.length,
        imported: 0,
        failed: 0,
        skipped: 0,
      },
    };

    for (let i = 0; i < quizzes.length; i++) {
      const quizData = quizzes[i];
      const lineNumber = i + 1;

      try {
        // Vérifier si le quiz existe déjà (par titre)
        const existingQuiz = await Quiz.findOne({ title: quizData.title });
        if (existingQuiz && !overwrite) {
          results.errors.push({
            line: lineNumber,
            title: quizData.title,
            error: "Quiz déjà existant (utilisez l'option 'Écraser' pour remplacer)",
          });
          results.summary.skipped++;
          continue;
        }

        // Préparer les données du quiz
        const quizToSave = {
          title: quizData.title,
          description: quizData.description || "",
          difficulty: quizData.difficulty,
          isPublished: quizData.isPublished,
          questions: quizData.questions.map(q => ({
            text: q.text,
            explanation: q.explanation || "",
            choices: q.choices.map(c => ({
              text: c.text,
              isCorrect: c.isCorrect,
              explanation: c.explanation || "",
            })),
          })),
        };

        let newQuiz;
        if (existingQuiz && overwrite) {
          // Mettre à jour le quiz existant
          newQuiz = await Quiz.findByIdAndUpdate(
            existingQuiz._id,
            quizToSave,
            { new: true, runValidators: true }
          );
        } else {
          // Créer un nouveau quiz
          newQuiz = await Quiz.create(quizToSave);
        }

        results.success.push({
          line: lineNumber,
          title: quizData.title,
          difficulty: quizData.difficulty,
          questionsCount: quizData.questions.length,
          isPublished: quizData.isPublished,
          quizId: newQuiz?._id.toString() || "",
          action: existingQuiz && overwrite ? "updated" : "created",
        });

        results.summary.imported++;

      } catch (error: unknown) {
        results.errors.push({
          line: lineNumber,
          title: quizData.title,
          error: error instanceof Error ? error.message : "Erreur inconnue",
        });
        results.summary.failed++;
      }
    }

    return NextResponse.json({
      success: true,
      results,
    });

  } catch (error: unknown) {
    console.error("Erreur import CSV quiz:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: "Données invalides",
        details: error.issues,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: "Erreur lors de l'import",
    }, { status: 500 });
  }
}
