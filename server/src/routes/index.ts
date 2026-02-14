import { Router } from "express";
import authRoutes from "./auth.routes";
import adminRoutes from "./admin.routes";
import memberRoutes from "./member.routes";
import publicPlanRoutes from "./public.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/member", memberRoutes);

// Public plan routes
router.use("/plans", publicPlanRoutes);

export default router;
