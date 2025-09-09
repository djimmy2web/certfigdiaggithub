import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Quiz } from "@/models/Quiz";


interface QuizQuery {
  isPublished: boolean;
  themeSlug?: string;
}

interface QuizSummary {
  _id: unknown;
  title: string;
  description?: string;
  difficulty?: string;
  themeSlug?: string;
  questions: unknown[];
}

export async function GET(req: NextRequest) {
  await connectToDatabase();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const theme = searchParams.get("theme"); // slug de thématique
  if (id) {
    const quiz = await Quiz.findById(id).lean();
    if (!quiz || !quiz.isPublished) return NextResponse.json({ error: "Quiz introuvable" }, { status: 404 });
    return NextResponse.json({
      quizzes: [
        {
          id: String(quiz._id),
          title: quiz.title,
          description: quiz.description,
          questions: quiz.questions.map((q: unknown) => ({
            text: (q as { text: string }).text,
            explanation: (q as { explanation?: string }).explanation,
            media: (q as { media?: string }).media,
            choices: (q as { choices: unknown[] }).choices.map((c: unknown) => ({ 
              text: (c as { text: string }).text,
              explanation: (c as { explanation?: string }).explanation,
              media: (c as { media?: string }).media,
            })),
          })),
        },
      ],
    });
  }
  const query: QuizQuery = { isPublished: true };
  if (theme) query.themeSlug = theme.toLowerCase();
  const quizzes = await Quiz.find(query).select("title description questions difficulty themeSlug").sort({ createdAt: -1 }).lean();
  return NextResponse.json({ quizzes: quizzes.map((q: QuizSummary) => ({ 
    id: String(q._id), 
    title: q.title, 
    description: q.description, 
    difficulty: q.difficulty, 
    themeSlug: q.themeSlug,
    questionsCount: Array.isArray(q.questions) ? q.questions.length : 0 
  })) });
}


