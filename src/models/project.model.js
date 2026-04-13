import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    street: String,
    number: String,
    postal: String,
    city: String,
    province: String,
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    projectCode: {
      type: String,
      required: true,
      trim: true,
    },
    address: addressSchema,
    email: String,
    notes: String,
    active: {
      type: Boolean,
      default: true,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// 🔥 clave
projectSchema.index({ projectCode: 1, company: 1 }, { unique: true });

export default mongoose.model("Project", projectSchema);