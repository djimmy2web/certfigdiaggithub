import { NextRequest, NextResponse } from 'next/server';
import { generateProfileImage, generateFallbackProfileImage } from '@/lib/user-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customId = searchParams.get('customId');
    const size = parseInt(searchParams.get('size') || '200');
    const fallback = searchParams.get('fallback') === 'true';

    if (!customId) {
      return NextResponse.json(
        { success: false, error: 'customId est requis' },
        { status: 400 }
      );
    }

    // Générer l'URL de l'image
    const imageUrl = fallback 
      ? generateFallbackProfileImage(customId, size)
      : generateProfileImage(customId, size);

    return NextResponse.json({
      success: true,
      imageUrl,
      customId,
      size,
      service: fallback ? 'ui-avatars' : 'dicebear'
    });

  } catch (error: unknown) {
    console.error('Erreur lors de la génération de l\'image de profil:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la génération de l\'image' },
      { status: 500 }
    );
  }
}
