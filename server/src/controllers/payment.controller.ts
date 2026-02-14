import { asyncHandler } from "../utils/asyncHandler";
import { ok } from "../utils/response";
import { ApiError } from "../utils/ApiError";
import { Payment } from "../models/Payment";
import { PaymentCycle } from "../models/PaymentCycle";
import { Membership } from "../models/Membership";
import { Plan } from "../models/Plan";
import { writeAudit } from "../services/audit.service";

/**
 * MEMBER: POST /api/member/payments
 * Body: { planId, cycleId, method, referenceNo? }
 *
 * Creates/updates a pending payment record for that cycle.
 */
export const submitPayment = asyncHandler(async (req, res) => {
  const userId = req.user!.userId;
  const { planId, cycleId, method, referenceNo } = req.body as {
    planId: string;
    cycleId: string;
    method: "CASH" | "BANK" | "ONLINE";
    referenceNo?: string;
  };

  // Must have active membership (only one plan enforced by DB index)
  const membership = await Membership.findOne({ userId, isActive: true });
  if (!membership) throw new ApiError(403, "You are not enrolled in any plan");
  if (String(membership.planId) !== planId) throw new ApiError(403, "You are not enrolled in this plan");

  const plan = await Plan.findById(planId);
  if (!plan) throw new ApiError(404, "Plan not found");

  const cycle = await PaymentCycle.findById(cycleId);
  if (!cycle) throw new ApiError(404, "Cycle not found");
  if (String(cycle.planId) !== planId) throw new ApiError(400, "Cycle does not belong to this plan");

  if (cycle.status === "LOCKED") throw new ApiError(409, "This month is locked. Payment submission is closed.");

  // Upsert: (planId, cycleId, userId) is unique by index
  let payment = await Payment.findOne({ planId, cycleId, userId });

  if (!payment) {
    payment = await Payment.create({
      planId,
      cycleId,
      userId,
      amount: plan.monthlyAmount,
      method,
      referenceNo,
      status: "PENDING"
    });

    await writeAudit({
      actorUserId: userId,
      action: "PAYMENT_SUBMITTED",
      entityType: "Payment",
      entityId: payment.id,
      after: payment.toObject()
    });

    return ok(res, payment, "Payment submitted (pending approval)");
  }

  // If already approved, block edits
  if (payment.status === "PAID") throw new ApiError(409, "Payment already approved");

  const before = payment.toObject();
  payment.method = method;
  payment.referenceNo = referenceNo;
  payment.amount = plan.monthlyAmount;
  payment.status = "PENDING";
  await payment.save();

  await writeAudit({
    actorUserId: userId,
    action: "PAYMENT_UPDATED",
    entityType: "Payment",
    entityId: payment.id,
    before,
    after: payment.toObject()
  });

  return ok(res, payment, "Payment updated (pending approval)");
});

/**
 * MEMBER: GET /api/member/payments
 * Lists member payments (for their active plan)
 */
export const myPayments = asyncHandler(async (req, res) => {
  const userId = req.user!.userId;

  const membership = await Membership.findOne({ userId, isActive: true });
  if (!membership) return ok(res, [], "No active membership");

  const payments = await Payment.find({ userId, planId: membership.planId }).sort({ createdAt: -1 });
  return ok(res, payments, "My payments");
});

/**
 * ADMIN: GET /api/admin/payments?planId=&cycleId=&status=
 */
export const listPayments = asyncHandler(async (req, res) => {
  const { planId, cycleId, status } = req.query as {
    planId?: string;
    cycleId?: string;
    status?: string;
  };

  const filter: any = {};
  if (planId) filter.planId = planId;
  if (cycleId) filter.cycleId = cycleId;
  if (status) filter.status = status.toUpperCase();

  const payments = await Payment.find(filter)
    .populate("userId", "fullName phone")
    .populate("cycleId", "cycleMonth status")
    .sort({ createdAt: -1 });

  return ok(res, payments, "Payments");
});

/**
 * ADMIN: PATCH /api/admin/payments/:paymentId/approve
 */
export const approvePayment = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;

  const payment = await Payment.findById(paymentId);
  if (!payment) throw new ApiError(404, "Payment not found");

  const cycle = await PaymentCycle.findById(payment.cycleId);
  if (!cycle) throw new ApiError(404, "Cycle not found");
  if (cycle.status === "LOCKED") throw new ApiError(409, "Cycle is locked. Cannot approve payment.");

  if (payment.status === "PAID") return ok(res, payment, "Already approved");

  const before = payment.toObject();
  payment.status = "PAID";
  payment.paidAt = new Date();
  await payment.save();

  await writeAudit({
    actorUserId: req.user!.userId,
    action: "PAYMENT_APPROVED",
    entityType: "Payment",
    entityId: payment.id,
    before,
    after: payment.toObject()
  });

  return ok(res, payment, "Payment approved");
});

/**
 * ADMIN: PATCH /api/admin/payments/:paymentId/reject
 * Body: { reason }
 */
export const rejectPayment = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;
  const { reason } = req.body as { reason: string };

  if (!reason || reason.trim().length < 3) throw new ApiError(400, "Reason is required");

  const payment = await Payment.findById(paymentId);
  if (!payment) throw new ApiError(404, "Payment not found");

  if (payment.status === "PAID") throw new ApiError(409, "Cannot reject an approved payment");

  const before = payment.toObject();
  payment.status = "REJECTED";
  await payment.save();

  await writeAudit({
    actorUserId: req.user!.userId,
    action: "PAYMENT_REJECTED",
    entityType: "Payment",
    entityId: payment.id,
    before,
    after: payment.toObject(),
    reason
  });

  return ok(res, payment, "Payment rejected");
});
