import { Router } from "express";
import {
  createClient,
  getClients,
  getArchivedClients,
  getClientById,
  updateClient,
  deleteClient,
  restoreClient,
} from "../controllers/client.controller.js";
import validate from "../middleware/validate.middleware.js";
import protect from "../middleware/aut.middleware.js";
import {
  createClientSchema,
  updateClientSchema,
} from "../validators/client.validator.js";

const router = Router();

router.use(protect);

router.get("/archived", getArchivedClients);
router.patch("/:id/restore", restoreClient);

router
  .route("/")
  .post(validate(createClientSchema), createClient)
  .get(getClients);

router
  .route("/:id")
  .get(getClientById)
  .put(validate(updateClientSchema), updateClient)
  .delete(deleteClient);

export default router;