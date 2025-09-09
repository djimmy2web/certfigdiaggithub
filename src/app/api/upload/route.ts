import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth-helpers";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configuration de Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const fileFilter = (req: unknown, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Autoriser seulement les images et vidéos
  if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
    cb(null, true);
  } else {
    cb(new Error("Type de fichier non autorisé. Seules les images et vidéos sont acceptées."));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

// Fonction pour promisifier multer
const uploadMiddleware = (req: NextRequest) => {
  return new Promise((resolve, reject) => {
    upload.single("media")(req as never, {} as never, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve((req as { file?: Express.Multer.File }).file);
      }
    });
  });
};

export async function POST(req: NextRequest) {
  try {
    // Vérifier l'authentification
    await requireSession();
    
    const file = await uploadMiddleware(req) as Express.Multer.File;
    
    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    // Déterminer le type de média
    const mediaType = file.mimetype.startsWith("image/") ? "image" : "video";
    
    // Retourner les informations du fichier
    return NextResponse.json({
      success: true,
      file: {
        type: mediaType,
        url: `/uploads/${file.filename}`,
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
      },
    });
  } catch (error: unknown) {
    console.error("Erreur upload:", error);
    
    if (error instanceof Error && error.message.includes("Type de fichier non autorisé")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    if (error && typeof error === 'object' && 'code' in error && error.code === "LIMIT_FILE_SIZE") {
      return NextResponse.json({ error: "Fichier trop volumineux. Taille maximale: 10MB" }, { status: 400 });
    }
    
    const status = (error && typeof error === 'object' && 'status' in error && typeof error.status === 'number') ? error.status : 500;
    const message = status === 401 ? "Non autorisé" : "Erreur serveur";
    return NextResponse.json({ error: message }, { status });
  }
}
