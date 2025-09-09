import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth-helpers';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import mongoose from 'mongoose';
import { Progress } from '@/models/Progress';

export async function GET() {
  try {
    const session = await requireSession();
    await connectToDatabase();

    const user = await User.findById(session.user!.id).select('points name');
    
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      points: user.points || 0,
      name: user.name
    });

  } catch (error: unknown) {
    console.error('Erreur lors de la récupération des points:', error);
    const status = (error && typeof error === 'object' && 'status' in error && typeof error.status === 'number') ? error.status : 500;
    const message = status === 401 ? 'Non autorisé' : status === 403 ? 'Interdit' : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  const session = await requireSession();
  await connectToDatabase();
  const body = await req.json();
  const { quizId } = body || {};
  if (!quizId || !mongoose.isValidObjectId(quizId)) return NextResponse.json({ error: "quizId invalide" }, { status: 400 });
  await Progress.updateOne(
    { userId: new mongoose.Types.ObjectId(session.user!.id), quizId: new mongoose.Types.ObjectId(quizId) },
    { $set: { userId: new mongoose.Types.ObjectId(session.user!.id), quizId: new mongoose.Types.ObjectId(quizId) } },
    { upsert: true }
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const session = await requireSession();
  await connectToDatabase();
  await Progress.deleteMany({ userId: new mongoose.Types.ObjectId(session.user!.id) });
  return NextResponse.json({ ok: true });
}


