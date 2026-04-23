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
  deleteUser,
  inviteUser,
  changePassword,
} from "../controllers/user.controller.js";
import validate from "../middleware/validate.middleware.js";
import protect from "../middleware/aut.middleware.js";
import authorize from "../middleware/role.middleware.js";
import {
  registerSchema,
  loginSchema,
  validationSchema,
  completeProfileSchema,
  companySchema,
  refreshSchema,
  logoutSchema,
  inviteUserSchema,
  changePasswordSchema,
} from "../validators/user.validator.js";
import upload from "../middleware/upload.middleware.js";

const router = Router();

/**
 * @swagger
 * /api/user/register:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     tags:
 *       - Auth
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             email: cjb6@test.com
 *             password: "123456"
 *     responses:
 *       201:
 *         description: Usuario registrado correctamente
 *       400:
 *         description: Datos inválidos
 *       409:
 *         description: El usuario ya existe
 */
router.post("/register", validate(registerSchema), registerUser);

/**
 * @swagger
 * /api/user/validation:
 *   put:
 *     summary: Validar usuario con código
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             code: "780234"
 *     responses:
 *       200:
 *         description: Usuario validado correctamente
 *       400:
 *         description: Código inválido
 *       401:
 *         description: No autorizado
 */
router.put("/validation", protect, validate(validationSchema), validateUser);

/**
 * @swagger
 * /api/user/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags:
 *       - Auth
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             email: cjb6@test.com
 *             password: "123456"
 *     responses:
 *       200:
 *         description: Login correcto con tokens
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Credenciales incorrectas
 */
router.post("/login", validate(loginSchema), loginUser);


/**
 * @swagger
 * /api/user/refresh:
 *   post:
 *     summary: Refrescar access token
 *     tags:
 *       - Auth
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             refreshToken: "token"
 *     responses:
 *       200:
 *         description: Nuevo access token generado
 *       401:
 *         description: Refresh token inválido
 */
router.post("/refresh", validate(refreshSchema), refreshSession);


/**
 * @swagger
 * /api/user/logout:
 *   post:
 *     summary: Logout
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             refreshToken: "token"
 *     responses:
 *       200:
 *         description: Logout correcto
 */
router.post("/logout", protect, validate(logoutSchema), logoutUser);


/**
 * @swagger
 * /api/user/password:
 *   put:
 *     summary: Cambiar contraseña
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             currentPassword: "123456"
 *             newPassword: "12345678"
 *     responses:
 *       200:
 *         description: Contraseña actualizada
 */
router.put("/password", protect, validate(changePasswordSchema), changePassword);

/**
 * @swagger
 * /api/user:
 *   get:
 *     summary: Obtener el usuario autenticado
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: Usuario autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: No autorizado
 */
router.get("/", protect, getMe);


/**
 * @swagger
 * /api/user:
 *   delete:
 *     summary: Borrar usuario
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Usuario eliminado
 */
router.delete("/", protect, deleteUser);


/**
 * @swagger
 * /api/user/register:
 *   put:
 *     summary: Completar perfil
 *     tags: [Company]
 *     responses:
 *       200:
 *         description: Perfil actualizado
 */
router.put("/register", protect, validate(completeProfileSchema), completeProfile);



/**
 * @swagger
 * /api/user/company:
 *   patch:
 *     summary: Asignar empresa
 *     tags: [Company]
 *     responses:
 *       200:
 *         description: Empresa asignada
 */
router.patch("/company", protect, validate(companySchema), assignCompany);



/**
 * @swagger
 * /api/user/logo:
 *   patch:
 *     summary: Subir logo
 *     tags: [Company]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               logo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Logo subido
 */
router.patch("/logo", protect, authorize("admin"), upload.single("logo"), uploadCompanyLogo);




/**
 * @swagger
 * /api/user/invite:
 *   post:
 *     summary: Invitar usuario
 *     tags: [Company]
 *     responses:
 *       200:
 *         description: Usuario invitado
 */
router.post("/invite", protect, authorize("admin"), validate(inviteUserSchema), inviteUser);

export default router;