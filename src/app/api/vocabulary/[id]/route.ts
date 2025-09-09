import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { VocabularyWord } from '@/models/VocabularyWord';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();

    const { id } = await params;

    // Vérifier si le mot existe
    const existingWord = await VocabularyWord.findById(id);
    if (!existingWord) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Mot de vocabulaire non trouvé' 
        },
        { status: 404 }
      );
    }

    // Supprimer le mot
    await VocabularyWord.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Mot de vocabulaire supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression du mot de vocabulaire:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la suppression du mot de vocabulaire' 
      },
      { status: 500 }
    );
  }
}
