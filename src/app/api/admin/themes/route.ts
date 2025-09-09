import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { connectToDatabase } from "@/lib/mongodb";
import { Theme } from "@/models/Theme";
import { z } from "zod";

const ThemeSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/i, "Slug invalide"),
  isActive: z.boolean().optional(),
});

export async function GET() {
  await requireAdmin();
  await connectToDatabase();
  const themes = await Theme.find().sort({ name: 1 }).lean();
  return NextResponse.json({ themes });
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    await connectToDatabase();
    const body = await req.json();
    const parsed = ThemeSchema.parse(body);
    const exists = await Theme.findOne({ slug: parsed.slug.toLowerCase() }).lean();
    if (exists) return NextResponse.json({ error: "Slug déjà utilisé" }, { status: 409 });
    const created = await Theme.create({ ...parsed, slug: parsed.slug.toLowerCase() });
    return NextResponse.json({ theme: { id: String(created._id) } }, { status: 201 });
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


