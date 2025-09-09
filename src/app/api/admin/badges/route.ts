import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-helpers";
import { connectToDatabase } from "@/lib/mongodb";
import { Badge } from "@/models/Badge";

const BodySchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  criteria: z.object({
    minScore: z.number().int().nonnegative().optional(),
    quizId: z.string().optional(),
  }),
});

export async function GET() {
  await requireAdmin();
  await connectToDatabase();
  const badges = await Badge.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json({ badges });
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    await connectToDatabase();
    const body = await req.json();
    const parsed = BodySchema.parse(body);
    const created = await Badge.create({
      title: parsed.title,
      description: parsed.description,
      isActive: parsed.isActive ?? true,
      criteria: {
        minScore: parsed.criteria.minScore,
        quizId: parsed.criteria.quizId ? parsed.criteria.quizId : null,
      },
      createdBy: session.user?.id,
    });
    return NextResponse.json({ badge: { id: String(created._id) } }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const message = error.issues.map((i) => i.message).join(", ") || "Données invalides";
      return NextResponse.json({ error: message }, { status: 400 });
    }
    const status = (error as { status?: number })?.status ?? 500;
    const message = status === 401 ? "Non autorisé" : status === 403 ? "Interdit" : "Erreur serveur";
    return NextResponse.json({ error: message }, { status });
  }
}


