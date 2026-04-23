import { Router } from "express";
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
} from "../controllers/project.controller.js";
import validate from "../middleware/validate.middleware.js";
import protect from "../middleware/aut.middleware.js";
import { createProjectSchema, updateProjectSchema } from "../validators/project.validator.js";

const router = Router();

router.use(protect);

/**
 * @swagger
 * /api/project:
 *   post:
 *     summary: Crear proyecto
 *     tags: [Project]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             name: "Reforma oficina"
 *             description: "Proyecto de reforma integral"
 *             client: "CLIENT_ID"
 *     responses:
 *       201:
 *         description: Proyecto creado correctamente
 *       400:
 *         description: Datos inválidos
 *   get:
 *     summary: Listar proyectos
 *     tags: [Project]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de proyectos
 */
router
  .route("/")
  .post(validate(createProjectSchema), createProject)
  .get(getProjects);

/**
 * @swagger
 * /api/project/{id}:
 *   get:
 *     summary: Obtener un proyecto por ID
 *     tags: [Project]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Proyecto encontrado
 *       404:
 *         description: Proyecto no encontrado
 *   patch:
 *     summary: Actualizar proyecto
 *     tags: [Project]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Proyecto actualizado
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Proyecto no encontrado
 *   delete:
 *     summary: Eliminar proyecto
 *     tags: [Project]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Proyecto eliminado
 *       404:
 *         description: Proyecto no encontrado
 */
router
  .route("/:id")
  .get(getProjectById)
  .patch(validate(updateProjectSchema), updateProject)
  .delete(deleteProject);

export default router;