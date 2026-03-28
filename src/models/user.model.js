import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true
    },
    name: {
      type: String,
      trim: true,
      default: ""
    },
    lastName: {
      type: String,
      trim: true,
      default: ""
    },
    nif: {
      type: String,
      trim: true,
      uppercase: true,
      default: ""
    },
    role: {
      type: String,
      enum: ["admin", "guest"],
      default: "admin"
    },
    status: {
      type: String,
      enum: ["pending", "active", "disabled"],
      default: "pending"
    },
    verificationCode: {
      type: String,
      default: null
    },
    verificationAttempts: {
      type: Number,
      default: 3
    },
    refreshToken: {
      type: String,
      default: null
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      default: null
    },
    address: {
      street: {
        type: String,
        trim: true,
        default: ""
      },
      city: {
        type: String,
        trim: true,
        default: ""
      },
      postalCode: {
        type: String,
        trim: true,
        default: ""
      },
      country: {
        type: String,
        trim: true,
        default: "España"
      }
    },
    deleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

userSchema.virtual("fullName").get(function () {
  return `${this.name} ${this.lastName}`.trim();
});

userSchema.index({ company: 1 });
userSchema.index({ status: 1 });
userSchema.index({ role: 1 });

const User = mongoose.model("User", userSchema);

export default User;