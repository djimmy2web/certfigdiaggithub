import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Pour l'instant, retourner une réponse vide car la fonctionnalité team n'est pas implémentée
    return NextResponse.json({
      success: true,
      synced: false,
      message: 'Fonctionnalité team non implémentée'
    });

  } catch (error: unknown) {
    console.error('Erreur lors de la synchronisation team:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la synchronisation' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Pour l'instant, retourner une réponse vide car la fonctionnalité team n'est pas implémentée
    return NextResponse.json({
      success: true,
      synced: false,
      message: 'Fonctionnalité team non implémentée'
    });

  } catch (error: unknown) {
    console.error('Erreur lors de la synchronisation team:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la synchronisation' },
      { status: 500 }
    );
  }
}
