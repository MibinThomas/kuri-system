import { asyncHandler } from "../utils/asyncHandler";
import { ok } from "../utils/response";
import { registerMember, login } from "../services/auth.service";
import { ApiError } from "../utils/ApiError";
import { User } from "../models/User";

export const register = asyncHandler(async (req, res) => {
  const user = await registerMember(req.body);
  return ok(res, { id: user.id, status: user.status }, "Registered (pending approval)");
});

export const loginUser = asyncHandler(async (req, res) => {
  const result = await login(req.body);
  return ok(res, { token: result.token, user: { id: result.user.id, role: result.user.role, status: result.user.status } }, "Logged in");
});

export const me = asyncHandler(async (req, res) => {
  if (!req.user) throw new ApiError(401, "Unauthorized");
  const user = await User.findById(req.user.userId).select("-passwordHash");
  return ok(res, user, "Me");
});
