import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    cif: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    address: {
      street: {
        type: String,
        trim: true
      },
      city: {
        type: String,
        trim: true
      },
      postalCode: {
        type: String,
        trim: true
      },
      country: {
        type: String,
        trim: true,
        default: "España"
      }
    },
    logo: {
      type: String,
      default: null
    },
    isFreelance: {
      type: Boolean,
      default: false
    },
    deleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

companySchema.index({ cif: 1 });
companySchema.index({ owner: 1 });

const Company = mongoose.model("Company", companySchema);

export default Company;