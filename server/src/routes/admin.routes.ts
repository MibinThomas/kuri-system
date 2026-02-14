import { Router } from "express";
import { auth } from "../middlewares/auth";
import { requireRole } from "../middlewares/role";
import { validate } from "../middlewares/validate";
import { z } from "zod";
import { createPlan, listPlans } from "../controllers/admin.controller";

const router = Router();

const planSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    monthlyAmount: z.number().positive(),
    currency: z.string().default("AED"),
    maxMembers: z.number().int().positive(),
    startMonth: z.string().regex(/^\d{4}-\d{2}$/), // YYYY-MM
    status: z.enum(["UPCOMING", "RUNNING", "COMPLETED"]).optional()
  })
});

router.use(auth, requireRole("ADMIN"));

router.get("/plans", listPlans);
router.post("/plans", validate(planSchema), createPlan);

export default router;
