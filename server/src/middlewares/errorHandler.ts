import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const status = err instanceof ApiError ? err.statusCode : 500;
  const message = err instanceof ApiError ? err.message : "Internal Server Error";

  if (status >= 500) console.error(err);

  res.status(status).json({
    success: false,
    message,
    details: err instanceof ApiError ? err.details : undefined,
  });
}
