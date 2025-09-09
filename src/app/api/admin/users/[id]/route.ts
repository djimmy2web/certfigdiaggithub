import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Attempt } from "@/models/Attempt";
import { z } from "zod";
import mongoose from "mongoose";

const UpdateUserSchema = z.object({
  role: z.enum(["user", "admin"]).optional(),
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
});

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    await connectToDatabase();

    const { id } = await context.params;
    const body = await req.json();
    const updateData = UpdateUserSchema.parse(body);

    // Vérifier que l'utilisateur existe
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser?._id,
        email: updatedUser?.email,
        name: updatedUser?.name,
        role: updatedUser?.role,
        createdAt: updatedUser?.createdAt,
        lastLogin: (updatedUser as { lastLogin?: unknown }).lastLogin || null,
      },
    });

  } catch (error) {
    console.error("Erreur modification utilisateur:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: "Données invalides",
        details: error.issues,
      }, { status: 400 });
    }

    const status = (error && typeof error === 'object' && 'status' in error && typeof error.status === 'number') ? error.status : 500;
    const message = status === 401 ? "Non autorisé" : status === 403 ? "Interdit" : "Erreur serveur";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    await connectToDatabase();

    const { id } = await context.params;

    // Vérifier que l'utilisateur existe
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Empêcher la suppression de son propre compte
    const session = await requireAdmin();
    if (session.user.id === id) {
      return NextResponse.json({ 
        error: "Vous ne pouvez pas supprimer votre propre compte" 
      }, { status: 400 });
    }

    // Supprimer toutes les tentatives de l'utilisateur
    await Attempt.deleteMany({ userId: new mongoose.Types.ObjectId(id) });

    // Supprimer l'utilisateur
    await User.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Utilisateur supprimé avec succès",
    });

  } catch (error) {
    console.error("Erreur suppression utilisateur:", error);
    const status = (error && typeof error === 'object' && 'status' in error && typeof error.status === 'number') ? error.status : 500;
    const message = status === 401 ? "Non autorisé" : status === 403 ? "Interdit" : "Erreur serveur";
    return NextResponse.json({ error: message }, { status });
  }
}
