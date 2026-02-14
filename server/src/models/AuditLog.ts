import { Schema, model, Document, Types } from "mongoose";

export interface IAuditLog extends Document {
  actorUserId: Types.ObjectId;
  action: string;
  entityType: string;
  entityId: Types.ObjectId;
  before?: any;
  after?: any;
  reason?: string;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actorUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    action: { type: String, required: true, index: true },
    entityType: { type: String, required: true, index: true },
    entityId: { type: Schema.Types.ObjectId, required: true, index: true },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
    reason: { type: String }
  },
  { timestamps: true }
);

export const AuditLog = model<IAuditLog>("AuditLog", AuditLogSchema);
