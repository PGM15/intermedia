import { Router } from "express";
import {
  createDeliveryNote,
  getDeliveryNotes,
  getDeliveryNoteById,
  deleteDeliveryNote,
  signDeliveryNote,
  downloadDeliveryNotePdf,
} from "../controllers/deliverynote.controller.js";
import validate from "../middleware/validate.middleware.js";
import protect from "../middleware/aut.middleware.js";
import upload from "../middleware/upload.middleware.js";
import { createDeliveryNoteSchema } from "../validators/deliverynote.validator.js";

const router = Router();

router.use(protect);

/**
 * @swagger
 * /api/deliverynote/pdf/{id}:
 *   get:
 *     summary: Obtener PDF de un albarán
 *     tags: [DeliveryNote]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del albarán
 *     responses:
 *       200:
 *         description: PDF generado o URL del PDF
 *       404:
 *         description: Albarán no encontrado
 */
router.get("/pdf/:id", downloadDeliveryNotePdf);

/**
 * @swagger
 * /api/deliverynote/{id}/sign:
 *   patch:
 *     summary: Firmar un albarán
 *     tags: [DeliveryNote]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del albarán
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               signature:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Albarán firmado correctamente
 *       400:
 *         description: Error en firma (ya firmado o falta archivo)
 *       404:
 *         description: Albarán no encontrado
 */
router.patch("/:id/sign", upload.single("signature"), signDeliveryNote);

/**
 * @swagger
 * /api/deliverynote:
 *   post:
 *     summary: Crear un albarán
 *     tags: [DeliveryNote]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           examples:
 *             material:
 *               summary: Albarán de material
 *               value:
 *                 client: "CLIENT_ID"
 *                 project: "PROJECT_ID"
 *                 format: material
 *                 description: Entrega de materiales
 *                 workDate: "2026-04-13"
 *                 material: Cemento
 *                 quantity: 25
 *                 unit: sacos
 *             hours:
 *               summary: Albarán de horas
 *               value:
 *                 client: "CLIENT_ID"
 *                 project: "PROJECT_ID"
 *                 format: hours
 *                 description: Trabajo realizado
 *                 workDate: "2026-04-13"
 *                 hours: 8
 *                 workers:
 *                   - name: Juan
 *                     hours: 4
 *                   - name: Pedro
 *                     hours: 4
 *     responses:
 *       201:
 *         description: Albarán creado
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Cliente o proyecto no encontrado
 *   get:
 *     summary: Listar albaranes
 *     tags: [DeliveryNote]
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
 *         name: project
 *         schema:
 *           type: string
 *       - in: query
 *         name: client
 *         schema:
 *           type: string
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [material, hours]
 *       - in: query
 *         name: signed
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           example: "2026-01-01"
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           example: "2026-12-31"
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           example: -workDate
 *     responses:
 *       200:
 *         description: Lista de albaranes
 */
router
  .route("/")
  .post(validate(createDeliveryNoteSchema), createDeliveryNote)
  .get(getDeliveryNotes);

/**
 * @swagger
 * /api/deliverynote/{id}:
 *   get:
 *     summary: Obtener albarán por ID
 *     tags: [DeliveryNote]
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
 *         description: Albarán encontrado
 *       404:
 *         description: No encontrado
 *   delete:
 *     summary: Eliminar albarán
 *     tags: [DeliveryNote]
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
 *         description: Eliminado correctamente
 *       400:
 *         description: No se puede eliminar si está firmado
 *       404:
 *         description: No encontrado
 */
router
  .route("/:id")
  .get(getDeliveryNoteById)
  .delete(deleteDeliveryNote);

export default router;