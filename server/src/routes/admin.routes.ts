import { Router } from "express";
import { auth } from "../middlewares/auth";
import { requireRole } from "../middlewares/role";
import { validate } from "../middlewares/validate";
import { z } from "zod";
import { createPlan, listPlans } from "../controllers/admin.controller";
import { listUsers, approveUser, addMemberToPlan, listPlanMembers } from "../controllers/member.controller";
import { generateCyclesForPlan, listCyclesForPlan } from "../controllers/cycle.controller";
import { listPayments, approvePayment, rejectPayment } from "../controllers/payment.controller";
import { runDraw, confirmDraw, updateWinner, listDraws } from "../controllers/draw.controller";






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

const addMemberSchema = z.object({
  body: z.object({
    userId: z.string().min(10)
  })
});

// Users
router.get("/users", listUsers);
router.patch("/users/:userId/approve", approveUser);

// Plan members
router.post("/plans/:planId/members", validate(addMemberSchema), addMemberToPlan);
router.get("/plans/:planId/members", listPlanMembers);

router.post("/plans/:planId/cycles/generate", generateCyclesForPlan);
router.get("/plans/:planId/cycles", listCyclesForPlan);

const rejectSchema = z.object({
  body: z.object({
    reason: z.string().min(3)
  })
});


router.get("/payments", listPayments);
router.patch("/payments/:paymentId/approve", approvePayment);
router.patch("/payments/:paymentId/reject", validate(rejectSchema), rejectPayment);


const runDrawSchema = z.object({
  body: z.object({
    planId: z.string().min(10),
    cycleId: z.string().min(10)
  })
});

const updateWinnerSchema = z.object({
  body: z.object({
    newWinnerUserId: z.string().min(10),
    reason: z.string().min(3)
  })
});


router.get("/draws", listDraws);
router.post("/draws/run", validate(runDrawSchema), runDraw);
router.post("/draws/:drawId/confirm", confirmDraw);
router.patch("/draws/:drawId/update-winner", validate(updateWinnerSchema), updateWinner);





export default router;
