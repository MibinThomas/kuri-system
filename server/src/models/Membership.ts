import { Schema, model, Document, Types } from "mongoose";

export interface IMembership extends Document {
  userId: Types.ObjectId;
  planId: Types.ObjectId;
  memberNumber?: number; // 1..N
  isActive: boolean;
}

const MembershipSchema = new Schema<IMembership>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    planId: { type: Schema.Types.ObjectId, ref: "Plan", required: true, index: true },
    memberNumber: { type: Number },
    isActive: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

// Enforce only ONE active membership per user (partial unique index)
MembershipSchema.index(
  { userId: 1, isActive: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
);


export const Membership = model<IMembership>("Membership", MembershipSchema);
