import { Request, Response, NextFunction } from "express";
import { AnyZodObject } from "zod";
import { ApiError } from "../utils/ApiError";

export function validate(schema: AnyZodObject) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse({ body: req.body, query: req.query, params: req.params });
    if (!result.success) throw new ApiError(400, "Validation error", result.error.flatten());
    next();
  };
}
