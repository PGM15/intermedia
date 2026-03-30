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

const router = Router();

router.post("/register", validate(registerSchema), registerUser);
router.put("/validation", protect, validateUser);
router.post("/login", validate(loginSchema), loginUser);
router.get("/", protect, getMe);
router.put("/register", protect, validate(completeProfileSchema), completeProfile);

export default router;