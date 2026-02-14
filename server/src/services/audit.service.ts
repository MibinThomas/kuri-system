import { AuditLog } from "../models/AuditLog";
import { Types } from "mongoose";

export async function writeAudit(params: {
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: any;
  after?: any;
  reason?: string;
}) {
  return AuditLog.create({
    actorUserId: new Types.ObjectId(params.actorUserId),
    action: params.action,
    entityType: params.entityType,
    entityId: new Types.ObjectId(params.entityId),
    before: params.before,
    after: params.after,
    reason: params.reason
  });
}
