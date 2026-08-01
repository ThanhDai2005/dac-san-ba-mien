import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    hashedPassword: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    avatarUrl: {
      type: String,
    },
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

userSchema.index({ roleId: 1, status: 1, deleted: 1 });

const User = mongoose.model("User", userSchema, "users");

export default User;
