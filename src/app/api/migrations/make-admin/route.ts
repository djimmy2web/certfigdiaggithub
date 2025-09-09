import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

const BodySchema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  const configuredToken = process.env.MIGRATION_TOKEN;
  if (!configuredToken) {
    return NextResponse.json({ error: "MIGRATION_TOKEN manquant côté serveur" }, { status: 500 });
  }

  const headerToken = req.headers.get("x-migration-token") ?? new URL(req.url).searchParams.get("token");
  if (!headerToken || headerToken !== configuredToken) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { email } = BodySchema.parse(body);
    await connectToDatabase();
    const user = await User.findOneAndUpdate({ email }, { $set: { role: "admin" } }, { new: true });
    if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    return NextResponse.json({ success: true, id: String(user._id), email: user.email, role: user.role });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues.map((i) => i.message).join(", ") || "Données invalides";
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}


