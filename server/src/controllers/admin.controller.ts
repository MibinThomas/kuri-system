import { asyncHandler } from "../utils/asyncHandler";
import { ok } from "../utils/response";
import { Plan } from "../models/Plan";
import { writeAudit } from "../services/audit.service";

export const createPlan = asyncHandler(async (req, res) => {
  const plan = await Plan.create({
    ...req.body,
    createdBy: req.user!.userId
  });

  await writeAudit({
    actorUserId: req.user!.userId,
    action: "PLAN_CREATED",
    entityType: "Plan",
    entityId: plan.id,
    after: plan.toObject()
  });

  return ok(res, plan, "Plan created");
});

export const listPlans = asyncHandler(async (_req, res) => {
  const plans = await Plan.find().sort({ createdAt: -1 });
  return ok(res, plans, "Plans");
});
