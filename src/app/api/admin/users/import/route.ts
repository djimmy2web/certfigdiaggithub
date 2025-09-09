import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";
import { z } from "zod";

interface ImportSuccess {
  line: number;
  email: string;
  name: string;
  role: string;
  password?: string;
  userId: string;
}

interface ImportError {
  line: number;
  email: string;
  error: string;
}

// Schéma de validation pour chaque ligne CSV
const UserImportSchema = z.object({
  email: z.string().email("Email invalide"),
  name: z.string().min(1, "Nom requis"),
  role: z.enum(["user", "admin"]).default("user"),
  password: z.string().min(6, "Mot de passe minimum 6 caractères").optional(),
});

// Schéma pour le corps de la requête
const ImportRequestSchema = z.object({
  users: z.array(UserImportSchema),
  generatePasswords: z.boolean().default(false),
  sendEmails: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    await connectToDatabase();

    const body = await req.json();
    const { users, generatePasswords } = ImportRequestSchema.parse(body);

    const results = {
      success: [] as ImportSuccess[],
      errors: [] as ImportError[],
      summary: {
        total: users.length,
        imported: 0,
        failed: 0,
        skipped: 0,
      },
    };

    for (let i = 0; i < users.length; i++) {
      const userData = users[i];
      const lineNumber = i + 1;

      try {
        // Vérifier si l'utilisateur existe déjà
        const existingUser = await User.findOne({ email: userData.email.toLowerCase() });
        if (existingUser) {
          results.errors.push({
            line: lineNumber,
            email: userData.email,
            error: "Utilisateur déjà existant",
          });
          results.summary.skipped++;
          continue;
        }

        // Générer un mot de passe si nécessaire
        let password = userData.password;
        if (!password && generatePasswords) {
          password = generateRandomPassword();
        } else if (!password) {
          results.errors.push({
            line: lineNumber,
            email: userData.email,
            error: "Mot de passe manquant",
          });
          results.summary.failed++;
          continue;
        }

        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(password!, 12);

        // Créer l'utilisateur
        const newUser = await User.create({
          email: userData.email.toLowerCase(),
          name: userData.name,
          role: userData.role,
          password: hashedPassword,
        });

        results.success.push({
          line: lineNumber,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          password: generatePasswords ? password : undefined,
          userId: newUser._id.toString(),
        });

        results.summary.imported++;

        // TODO: Envoyer un email de bienvenue si sendEmails est true
        // if (sendEmails) {
        //   await sendWelcomeEmail(userData.email, userData.name, password);
        // }

      } catch (error: unknown) {
        results.errors.push({
          line: lineNumber,
          email: userData.email,
          error: error instanceof Error ? error.message : "Erreur inconnue",
        });
        results.summary.failed++;
      }
    }

    return NextResponse.json({
      success: true,
      results,
    });

  } catch (error: unknown) {
    console.error("Erreur import CSV:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: "Données invalides",
        details: error.issues,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: "Erreur lors de l'import",
    }, { status: 500 });
  }
}

// Fonction pour générer un mot de passe aléatoire
function generateRandomPassword(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let password = "";
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
