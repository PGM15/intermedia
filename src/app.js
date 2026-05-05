import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import cors from "cors";
import mongoose from "mongoose";
import errorMiddleware from "./middleware/error.middleware.js";
import userRoutes from "./routes/user.routes.js";
import clientRoutes from "./routes/client.routes.js";
import projectRoutes from "./routes/project.routes.js"
import deliveryNoteRoutes from "./routes/deliverynote.routes.js"
import { swaggerUi, swaggerSpec } from "./config/swagger.js";


const app = express();

app.use(express.json());

app.use(helmet());
app.use((req, res, next) => {
  const sanitize = (value) => {
    if (!value || typeof value !== "object") return;

    for (const key of Object.keys(value)) {
      if (key.startsWith("$") || key.includes(".")) {
        delete value[key];
        continue;
      }

      sanitize(value[key]);
    }
  };

  sanitize(req.body);
  sanitize(req.params);
  sanitize(req.query);
  next();
});
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use(cors());


app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}


/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check del servidor
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Estado del servidor
 *         content:
 *           application/json:
 *             example:
 *               status: ok
 *               db: connected
 *               uptime: 120.5
 *               timestamp: "2026-04-27T18:00:00.000Z"
 */
const healthHandler = (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;

  res.status(200).json({
    status: "ok",
    db: dbConnected ? "connected" : "disconnected",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
};

app.get("/health", healthHandler);
app.get("/api/health", healthHandler);

app.use("/uploads", express.static("src/uploads"));
app.use("/api/user", userRoutes);
app.use("/api/client", clientRoutes);
app.use("/api/project", projectRoutes);
app.use("/api/deliverynote", deliveryNoteRoutes);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(errorMiddleware);

export default app;
