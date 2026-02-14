import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export type JwtPayload = { userId: string; role: "ADMIN" | "MEMBER" };

export function signToken(payload: JwtPayload) {
  const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"] };
  return jwt.sign(payload, env.JWT_SECRET as jwt.Secret, options);
}

export function verifyToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET as jwt.Secret) as JwtPayload;
}
