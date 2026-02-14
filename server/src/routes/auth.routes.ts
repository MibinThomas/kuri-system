import { Router } from "express";
import { validate } from "../middlewares/validate";
import { z } from "zod";
import { register, loginUser, me } from "../controllers/auth.controller";
import { auth } from "../middlewares/auth";

const router = Router();

const registerSchema = z.object({
  body: z.object({
    fullName: z.string().min(2),
    phone: z.string().min(6),
    email: z.string().email().optional(),
    password: z.string().min(6)
  })
});

const loginSchema = z.object({
  body: z.object({
    phone: z.string().min(6),
    password: z.string().min(6)
  })
});

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), loginUser);
router.get("/me", auth, me);

export default router;
