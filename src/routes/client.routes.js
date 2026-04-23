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

/**
 * @swagger
 * /api/client/archived:
 *   get:
 *     summary: Listar clientes archivados
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de clientes archivados
 */
router.get("/archived", getArchivedClients);

/**
 * @swagger
 * /api/client/{id}/restore:
 *   patch:
 *     summary: Restaurar un cliente archivado
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del cliente
 *     responses:
 *       200:
 *         description: Cliente restaurado correctamente
 *       404:
 *         description: Cliente archivado no encontrado
 */
router.patch("/:id/restore", restoreClient);

/**
 * @swagger
 * /api/client:
 *   post:
 *     summary: Crear cliente
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             name: Construcciones Garcia SL
 *             cif: B12345678
 *             email: cliente@garcia.com
 *             phone: "600123123"
 *             address:
 *               street: Calle Mayor
 *               number: "12"
 *               postal: "28001"
 *               city: Madrid
 *               province: Madrid
 *     responses:
 *       201:
 *         description: Cliente creado correctamente
 *       400:
 *         description: Datos inválidos
 *       409:
 *         description: Ya existe un cliente con ese CIF en la compañía
 *   get:
 *     summary: Listar clientes
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *           example: garcia
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           example: -createdAt
 *     responses:
 *       200:
 *         description: Lista de clientes
 */
router
  .route("/")
  .post(validate(createClientSchema), createClient)
  .get(getClients);

/**
 * @swagger
 * /api/client/{id}:
 *   get:
 *     summary: Obtener un cliente por ID
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del cliente
 *     responses:
 *       200:
 *         description: Cliente encontrado
 *       404:
 *         description: Cliente no encontrado
 *   put:
 *     summary: Actualizar cliente
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del cliente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             name: Construcciones Garcia Renovadas SL
 *             phone: "611222333"
 *     responses:
 *       200:
 *         description: Cliente actualizado correctamente
 *       404:
 *         description: Cliente no encontrado
 *       409:
 *         description: Ya existe otro cliente con ese CIF
 *   delete:
 *     summary: Borrar o archivar cliente
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del cliente
 *       - in: query
 *         name: soft
 *         schema:
 *           type: boolean
 *           example: true
 *         description: Si es true, hace soft delete
 *     responses:
 *       200:
 *         description: Cliente archivado o eliminado correctamente
 *       404:
 *         description: Cliente no encontrado
 */
router
  .route("/:id")
  .get(getClientById)
  .put(validate(updateClientSchema), updateClient)
  .delete(deleteClient);

export default router;