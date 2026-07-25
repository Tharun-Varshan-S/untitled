import { Schema, model, Types, type Document } from 'mongoose';

export interface WorkspaceDocument extends Document {
  name: string;
  slug: string;
  ownerId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const workspaceSchema = new Schema<WorkspaceDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    ownerId: {
      type: Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
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
      },
    },
  }
);

workspaceSchema.index({ ownerId: 1 });
workspaceSchema.index({ ownerId: 1, name: 1 }, { unique: true });

const WorkspaceModel = model<WorkspaceDocument>('Workspace', workspaceSchema);
export default WorkspaceModel;
