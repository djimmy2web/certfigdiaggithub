import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-helpers";
import { connectToDatabase } from "@/lib/mongodb";
import { Theme } from "@/models/Theme";

const UpdateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/i).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    await connectToDatabase();
    const { id } = await context.params;
    if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    const body = await req.json();
    const parsed = UpdateSchema.parse(body);
    if (parsed.slug) {
      const conflict = await Theme.findOne({ _id: { $ne: id }, slug: parsed.slug.toLowerCase() }).lean();
      if (conflict) return NextResponse.json({ error: "Slug déjà utilisé" }, { status: 409 });
      parsed.slug = parsed.slug.toLowerCase();
    }
    await Theme.updateOne({ _id: id }, { $set: parsed });
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

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    await connectToDatabase();
    const { id } = await context.params;
    if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    await Theme.deleteOne({ _id: id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const status = (error && typeof error === 'object' && 'status' in error && typeof error.status === 'number') ? error.status : 500;
    const message = status === 401 ? "Non autorisé" : status === 403 ? "Interdit" : "Erreur serveur";
    return NextResponse.json({ error: message }, { status });
  }
}


