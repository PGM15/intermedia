import "dotenv/config";
import http from "http";
import mongoose from "mongoose";
import app from "./app.js";
import {connectDB} from "./config/db.js";
import { configureSocket } from "./config/socket.js";

const PORT = process.env.PORT || 3000;

await connectDB();

const server = http.createServer(app);

const io = configureSocket(server, app);

server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

const shutdown = async (signal) => {
  console.log(`${signal} recibido. Cerrando servidor...`);

  io.close();

  server.close(async () => {
    await mongoose.connection.close();
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
