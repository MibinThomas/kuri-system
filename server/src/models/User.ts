import { Schema, model, Document } from "mongoose";

export type UserRole = "ADMIN" | "MEMBER";
export type UserStatus = "ACTIVE" | "PENDING" | "BLOCKED";

export interface IUser extends Document {
  fullName: string;
  phone: string;
  email?: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
}

const UserSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, index: true },
    email: { type: String, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["ADMIN", "MEMBER"], default: "MEMBER", index: true },
    status: { type: String, enum: ["ACTIVE", "PENDING", "BLOCKED"], default: "PENDING", index: true }
  },
  { timestamps: true }
);

export const User = model<IUser>("User", UserSchema);
