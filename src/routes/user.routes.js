import { Router } from "express";
import {
  registerUser,
  validateUser,
  loginUser,
  getMe,
  completeProfile
} from "../controllers/user.controller.js";
import validate from "../middleware/validate.middleware.js";
import protect from "../middleware/aut.middleware.js";
import {
  registerSchema,
  loginSchema,
  completeProfileSchema
} from "../validators/user.validator.js";
import { assignCompany } from "../controllers/user.controller.js";
import { companySchema } from "../validators/user.validator.js";
import { uploadCompanyLogo } from "../controllers/user.controller.js";
import upload from "../middleware/upload.middleware.js"

const router = Router();

router.post("/register", validate(registerSchema), registerUser);
router.put("/validation", protect, validateUser);
router.post("/login", validate(loginSchema), loginUser);
router.get("/", protect, getMe);
router.put("/register", protect, validate(completeProfileSchema), completeProfile);
router.patch("/company", protect, validate(companySchema), assignCompany);
router.patch("/logo", protect, upload.single("logo"), uploadCompanyLogo);

export default router;