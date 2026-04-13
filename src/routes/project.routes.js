import { Router } from "express";
console.log(">>> project.routes.js LOADED");
import {
  createProject,
  getProjects,
  getArchivedProjects,
  getProjectById,
  updateProject,
  deleteProject,
  restoreProject,
} from "../controllers/project.controller.js";
import validate from "../middleware/validate.middleware.js";
import protect from "../middleware/aut.middleware.js";
import {
  createProjectSchema,
  updateProjectSchema,
} from "../validators/project.validator.js";

const router = Router();
router.get("/test", (req, res) => {
  res.status(200).json({ ok: true, message: "project routes working" });
});
router.use(protect);

router.get("/archived", getArchivedProjects);
router.patch("/:id/restore", restoreProject);

router
  .route("/")
  .post(validate(createProjectSchema), createProject)
  .get(getProjects);

router
  .route("/:id")
  .get(getProjectById)
  .put(validate(updateProjectSchema), updateProject)
  .delete(deleteProject);

export default router;