import { Schema, model, Document, Types } from "mongoose";

export type PlanStatus = "UPCOMING" | "RUNNING" | "COMPLETED";

export interface IPlan extends Document {
  name: string;
  monthlyAmount: number;
  currency: string;
  maxMembers: number;
  startMonth: string; // YYYY-MM
  status: PlanStatus;
  createdBy: Types.ObjectId;
}

const PlanSchema = new Schema<IPlan>(
  {
    name: { type: String, required: true, trim: true },
    monthlyAmount: { type: Number, required: true },
    currency: { type: String, default: "AED" },
    maxMembers: { type: Number, required: true },
    startMonth: { type: String, required: true, index: true },
    status: { type: String, enum: ["UPCOMING", "RUNNING", "COMPLETED"], default: "UPCOMING", index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

PlanSchema.index({ monthlyAmount: 1, startMonth: 1 });

export const Plan = model<IPlan>("Plan", PlanSchema);
