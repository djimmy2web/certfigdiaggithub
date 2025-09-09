import mongoose, { Schema, Document } from 'mongoose';

export interface IDivision extends Document {
  name: string;
  minPoints: number;
  maxPoints?: number;
  color: string;
  order: number;
  promotionThreshold: number; // Top 5 pour promotion
  relegationThreshold: number; // Bottom 5 pour rétrogradation
  createdAt: Date;
  updatedAt: Date;
}

const DivisionSchema = new Schema<IDivision>({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['Saphir', 'Or', 'Argent', 'Bronze']
  },
  minPoints: {
    type: Number,
    required: true
  },
  maxPoints: {
    type: Number,
    required: false
  },
  color: {
    type: String,
    required: true
  },
  order: {
    type: Number,
    required: true,
    unique: true
  },
  promotionThreshold: {
    type: Number,
    required: true,
    default: 5
  },
  relegationThreshold: {
    type: Number,
    required: true,
    default: 5
  }
}, {
  timestamps: true
});

// Index pour optimiser les requêtes
DivisionSchema.index({ order: 1 });
DivisionSchema.index({ minPoints: 1 });

export default mongoose.models.Division || mongoose.model<IDivision>('Division', DivisionSchema);
