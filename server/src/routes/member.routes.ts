import { Router } from "express";
import { auth } from "../middlewares/auth";
import { requireRole } from "../middlewares/role";
import { validate } from "../middlewares/validate";
import { z } from "zod";
import { submitPayment, myPayments } from "../controllers/payment.controller";

const router = Router();

router.use(auth, requireRole("MEMBER"));

const submitPaymentSchema = z.object({
  body: z.object({
    planId: z.string().min(10),
    cycleId: z.string().min(10),
    method: z.enum(["CASH", "BANK", "ONLINE"]),
    referenceNo: z.string().optional()
  })
});

router.post("/payments", validate(submitPaymentSchema), submitPayment);
router.get("/payments", myPayments);

export default router;
