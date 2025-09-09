import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { connectToDatabase } from "@/lib/mongodb";
import { Quiz } from "@/models/Quiz";
import { z } from "zod";

const MediaSchema = z.object({
  type: z.enum(["image", "video"]),
  url: z.string().url(),
  filename: z.string(),
}).optional();

const ChoiceSchema = z.object({ 
  text: z.string().min(1), 
  isCorrect: z.boolean(),
  explanation: z.string().optional(),
  media: MediaSchema,
});

const QuestionSchema = z.object({
  text: z.string().min(1),
  explanation: z.string().optional(),
  media: MediaSchema,
  choices: z.array(ChoiceSchema).min(2),
});
const QuizSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  isPublished: z.boolean().optional(),
  themeSlug: z.string().min(1).regex(/^[a-z0-9-]+$/i, "Slug thématique invalide").optional(),
  difficulty: z.enum(["debutant", "intermediaire", "expert"]).optional(),
  questions: z.array(QuestionSchema).min(1),
});

export async function GET() {
  await requireAdmin();
  await connectToDatabase();
  const quizzes = await Quiz.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json({ quizzes });
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    await connectToDatabase();
    const body = await req.json();
    const parsed = QuizSchema.parse(body);
    const created = await Quiz.create({ ...parsed, themeSlug: parsed.themeSlug?.toLowerCase(), createdBy: session.user?.id });
    return NextResponse.json({ quiz: { id: String(created._id) } }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues.map((i) => i.message).join(", ") || "Données invalides";
      return NextResponse.json({ error: message }, { status: 400 });
    }
    const status = (error && typeof error === 'object' && 'status' in error && typeof error.status === 'number') ? error.status : 500;
    const message = status === 401 ? "Non autorisé" : status === 403 ? "Interdit" : "Erreur serveur";
    return NextResponse.json({ error: message }, { status });
  }
}


