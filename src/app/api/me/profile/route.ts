import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateProfileImage, isValidCustomId } from "@/lib/user-utils";
import { z } from "zod";

const UpdateProfileSchema = z.object({
  customId: z.string().min(3).max(20).optional(),
  name: z.string().min(1).max(100).optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const user = await User.findById(session.user.id).select('email name customId image points role createdAt');
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        email: user.email,
        name: user.name,
        customId: user.customId,
        image: user.image,
        points: user.points,
        role: user.role,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération du profil' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const body = await request.json();
    const { customId, name } = UpdateProfileSchema.parse(body);

    const user = await User.findById(session.user.id);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier si le customId est fourni et valide
    if (customId) {
      if (!isValidCustomId(customId)) {
        return NextResponse.json(
          { success: false, error: 'CustomId invalide. Doit contenir 3-20 caractères alphanumériques.' },
          { status: 400 }
        );
      }

      // Vérifier si le customId n'est pas déjà utilisé par un autre utilisateur
      const existingUser = await User.findOne({ customId, _id: { $ne: session.user.id } });
      if (existingUser) {
        return NextResponse.json(
          { success: false, error: 'Ce customId est déjà utilisé par un autre utilisateur' },
          { status: 409 }
        );
      }

      user.customId = customId;
      
      // Générer une nouvelle image de profil basée sur le nouveau customId
      user.image = generateProfileImage(customId);
    }

    // Mettre à jour le nom si fourni
    if (name) {
      user.name = name;
    }

    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      user: {
        email: user.email,
        name: user.name,
        customId: user.customId,
        image: user.image,
        points: user.points,
        role: user.role,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues.map((i) => i.message).join(", ") || "Données invalides";
      return NextResponse.json({ success: false, error: message }, { status: 400 });
    }
    
    console.error('Erreur lors de la mise à jour du profil:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la mise à jour du profil' },
      { status: 500 }
    );
  }
}
