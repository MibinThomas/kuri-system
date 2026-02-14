import { asyncHandler } from "../utils/asyncHandler";
import { ok } from "../utils/response";
import { ApiError } from "../utils/ApiError";
import { Draw } from "../models/Draw";
import { Payment } from "../models/Payment";
import { PaymentCycle } from "../models/PaymentCycle";
import { Membership } from "../models/Membership";
import { Plan } from "../models/Plan";
import { writeAudit } from "../services/audit.service";
import { makeSeed, pickWinner } from "../utils/random";

/**
 * POST /api/admin/draws/run
 * Body: { planId, cycleId }
 * Picks winner from eligible PAID members for that cycle.
 */
export const runDraw = asyncHandler(async (req, res) => {
  const { planId, cycleId } = req.body as { planId: string; cycleId: string };

  const plan = await Plan.findById(planId);
  if (!plan) throw new ApiError(404, "Plan not found");

  const cycle = await PaymentCycle.findById(cycleId);
  if (!cycle) throw new ApiError(404, "Cycle not found");
  if (String(cycle.planId) !== planId) throw new ApiError(400, "Cycle does not belong to this plan");
  if (cycle.status === "LOCKED") throw new ApiError(409, "Cycle is locked. Draw cannot be run.");

  // Prevent duplicate draw for same cycle
  const existingDraw = await Draw.findOne({ planId, cycleId });
  if (existingDraw) return ok(res, existingDraw, "Draw already exists for this cycle");

  // Eligible members = active plan members who PAID for this cycle
  // 1) Fetch active members of plan
  const members = await Membership.find({ planId, isActive: true }).select("userId");
  const memberUserIds = members.map(m => String(m.userId));

  if (memberUserIds.length === 0) throw new ApiError(409, "No members in this plan");

  // 2) Fetch PAID payments for this cycle among plan members
  const paid = await Payment.find({
    planId,
    cycleId,
    status: "PAID",
    userId: { $in: memberUserIds }
  }).select("userId");

  const eligibleUserIds = paid.map(p => p.userId);

  if (eligibleUserIds.length === 0) {
    throw new ApiError(409, "No eligible members (no PAID payments for this month)");
  }

  const seed = makeSeed();
  const { winner } = pickWinner(eligibleUserIds, seed);

  const draw = await Draw.create({
    planId,
    cycleId,
    winnerUserId: winner,
    eligibleUserIds,
    seed,
    drawnAt: new Date()
  });

  await writeAudit({
    actorUserId: req.user!.userId,
    action: "DRAW_RUN",
    entityType: "Draw",
    entityId: draw.id,
    after: draw.toObject()
  });

  return ok(res, draw, "Draw executed (pending confirmation)");
});

/**
 * POST /api/admin/draws/:drawId/confirm
 * Locks the cycle after confirming draw.
 */
export const confirmDraw = asyncHandler(async (req, res) => {
  const { drawId } = req.params;

  const draw = await Draw.findById(drawId);
  if (!draw) throw new ApiError(404, "Draw not found");

  const cycle = await PaymentCycle.findById(draw.cycleId);
  if (!cycle) throw new ApiError(404, "Cycle not found");

  if (cycle.status === "LOCKED") {
    return ok(res, { draw, cycle }, "Already confirmed and cycle locked");
  }

  const beforeDraw = draw.toObject();
  draw.confirmedByAdminId = req.user!.userId as any;
  draw.confirmedAt = new Date();
  await draw.save();

  const beforeCycle = cycle.toObject();
  cycle.status = "LOCKED";
  await cycle.save();

  await writeAudit({
    actorUserId: req.user!.userId,
    action: "DRAW_CONFIRMED",
    entityType: "Draw",
    entityId: draw.id,
    before: beforeDraw,
    after: draw.toObject()
  });

  await writeAudit({
    actorUserId: req.user!.userId,
    action: "CYCLE_LOCKED",
    entityType: "PaymentCycle",
    entityId: cycle.id,
    before: beforeCycle,
    after: cycle.toObject()
  });

  return ok(res, { draw, cycle }, "Draw confirmed and cycle locked");
});

/**
 * PATCH /api/admin/draws/:drawId/update-winner
 * Body: { newWinnerUserId, reason }
 *
 * Safety:
 * - Only allow if draw exists
 * - newWinner must be in eligible list (paid members snapshot)
 * - reason is mandatory
 */
export const updateWinner = asyncHandler(async (req, res) => {
  const { drawId } = req.params;
  const { newWinnerUserId, reason } = req.body as { newWinnerUserId: string; reason: string };

  if (!reason || reason.trim().length < 3) throw new ApiError(400, "Reason is required");

  const draw = await Draw.findById(drawId);
  if (!draw) throw new ApiError(404, "Draw not found");

  const eligible = draw.eligibleUserIds.map(id => String(id));
  if (!eligible.includes(newWinnerUserId)) {
    throw new ApiError(400, "New winner must be from eligible (PAID) member list");
  }

  const before = draw.toObject();
  draw.winnerUserId = newWinnerUserId as any;
  await draw.save();

  await writeAudit({
    actorUserId: req.user!.userId,
    action: "WINNER_UPDATED",
    entityType: "Draw",
    entityId: draw.id,
    before,
    after: draw.toObject(),
    reason
  });

  return ok(res, draw, "Winner updated");
});

/**
 * GET /api/admin/draws?planId=&cycleId=
 */
export const listDraws = asyncHandler(async (req, res) => {
  const { planId, cycleId } = req.query as { planId?: string; cycleId?: string };

  const filter: any = {};
  if (planId) filter.planId = planId;
  if (cycleId) filter.cycleId = cycleId;

  const draws = await Draw.find(filter)
    .populate("winnerUserId", "fullName phone")
    .sort({ drawnAt: -1 });

  return ok(res, draws, "Draws");
});
