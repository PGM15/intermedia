import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import validate from "../middleware/validate.middleware.js";
import { registerSchema } from "../validators/user.validator.js";
import protect from "../middleware/aut.middleware.js";
import { validateUser } from "../controllers/user.controller.js";

const router = Router();

router.post("/register", validate(registerSchema), registerUser);
router.put("/Validation", protect, validateUser);

export default router;