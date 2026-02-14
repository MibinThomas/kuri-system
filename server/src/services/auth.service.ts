import { User } from "../models/User";
import { ApiError } from "../utils/ApiError";
import { comparePassword, hashPassword } from "../utils/password";
import { signToken } from "../utils/jwt";

export async function registerMember(input: {
  fullName: string;
  phone: string;
  email?: string;
  password: string;
}) {
  const existing = await User.findOne({ phone: input.phone });
  if (existing) throw new ApiError(409, "Phone already registered");

  const passwordHash = await hashPassword(input.password);

  const user = await User.create({
    fullName: input.fullName,
    phone: input.phone,
    email: input.email,
    passwordHash,
    role: "MEMBER",
    status: "PENDING"
  });

  return user;
}

export async function login(input: { phone: string; password: string }) {
  const user = await User.findOne({ phone: input.phone });
  if (!user) throw new ApiError(401, "Invalid credentials");
  if (user.status === "BLOCKED") throw new ApiError(403, "Account blocked");

  const ok = await comparePassword(input.password, user.passwordHash);
  if (!ok) throw new ApiError(401, "Invalid credentials");

  const token = signToken({ userId: user.id, role: user.role });
  return { user, token };
}
