import mongoose, { Schema, model, type Document } from 'mongoose';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface UserDocument extends Document {
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [emailRegex, 'Email must be valid'],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
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
        delete output.passwordHash;
      },
    },
    toObject: {
      virtuals: true,
      transform: (_doc, ret) => {
        const output = ret as Record<string, unknown>;
        output.id = output._id?.toString();
        delete output._id;
        delete output.__v;
        delete output.passwordHash;
      },
    },
  }
);

userSchema.index({ email: 1 }, { unique: true });

const UserModel = model<UserDocument>('User', userSchema);
export default UserModel;
