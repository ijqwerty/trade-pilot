import { Schema, model, models, type Document, type Model } from 'mongoose';

export interface AlertDocument extends Document {
  userId: string;
  symbol: string;
  company: string;
  alertName: string;
  alertType: 'upper' | 'lower';
  threshold: number;
  enabled: boolean;
  /** When true, a crossed threshold may fire; false until price returns to the non-triggered side. */
  isArmed: boolean;
  lastTriggeredAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const AlertSchema = new Schema<AlertDocument>(
  {
    userId: { type: String, required: true, index: true },
    symbol: { type: String, required: true, uppercase: true, trim: true },
    company: { type: String, required: true, trim: true },
    alertName: { type: String, required: true, trim: true, maxlength: 80 },
    alertType: { type: String, required: true, enum: ['upper', 'lower'] },
    threshold: { type: Number, required: true },
    enabled: { type: Boolean, required: true, default: true },
    isArmed: { type: Boolean, required: true, default: true },
    lastTriggeredAt: { type: Date, required: false, default: null },
  },
  { timestamps: true }
);

AlertSchema.index({ userId: 1, symbol: 1 });
AlertSchema.index({ userId: 1, enabled: 1 });

export const AlertModel: Model<AlertDocument> =
  (models?.Alert as Model<AlertDocument>) || model<AlertDocument>('Alert', AlertSchema);
