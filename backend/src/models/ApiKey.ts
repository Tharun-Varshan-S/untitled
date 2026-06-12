import { Schema, model, Types, type Document } from 'mongoose';

export interface ApiKeyDocument extends Document {
  name: string;
  hashedKey: string;
  prefix: string;
  projectId: Types.ObjectId;
  createdBy: Types.ObjectId;
  lastUsedAt?: Date;
  revoked: boolean;
  revokedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const apiKeySchema = new Schema<ApiKeyDocument>(
  {
    name: { type: String, required: true, trim: true },
    hashedKey: { type: String, required: true, unique: true, index: true, select: false },
    prefix: { type: String, required: true, trim: true, index: true },
    projectId: { type: Types.ObjectId, ref: 'Project', required: true, index: true },
    createdBy: { type: Types.ObjectId, ref: 'User', required: true },
    lastUsedAt: { type: Date },
    revoked: { type: Boolean, default: false },
    revokedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        const output = ret as Record<string, unknown>;
        output.id = output._id?.toString();
        delete output._id;
        delete output.__v;
        // never expose hashedKey
        delete output.hashedKey;
      },
    },
  }
);

// Ensure unique name per project
apiKeySchema.index({ projectId: 1, name: 1 }, { unique: true, sparse: true });
apiKeySchema.index({ hashedKey: 1 }, { unique: true });

const ApiKeyModel = model<ApiKeyDocument>('ApiKey', apiKeySchema);
export default ApiKeyModel;
