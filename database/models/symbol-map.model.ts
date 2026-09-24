import { Schema, model, models, type Document, type Model } from 'mongoose';

export interface SymbolMapDocument extends Document {
  symbol: string;
  tradingViewSymbol: string;
  exchange?: string;
  updatedAt: Date;
}

const SymbolMapSchema = new Schema<SymbolMapDocument>(
  {
    symbol: { type: String, required: true, unique: true, uppercase: true, trim: true },
    tradingViewSymbol: { type: String, required: true, trim: true },
    exchange: { type: String, required: false, trim: true },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export const SymbolMap: Model<SymbolMapDocument> =
  (models?.SymbolMap as Model<SymbolMapDocument>) ||
  model<SymbolMapDocument>('SymbolMap', SymbolMapSchema);
