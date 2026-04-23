import mongoose from "mongoose";

const workerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    hours: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const deliveryNoteSchema = new mongoose.Schema(
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
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    format: {
      type: String,
      enum: ["material", "hours"],
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    workDate: {
      type: Date,
      required: true,
    },

    material: {
      type: String,
      trim: true,
    },
    quantity: {
      type: Number,
      min: 0,
    },
    unit: {
      type: String,
      trim: true,
    },

    hours: {
      type: Number,
      min: 0,
    },
    workers: [workerSchema],

    signed: {
      type: Boolean,
      default: false,
    },
    signedAt: Date,
    signatureUrl: String,
    pdfUrl: String,

    deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("DeliveryNote", deliveryNoteSchema);