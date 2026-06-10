import { Schema, model, Types, type Document } from 'mongoose';

export interface ProjectDocument extends Document {
  name: string;
  description: string;
  ownerId: Types.ObjectId;
  apiKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<ProjectDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },
    ownerId: {
      type: Types.ObjectId,
      ref: 'User',
      required: true,
    },
    apiKey: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        const output = ret as Record<string, unknown>;
        output.id = output._id?.toString();
        if (
          output.ownerId &&
          typeof output.ownerId !== 'string' &&
          typeof (output.ownerId as { toString?: unknown }).toString === 'function'
        ) {
          output.ownerId = (output.ownerId as { toString: () => string }).toString();
        }
        delete output._id;
        delete output.__v;
      },
    },
  }
);

projectSchema.index({ ownerId: 1 });
projectSchema.index({ ownerId: 1, name: 1 });
projectSchema.index({ apiKey: 1 });

const ProjectModel = model<ProjectDocument>('Project', projectSchema);
export default ProjectModel;
