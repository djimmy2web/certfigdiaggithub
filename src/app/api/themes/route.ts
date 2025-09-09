import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Theme } from "@/models/Theme";

export async function GET() {
  await connectToDatabase();
  const themes = await Theme.find({ isActive: true }).sort({ name: 1 }).lean();
  return NextResponse.json({ themes: themes.map((t) => ({ id: String(t._id), name: t.name, slug: t.slug })) });
}


