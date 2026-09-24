import { Schema, model, models, type Document, type Model } from 'mongoose';

export interface UserProfileDocument extends Document {
  userId: string;
  country: string;
  investmentGoals: string;
  riskTolerance: string;
  preferredIndustry: string;
  dailyNewsEmail: boolean;
  alertEmail: boolean;
  alertInApp: boolean;
  lastSignedInAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserProfileSchema = new Schema<UserProfileDocument>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    country: { type: String, required: true, trim: true },
    investmentGoals: { type: String, required: true, trim: true },
    riskTolerance: { type: String, required: true, trim: true },
    preferredIndustry: { type: String, required: true, trim: true },
    dailyNewsEmail: { type: Boolean, required: true, default: true },
    alertEmail: { type: Boolean, required: true, default: true },
    alertInApp: { type: Boolean, required: true, default: true },
    lastSignedInAt: { type: Date, required: false },
  },
  { timestamps: true }
);

export const UserProfile: Model<UserProfileDocument> =
  (models?.UserProfile as Model<UserProfileDocument>) ||
  model<UserProfileDocument>('UserProfile', UserProfileSchema);
