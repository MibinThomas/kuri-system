import { Schema, model, Document, Types } from "mongoose";

export type PaymentStatus = "PAID" | "PENDING" | "REJECTED";
export type PaymentMethod = "CASH" | "BANK" | "ONLINE";

export interface IPayment extends Document {
  planId: Types.ObjectId;
  cycleId: Types.ObjectId;
  userId: Types.ObjectId;
  amount: number;
  method: PaymentMethod;
  referenceNo?: string;
  status: PaymentStatus;
  paidAt?: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    planId: { type: Schema.Types.ObjectId, ref: "Plan", required: true, index: true },
    cycleId: { type: Schema.Types.ObjectId, ref: "PaymentCycle", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true },
    method: { type: String, enum: ["CASH", "BANK", "ONLINE"], required: true },
    referenceNo: { type: String },
    status: { type: String, enum: ["PAID", "PENDING", "REJECTED"], default: "PENDING", index: true },
    paidAt: { type: Date }
  },
  { timestamps: true }
);

PaymentSchema.index({ planId: 1, cycleId: 1, userId: 1 }, { unique: true });

export const Payment = model<IPayment>("Payment", PaymentSchema);
