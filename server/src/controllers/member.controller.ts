import { asyncHandler } from "../utils/asyncHandler";
import { ok } from "../utils/response";
import { ApiError } from "../utils/ApiError";
import { User } from "../models/User";
import { Membership } from "../models/Membership";
import { Plan } from "../models/Plan";
import { writeAudit } from "../services/audit.service";

/**
 * GET /api/admin/users?status=PENDING|ACTIVE|BLOCKED
 */
export const listUsers = asyncHandler(async (req, res) => {
  const status = (req.query.status as string | undefined)?.toUpperCase();
  const filter: any = {};
  if (status) filter.status = status;

  const users = await User.find(filter).select("-passwordHash").sort({ createdAt: -1 });
  return ok(res, users, "Users");
});

/**
 * PATCH /api/admin/users/:userId/approve
 * Approves a MEMBER account (PENDING -> ACTIVE)
 */
export const approveUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  const before = user.toObject();
  user.status = "ACTIVE";
  await user.save();

  await writeAudit({
    actorUserId: req.user!.userId,
    action: "USER_APPROVED",
    entityType: "User",
    entityId: user.id,
    before,
    after: user.toObject()
  });

  return ok(res, { id: user.id, status: user.status }, "User approved");
});

/**
 * POST /api/admin/plans/:planId/members
 * Body: { userId: string }
 *
 * Rules:
 * - user must be ACTIVE
 * - user can have ONLY ONE active membership at a time
 * - auto-assign memberNumber (1..maxMembers)
 */
export const addMemberToPlan = asyncHandler(async (req, res) => {
  const { planId } = req.params;
  const { userId } = req.body as { userId: string };

  const plan = await Plan.findById(planId);
  if (!plan) throw new ApiError(404, "Plan not found");

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");
  if (user.status !== "ACTIVE") throw new ApiError(400, "User must be ACTIVE before joining a plan");

  // Enforce: only one active plan at a time
  const existingActive = await Membership.findOne({ userId, isActive: true });
  if (existingActive) {
    throw new ApiError(409, "User already has an active membership in another plan");
  }

  // Capacity check
  const activeCount = await Membership.countDocuments({ planId, isActive: true });
  if (activeCount >= plan.maxMembers) throw new ApiError(409, "Plan is full");

  // Auto-assign memberNumber
  // Find max memberNumber in this plan
  const last = await Membership.findOne({ planId }).sort({ memberNumber: -1 }).select("memberNumber");
  const nextNumber = (last?.memberNumber ?? 0) + 1;

  if (nextNumber > plan.maxMembers) throw new ApiError(409, "No member slots available");

  const membership = await Membership.create({
    userId,
    planId,
    memberNumber: nextNumber,
    isActive: true
  });

  await writeAudit({
    actorUserId: req.user!.userId,
    action: "MEMBERSHIP_CREATED",
    entityType: "Membership",
    entityId: membership.id,
    after: membership.toObject()
  });

  return ok(res, membership, "Member added to plan");
});

/**
 * GET /api/admin/plans/:planId/members
 */
export const listPlanMembers = asyncHandler(async (req, res) => {
  const { planId } = req.params;

  const members = await Membership.find({ planId, isActive: true })
    .populate("userId", "fullName phone status role")
    .sort({ memberNumber: 1 });

  return ok(res, members, "Plan members");
});
