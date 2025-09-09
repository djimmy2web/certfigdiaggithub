import mongoose, { Schema, Model, Types } from "mongoose";

export interface IThemeProgress {
  userId: Types.ObjectId;
  themeSlug: string;
  currentLevel: "debutant" | "intermediaire" | "expert";
  completedQuizzes: {
    quizId: Types.ObjectId;
    score: number;
    totalQuestions: number;
    completedAt: Date;
    difficulty: "debutant" | "intermediaire" | "expert";
  }[];
  totalScore: number;
  totalQuizzesCompleted: number;
  lastActivityAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IThemeProgressMethods {
  canAccessLevel(level: "debutant" | "intermediaire" | "expert"): boolean;
  getLevelProgress(level: "debutant" | "intermediaire" | "expert"): {
    completed: number;
    totalScore: number;
    averageScore: number;
  };
  updateCurrentLevel(): "debutant" | "intermediaire" | "expert";
}

export type ThemeProgressModel = Model<IThemeProgress, object, IThemeProgressMethods>;

const CompletedQuizSchema = new Schema(
  {
    quizId: { type: Schema.Types.ObjectId, ref: "Quiz", required: true },
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    completedAt: { type: Date, default: Date.now },
    difficulty: { type: String, enum: ["debutant", "intermediaire", "expert"], required: true }
  },
  { _id: false }
);

const ThemeProgressSchema = new Schema<IThemeProgress, ThemeProgressModel, IThemeProgressMethods>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    themeSlug: { type: String, required: true, lowercase: true, trim: true },
    currentLevel: { 
      type: String, 
      enum: ["debutant", "intermediaire", "expert"], 
      default: "debutant" 
    },
    completedQuizzes: [CompletedQuizSchema],
    totalScore: { type: Number, default: 0 },
    totalQuizzesCompleted: { type: Number, default: 0 },
    lastActivityAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Créer les index séparément
ThemeProgressSchema.index({ userId: 1, themeSlug: 1 });
ThemeProgressSchema.index({ themeSlug: 1, currentLevel: 1 });

// Méthodes pour calculer la progression
ThemeProgressSchema.methods.canAccessLevel = function(this: IThemeProgress, level: "debutant" | "intermediaire" | "expert"): boolean {
  const levelOrder: Record<string, number> = { debutant: 0, intermediaire: 1, expert: 2 };
  const currentLevelOrder = levelOrder[this.currentLevel];
  const targetLevelOrder = levelOrder[level];
  
  return targetLevelOrder <= currentLevelOrder;
};

ThemeProgressSchema.methods.getLevelProgress = function(this: IThemeProgress, level: "debutant" | "intermediaire" | "expert") {
  const levelQuizzes = this.completedQuizzes.filter((q) => q.difficulty === level);
  return {
    completed: levelQuizzes.length,
    totalScore: levelQuizzes.reduce((sum: number, q) => sum + q.score, 0),
    averageScore: levelQuizzes.length > 0 ? Math.round(levelQuizzes.reduce((sum: number, q) => sum + q.score, 0) / levelQuizzes.length) : 0
  };
};

ThemeProgressSchema.methods.updateCurrentLevel = function(this: IThemeProgress & IThemeProgressMethods) {
  const debutantProgress = this.getLevelProgress("debutant");
  const intermediaireProgress = this.getLevelProgress("intermediaire");
  // const expertProgress = this.getLevelProgress("expert");
  
  // Conditions pour débloquer les niveaux
  if (debutantProgress.completed >= 2 && debutantProgress.averageScore >= 70) {
    this.currentLevel = "intermediaire";
  }
  
  if (intermediaireProgress.completed >= 2 && intermediaireProgress.averageScore >= 75) {
    this.currentLevel = "expert";
  }
  
  return this.currentLevel;
};

export const ThemeProgress = (mongoose.models.ThemeProgress as ThemeProgressModel) || 
  mongoose.model<IThemeProgress, ThemeProgressModel>("ThemeProgress", ThemeProgressSchema);
