import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Quiz } from "@/models/Quiz";

export async function GET() {
  await connectToDatabase();
  const cats = await Quiz.aggregate([
    { $group: { _id: "$category", quizzes: { $sum: 1 } } },
    { $sort: { quizzes: -1 } },
  ]);
  return NextResponse.json({ categories: cats.map((c) => ({ name: c._id ?? "Autres", quizzes: c.quizzes })) });
}


