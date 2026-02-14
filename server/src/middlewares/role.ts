import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";

export function requireRole(...roles: Array<"ADMIN" | "MEMBER">) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new ApiError(401, "Unauthorized");
    if (!roles.includes(req.user.role)) throw new ApiError(403, "Forbidden");
    next();
  };
}
