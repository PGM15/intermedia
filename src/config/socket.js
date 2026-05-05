import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const configureSocket = (server, app) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PATCH", "DELETE"],
    },
  });

  io.use(async (socket, next) => {
    try {
      const authHeader = socket.handshake.headers.authorization;
      const bearerToken = authHeader?.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;
      const token = socket.handshake.auth?.token || bearerToken;

      if (!token) {
        return next(new Error("Token JWT requerido"));
      }

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const user = await User.findById(decoded.id);

      if (!user || user.deleted || !user.company) {
        return next(new Error("Usuario no autorizado"));
      }

      socket.user = user;
      socket.companyRoom = user.company.toString();
      return next();
    } catch (error) {
      return next(new Error("Token JWT invalido"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(socket.companyRoom);

    socket.on("getWelcome", () => {
      socket.emit("welcome", {
        message: "Conectado correctamente al WebSocket",
        socketId: socket.id,
      });
    });
  });

  app.set("io", io);

  return io;
};
