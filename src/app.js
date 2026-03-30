import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import cors from "cors";
import errorMiddleware from "./middleware/error.middleware.js";
import userRoutes from "./routes/user.routes.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  message: {
    ok: false,
    message: "Demasiadas peticiones, inténtalo más tarde"
  }
});

app.use(limiter);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    ok: true,
    message: "API funcionando"
  });
});

app.use("/uploads", express.static("src/uploads"));
app.use("/api/user", userRoutes);

app.use(errorMiddleware);

export default app;