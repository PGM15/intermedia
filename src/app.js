import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
//import mongoSanitize from "express-mongo-sanitize";
import morgan from "morgan";
import cors from "cors";
import errorMiddleware from "./middleware/error.middleware.js";
import userRoutes from "./routes/user.routes.js";
import clientRoutes from "./routes/client.routes.js";
import projectRoutes from "./routes/project.routes.js"


const app = express();

app.use(express.json());

app.use(helmet());
//app.use(mongoSanitize());

app.use(cors());


app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));



app.get("/api/health", (req, res) => {
  res.status(200).json({
    ok: true,
    message: "API funcionando"
  });
});

app.use("/uploads", express.static("src/uploads"));
app.use("/api/user", userRoutes);
app.use("/api/client", clientRoutes);
console.log(">>> mounting /api/project");
app.use("/api/project", projectRoutes);

app.use(errorMiddleware);

export default app;