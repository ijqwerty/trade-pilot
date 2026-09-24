import { Schema, model, models, type Document, type Model } from 'mongoose';

export interface NotificationDocument extends Document {
  userId: string;
  type: string;
  title: string;
  body: string;
  symbol?: string;
  href?: string;
  readAt?: Date | null;
  createdAt: Date;
  dedupeKey?: string;
}

const NotificationSchema = new Schema<NotificationDocument>(
  {
    userId: { type: String, required: true, index: true },
    type: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    symbol: { type: String, required: false, uppercase: true, trim: true },
    href: { type: String, required: false, trim: true },
    readAt: { type: Date, required: false, default: null },
    createdAt: { type: Date, default: Date.now },
    dedupeKey: { type: String, required: false, trim: true },
  },
  { timestamps: false }
);

// Idempotent alert fan-out: one row per user + dedupeKey when key is present
NotificationSchema.index(
  { userId: 1, dedupeKey: 1 },
  { unique: true, partialFilterExpression: { dedupeKey: { $type: 'string' } } }
);

export const Notification: Model<NotificationDocument> =
  (models?.Notification as Model<NotificationDocument>) ||
  model<NotificationDocument>('Notification', NotificationSchema);
