import { Router } from "express";
import { publicPlans, planWinners } from "../controllers/public.controller";

const router = Router();

router.get("/", publicPlans);
router.get("/:planId/winners", planWinners);

export default router;
