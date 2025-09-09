import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-helpers";
import { connectToDatabase } from "@/lib/mongodb";
import { Quiz } from "@/models/Quiz";

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
const UpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  isPublished: z.boolean().optional(),
  themeSlug: z.string().regex(/^[a-z0-9-]+$/i).optional(),
  difficulty: z.enum(["debutant","intermediaire","expert"]).optional(),
  questions: z.array(QuestionSchema).min(1).optional(),
});

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  await connectToDatabase();
  const { id } = await context.params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "ID invalide" }, { status: 400 });
  const quiz = await Quiz.findById(id).lean();
  if (!quiz) return NextResponse.json({ error: "Quiz introuvable" }, { status: 404 });
  return NextResponse.json({ quiz });
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    await connectToDatabase();
    const { id } = await context.params;
    if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    const body = await req.json();
    const parsed = UpdateSchema.parse(body);
    const update = { ...parsed } as Record<string, unknown>;
    if (update.themeSlug) update.themeSlug = (update.themeSlug as string).toLowerCase();
    await Quiz.updateOne({ _id: id }, { $set: update });
    return NextResponse.json({ ok: true });
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


