import { asyncHandler } from "../utils/asyncHandler";
import { ok } from "../utils/response";
import { ApiError } from "../utils/ApiError";
import { Plan } from "../models/Plan";
import { PaymentCycle } from "../models/PaymentCycle";
import { writeAudit } from "../services/audit.service";
import { parseYearMonth, addMonths, toYearMonth, dueDateFor } from "../utils/date";

/**
 * POST /api/admin/plans/:planId/cycles/generate
 * Generates cycles for the plan up to plan.maxMembers months starting from plan.startMonth.
 * Default due date: 5th of each month
 */
export const generateCyclesForPlan = asyncHandler(async (req, res) => {
  const { planId } = req.params;

  const plan = await Plan.findById(planId);
  if (!plan) throw new ApiError(404, "Plan not found");

  const { y, m } = parseYearMonth(plan.startMonth);

  const cyclesToCreate = [];
  for (let i = 0; i < plan.maxMembers; i++) {
    const next = addMonths(y, m, i);
    const cycleMonth = toYearMonth(next.y, next.m);
    const dueDate = dueDateFor(next.y, next.m, 5);

    cyclesToCreate.push({
      planId: plan._id,
      cycleMonth,
      dueDate,
      status: "OPEN" as const
    });
  }

  // Insert many but ignore duplicates
  // We will do upsert-like behavior by checking what exists first
  const existing = await PaymentCycle.find({ planId: plan._id }).select("cycleMonth");
  const existingSet = new Set(existing.map((c) => c.cycleMonth));

  const newOnes = cyclesToCreate.filter(c => !existingSet.has(c.cycleMonth));

  if (newOnes.length === 0) {
    return ok(res, { created: 0 }, "No new cycles to generate");
  }

  const created = await PaymentCycle.insertMany(newOnes);

  await writeAudit({
    actorUserId: req.user!.userId,
    action: "CYCLES_GENERATED",
    entityType: "Plan",
    entityId: plan.id,
    after: { planId: plan.id, createdCount: created.length }
  });

  return ok(res, { created: created.length }, "Cycles generated");
});

/**
 * GET /api/admin/plans/:planId/cycles
 */
export const listCyclesForPlan = asyncHandler(async (req, res) => {
  const { planId } = req.params;

  const cycles = await PaymentCycle.find({ planId })
    .sort({ cycleMonth: 1 });

  return ok(res, cycles, "Plan cycles");
});
