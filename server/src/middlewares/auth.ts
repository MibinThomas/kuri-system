import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import { verifyToken } from "../utils/jwt";

export type AuthUser = { userId: string; role: "ADMIN" | "MEMBER" };

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function auth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) throw new ApiError(401, "Unauthorized");

  const token = header.replace("Bearer ", "");
  const payload = verifyToken(token);
  req.user = { userId: payload.userId, role: payload.role };
  next();
}
