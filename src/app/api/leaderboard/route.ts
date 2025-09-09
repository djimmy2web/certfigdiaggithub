import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Attempt } from "@/models/Attempt";

interface LeaderboardRow {
  userId: unknown;
  name?: string;
  email?: string;
  totalScore: number;
  attempts: number;
  lastAttemptAt: Date;
}

export async function GET(req: NextRequest) {
  await connectToDatabase();
  const { searchParams } = new URL(req.url);
  const limitParam = searchParams.get("limit");
  let limit = Number.parseInt(limitParam || "20", 10);
  if (!Number.isFinite(limit) || limit <= 0) limit = 20;
  if (limit > 100) limit = 100;

  const pipeline = [
    {
      $group: {
        _id: "$userId",
        totalScore: { $sum: "$score" },
        attempts: { $sum: 1 },
        lastAttemptAt: { $max: "$createdAt" },
      },
    },
    { $sort: { totalScore: -1, lastAttemptAt: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        userId: "$_id",
        totalScore: 1,
        attempts: 1,
        lastAttemptAt: 1,
        name: "$user.name",
        email: "$user.email",
      },
    },
  ];

  const rows = await Attempt.aggregate(pipeline as never[]);
  return NextResponse.json({ leaderboard: rows.map((r: LeaderboardRow, i: number) => ({
    rank: i + 1,
    userId: String(r.userId),
    name: r.name || r.email || "Utilisateur",
    email: r.email || null,
    totalScore: r.totalScore,
    attempts: r.attempts,
    lastAttemptAt: r.lastAttemptAt,
  })) });
}


