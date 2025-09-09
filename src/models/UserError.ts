import mongoose, { Schema, Document } from 'mongoose';

export interface IUserError extends Document {
  userId: mongoose.Types.ObjectId;
  quizType: "vocabulary" | "thematic";
  questionId: string;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  quizTitle?: string;
  difficulty: "debutant" | "intermediaire" | "expert";
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserErrorSchema = new Schema<IUserError>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  quizType: {
    type: String,
    enum: ['vocabulary', 'thematic'],
    required: true
  },
  questionId: {
    type: String,
    required: true
  },
  question: {
    type: String,
    required: true,
    trim: true
  },
  userAnswer: {
    type: String,
    required: true,
    trim: true
  },
  correctAnswer: {
    type: String,
    required: true,
    trim: true
  },
  quizTitle: {
    type: String,
    trim: true
  },
  difficulty: {
    type: String,
    enum: ['debutant', 'intermediaire', 'expert'],
    required: true
  },
  category: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index pour améliorer les performances
UserErrorSchema.index({ userId: 1, createdAt: -1 });
UserErrorSchema.index({ quizType: 1, createdAt: -1 });
UserErrorSchema.index({ difficulty: 1 });
UserErrorSchema.index({ category: 1 });

export const UserError = mongoose.models.UserError || mongoose.model<IUserError>('UserError', UserErrorSchema);
