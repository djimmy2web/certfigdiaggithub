import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-helpers';
import { connectToDatabase } from '@/lib/mongodb';
import Division from '@/models/Division';

export async function POST() {
  try {
    await requireAdmin();
    await connectToDatabase();

    // Supprimer les divisions existantes
    await Division.deleteMany({});

    // Créer les divisions selon les spécifications
    const divisions = [
      {
        name: 'Saphir',
        minPoints: 1000,
        color: '#3B82F6', // Bleu saphir
        order: 1,
        promotionThreshold: 5,
        relegationThreshold: 5
      },
      {
        name: 'Or',
        minPoints: 500,
        maxPoints: 999,
        color: '#F59E0B', // Or
        order: 2,
        promotionThreshold: 5,
        relegationThreshold: 5
      },
      {
        name: 'Argent',
        minPoints: 150,
        maxPoints: 499,
        color: '#6B7280', // Argent
        order: 3,
        promotionThreshold: 5,
        relegationThreshold: 5
      },
      {
        name: 'Bronze',
        minPoints: 10,
        maxPoints: 149,
        color: '#CD7F32', // Bronze
        order: 4,
        promotionThreshold: 5,
        relegationThreshold: 5
      }
    ];

    // Insérer les divisions
    const createdDivisions = await Division.insertMany(divisions);

    return NextResponse.json({
      success: true,
      message: 'Divisions initialisées avec succès',
      divisions: createdDivisions
    });

  } catch (error: unknown) {
    console.error('Erreur lors de l\'initialisation des divisions:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de l\'initialisation' },
      { status: 500 }
    );
  }
}
