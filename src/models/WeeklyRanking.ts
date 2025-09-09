import mongoose, { Schema, Document } from 'mongoose';

export interface IWeeklyRanking extends Document {
  weekStart: Date; // Début de la semaine (lundi)
  weekEnd: Date; // Fin de la semaine (dimanche)
  divisionId: mongoose.Types.ObjectId;
  rankings: Array<{
    userId: mongoose.Types.ObjectId;
    username: string;
    points: number;
    rank: number;
    previousRank?: number;
    status: 'promoted' | 'relegated' | 'stayed' | 'new';
  }>;
  isProcessed: boolean; // Si les promotions/rétrogradations ont été traitées
  createdAt: Date;
  updatedAt: Date;
}

const WeeklyRankingSchema = new Schema<IWeeklyRanking>({
  weekStart: {
    type: Date,
    required: true
  },
  weekEnd: {
    type: Date,
    required: true
  },
  divisionId: {
    type: Schema.Types.ObjectId,
    ref: 'Division',
    required: true
  },
  rankings: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    username: {
      type: String,
      required: true
    },
    points: {
      type: Number,
      required: true,
      default: 0
    },
    rank: {
      type: Number,
      required: true
    },
    previousRank: {
      type: Number,
      required: false
    },
    status: {
      type: String,
      enum: ['promoted', 'relegated', 'stayed', 'new'],
      required: true,
      default: 'new'
    }
  }],
  isProcessed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index composé pour optimiser les requêtes
WeeklyRankingSchema.index({ weekStart: 1, divisionId: 1 }, { unique: true });
WeeklyRankingSchema.index({ 'rankings.userId': 1, weekStart: 1 });

export default mongoose.models.WeeklyRanking || mongoose.model<IWeeklyRanking>('WeeklyRanking', WeeklyRankingSchema);
