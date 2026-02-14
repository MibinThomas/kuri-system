import { Schema, model, Document, Types } from "mongoose";

export interface IDraw extends Document {
  planId: Types.ObjectId;
  cycleId: Types.ObjectId;
  winnerUserId: Types.ObjectId;
  eligibleUserIds: Types.ObjectId[];
  seed: string;
  drawnAt: Date;
  confirmedByAdminId?: Types.ObjectId;
  confirmedAt?: Date;
}

const DrawSchema = new Schema<IDraw>(
  {
    planId: { type: Schema.Types.ObjectId, ref: "Plan", required: true, index: true },
    cycleId: { type: Schema.Types.ObjectId, ref: "PaymentCycle", required: true, index: true },
    winnerUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    eligibleUserIds: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    seed: { type: String, required: true },
    drawnAt: { type: Date, required: true },
    confirmedByAdminId: { type: Schema.Types.ObjectId, ref: "User" },
    confirmedAt: { type: Date }
  },
  { timestamps: true }
);

DrawSchema.index({ planId: 1, cycleId: 1 }, { unique: true });

export const Draw = model<IDraw>("Draw", DrawSchema);
