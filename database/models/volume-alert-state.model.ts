import { Schema, model, models, type Document, type Model } from 'mongoose';

/**
 * Per-user+symbol armed flag for automatic watchlist volume spikes (spec 11).
 * Do not store these on price `Alert` documents.
 */
export interface VolumeAlertStateDocument extends Document {
  userId: string;
  symbol: string;
  /** When true, a new spike may fire; false until volume falls back below threshold. */
  isArmed: boolean;
  lastTriggeredAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const VolumeAlertStateSchema = new Schema<VolumeAlertStateDocument>(
  {
    userId: { type: String, required: true, index: true },
    symbol: { type: String, required: true, uppercase: true, trim: true },
    isArmed: { type: Boolean, required: true, default: true },
    lastTriggeredAt: { type: Date, required: false, default: null },
  },
  { timestamps: true }
);

VolumeAlertStateSchema.index({ userId: 1, symbol: 1 }, { unique: true });

export const VolumeAlertState: Model<VolumeAlertStateDocument> =
  (models?.VolumeAlertState as Model<VolumeAlertStateDocument>) ||
  model<VolumeAlertStateDocument>('VolumeAlertState', VolumeAlertStateSchema);
