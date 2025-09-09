import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Division from '@/models/Division';

export async function GET() {
  try {
    await connectToDatabase();

    const divisions = await Division.find({})
      .sort({ order: 1 })
      .select('name minPoints maxPoints color order');

    return NextResponse.json({
      success: true,
      divisions
    });

  } catch (error: unknown) {
    console.error('Erreur lors de la récupération des divisions:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de la récupération' },
      { status: 500 }
    );
  }
}
