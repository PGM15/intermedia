import { Router } from "express";
import {
  registerUser,
  validateUser,
  loginUser,
  refreshSession,
  logoutUser,
  getMe,
  completeProfile,
  assignCompany,
  uploadCompanyLogo,
} from "../controllers/user.controller.js";
import validate from "../middleware/validate.middleware.js";
import protect from "../middleware/aut.middleware.js";
import authorize from "../middleware/role.middleware.js";
import {
  registerSchema,
  loginSchema,
  completeProfileSchema,
  companySchema,
  refreshSchema,
  logoutSchema,
} from "../validators/user.validator.js";
import upload from "../middleware/upload.middleware.js";

const router = Router();

router.post("/register", validate(registerSchema), registerUser);
router.put("/validation", protect, validateUser);
router.post("/login", validate(loginSchema), loginUser);
router.post("/refresh", validate(refreshSchema), refreshSession);
router.post("/logout", protect, validate(logoutSchema), logoutUser);
router.get("/", protect, getMe);
router.put("/register", protect, validate(completeProfileSchema), completeProfile);
router.patch("/company", protect, validate(companySchema), assignCompany);
router.patch("/logo", protect, authorize("admin"), upload.single("logo"), uploadCompanyLogo);

export default router;