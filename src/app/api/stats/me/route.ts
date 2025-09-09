import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { requireSession } from "@/lib/auth-helpers";
import { Attempt } from "@/models/Attempt";
import { Quiz } from "@/models/Quiz";


export async function GET(req: NextRequest) {
  const session = await requireSession();
  await connectToDatabase();

  const userId = new mongoose.Types.ObjectId(session.user!.id);
  const { searchParams } = new URL(req.url);
  const days = Math.max(1, Math.min(90, Number.parseInt(searchParams.get("days") || "30", 10)));
  const now = new Date();
  const start = new Date(now);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  start.setUTCHours(0, 0, 0, 0);

  // 1) Totaux et moyenne
  const totalsAgg = await Attempt.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: null,
        totalAttempts: { $sum: 1 },
        totalScore: { $sum: "$score" },
      },
    },
  ]);
  const totalAttempts = totalsAgg[0]?.totalAttempts ?? 0;
  const totalScore = totalsAgg[0]?.totalScore ?? 0;
  const avgScore = totalAttempts ? Math.round((totalScore / totalAttempts) * 100) / 100 : 0;



  const dailyAgg = await Attempt.aggregate([
    { $match: { userId, createdAt: { $gte: start } } },
    { $group: { _id: { $dateTrunc: { date: "$createdAt", unit: "day" } }, attempts: { $sum: 1 }, score: { $sum: "$score" } } },
    { $sort: { _id: 1 } },
  ]);
  const attemptsByDay = dailyAgg.map((d: { _id: Date; attempts: number; score: number }) => ({ day: d._id, attempts: d.attempts, score: d.score }));

  // 3) Streak (jours consécutifs avec au moins 1 tentative jusqu'à aujourd'hui)
  const daysSet = new Set(attemptsByDay.map((d) => new Date(d.day).toISOString().slice(0, 10)));
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const ref = new Date(now);
    ref.setUTCDate(ref.getUTCDate() - i);
    const key = ref.toISOString().slice(0, 10);
    if (i === 0 && !daysSet.has(key)) break; // si pas d'activité aujourd'hui, streak = 0
    if (daysSet.has(key)) streak += 1; else break;
  }

  // 4) Catégories (par quiz)
  const byCategory = await Attempt.aggregate([
    { $match: { userId } },
    {
      $lookup: {
        from: "quizzes",
        localField: "quizId",
        foreignField: "_id",
        as: "quiz",
      },
    },
    { $unwind: { path: "$quiz", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: "$quiz.category",
        attempts: { $sum: 1 },
        totalScore: { $sum: "$score" },
      },
    },
    { $sort: { attempts: -1 } },
  ]);
  const categories = byCategory.map((c) => ({ category: c._id ?? "Autres", attempts: c.attempts, avgScore: c.attempts ? Math.round((c.totalScore / c.attempts) * 100) / 100 : 0 }));

  // 5) Meilleurs quiz
  const bestQuizzesAgg = await Attempt.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: "$quizId",
        attempts: { $sum: 1 },
        totalScore: { $sum: "$score" },
      },
    },
    { $sort: { totalScore: -1, attempts: -1 } },
    { $limit: 5 },
  ]);
  const bestQuizIds = bestQuizzesAgg.map((b) => b._id);
  const bestQuizzesMap = new Map<string, { title: string }>();
  if (bestQuizIds.length) {
    const quizzes = await Quiz.find({ _id: { $in: bestQuizIds } }).select("title").lean();
    quizzes.forEach((q) => bestQuizzesMap.set(String(q._id), q));
  }
  const bestQuizzes = bestQuizzesAgg.map((b) => ({ id: String(b._id), title: bestQuizzesMap.get(String(b._id))?.title ?? "Quiz", attempts: b.attempts, totalScore: b.totalScore }));

  // 6) Tentatives récentes
  const recent = await Attempt.find({ userId }).sort({ createdAt: -1 }).limit(10).lean();
  const recentQuizIds = Array.from(new Set(recent.map((r) => String(r.quizId))));
  const recentQuizMap = new Map<string, { title: string }>();
  if (recentQuizIds.length) {
    const quizzes = await Quiz.find({ _id: { $in: recentQuizIds } }).select("title").lean();
    quizzes.forEach((q) => recentQuizMap.set(String(q._id), q));
  }
  const recentAttempts = recent.map((r) => ({
    id: String(r._id),
    quizId: String(r.quizId),
    quizTitle: recentQuizMap.get(String(r.quizId))?.title ?? "Quiz",
    score: r.score,
    createdAt: r.createdAt,
  }));

  return NextResponse.json({
    totals: { totalAttempts, totalScore, avgScore, streak },
    attemptsByDay,
    categories,
    bestQuizzes,
    recentAttempts,
  });
}


