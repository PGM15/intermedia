import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
import {connectDB} from "./config/db.js";

const PORT = process.env.PORT || 3000;

await connectDB();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH", "DELETE"],
  },
});

io.on("connection", (socket) => {
  console.log("Cliente conectado:", socket.id);

  socket.on("getWelcome", () => {
    console.log("Evento getWelcome recibido");

    socket.emit("welcome", {
      message: "Conectado correctamente al WebSocket",
      socketId: socket.id,
    });

    console.log("Welcome enviado");
  });

  socket.on("disconnect", () => {
    console.log("Cliente desconectado:", socket.id);
  });
});

app.set("io", io);

server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});