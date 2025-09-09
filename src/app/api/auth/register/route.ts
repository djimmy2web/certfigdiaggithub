import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { generateUniqueCustomId, generateProfileImage } from "@/lib/user-utils";

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).optional(),
});

export async function POST(req: NextRequest) {
  try {
    console.log('🚀 Début de l\'inscription...');
    
    const body = await req.json();
    console.log('📥 Données reçues:', { email: body.email, name: body.name, passwordLength: body.password?.length });
    
    const { email, password, name } = RegisterSchema.parse(body);
    console.log('✅ Validation des données réussie');

    console.log('🔌 Connexion à la base de données...');
    await connectToDatabase();
    console.log('✅ Connecté à la base de données');

    console.log('🔍 Vérification de l\'existence de l\'email...');
    const existing = await User.findOne({ email });
    if (existing) {
      console.log('❌ Email déjà utilisé:', email);
      return NextResponse.json({ error: "Email déjà utilisé" }, { status: 409 });
    }
    console.log('✅ Email disponible');

    // Générer un customId unique
    console.log('🆔 Génération du customId...');
    let existingCustomIds: string[] = [];
    try {
      existingCustomIds = await User.distinct('customId');
      console.log('📊 CustomIds existants:', existingCustomIds);
    } catch {
      // Si la collection n'existe pas encore, on commence avec une liste vide
      console.log('ℹ️ Collection users vide, génération du premier customId');
    }
    
    const customId = await generateUniqueCustomId(existingCustomIds);
    console.log('✅ CustomId généré:', customId);
    
    // Générer une image de profil
    console.log('🖼️ Génération de l\'image de profil...');
    const profileImage = generateProfileImage(customId);
    console.log('✅ Image de profil générée:', profileImage);

    console.log('🔐 Hashage du mot de passe...');
    const passwordHash = await bcrypt.hash(password, 10);
    console.log('✅ Mot de passe hashé');

    console.log('💾 Création de l\'utilisateur...');
    const userData = { 
      email, 
      passwordHash, 
      name, 
      customId, 
      image: profileImage 
    };
    console.log('📝 Données utilisateur:', { ...userData, passwordHash: '[HIDDEN]' });
    
    const newUser = await User.create(userData);
    console.log('✅ Utilisateur créé avec succès, ID:', newUser._id);

    // Avec NextAuth on ne renvoie pas de token ici; l'utilisateur se connecte via /api/auth/signin
    return NextResponse.json({ success: true, message: "Compte créé. Vous pouvez vous connecter." });
    
  } catch (error: unknown) {
    console.error('❌ Erreur lors de l\'inscription:', error);
    
    if (error instanceof z.ZodError) {
      console.log('🔍 Erreur de validation Zod:', error.issues);
      const message = error.issues.map((i) => i.message).join(", ") || "Données invalides";
      return NextResponse.json({ error: message }, { status: 400 });
    }
    
    if (error instanceof Error) {
      console.log('🔍 Erreur standard:', error.message);
      console.log('🔍 Stack trace:', error.stack);
    }
    
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
