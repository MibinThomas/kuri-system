import { Response } from "express";

export function ok(res: Response, data: any, message = "OK") {
  return res.json({ success: true, message, data });
}
