import { Schema, model, Document, Types } from "mongoose";

export type CycleStatus = "OPEN" | "LOCKED";

export interface IPaymentCycle extends Document {
  planId: Types.ObjectId;
  cycleMonth: string; // YYYY-MM
  dueDate: Date;
  status: CycleStatus;
}

const PaymentCycleSchema = new Schema<IPaymentCycle>(
  {
    planId: { type: Schema.Types.ObjectId, ref: "Plan", required: true, index: true },
    cycleMonth: { type: String, required: true, index: true },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: ["OPEN", "LOCKED"], default: "OPEN", index: true }
  },
  { timestamps: true }
);

PaymentCycleSchema.index({ planId: 1, cycleMonth: 1 }, { unique: true });

export const PaymentCycle = model<IPaymentCycle>("PaymentCycle", PaymentCycleSchema);

