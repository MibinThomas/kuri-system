import { asyncHandler } from "../utils/asyncHandler";
import { ok } from "../utils/response";
import { ApiError } from "../utils/ApiError";
import { Plan } from "../models/Plan";
import { Draw } from "../models/Draw";
import { PaymentCycle } from "../models/PaymentCycle";

export const publicPlans = asyncHandler(async (_req, res) => {
  const plans = await Plan.find().sort({ createdAt: -1 });
  return ok(res, plans, "Plans");
});

/**
 * GET /api/plans/:planId/winners
 * Returns month-wise winners for the plan.
 */
export const planWinners = asyncHandler(async (req, res) => {
  const { planId } = req.params;

  const plan = await Plan.findById(planId);
  if (!plan) throw new ApiError(404, "Plan not found");

  // Get draws for this plan with winner info
  const draws = await Draw.find({ planId })
    .populate("winnerUserId", "fullName phone")
    .sort({ drawnAt: 1 });

  // Map cycleId -> cycleMonth
  const cycleIds = draws.map(d => d.cycleId);
  const cycles = await PaymentCycle.find({ _id: { $in: cycleIds } }).select("cycleMonth");
  const cycleMap = new Map(cycles.map(c => [String(c._id), c.cycleMonth]));

  const result = draws.map(d => ({
    drawId: d._id,
    cycleId: d.cycleId,
    cycleMonth: cycleMap.get(String(d.cycleId)) ?? null,
    winner: d.winnerUserId,
    drawnAt: d.drawnAt,
    confirmedAt: d.confirmedAt ?? null
  }));

  return ok(res, { plan, winners: result }, "Winners");
});
