import EventEmitter from "node:events";

const notificationEmitter = new EventEmitter();

notificationEmitter.on("user.registered", (user) => {
  console.log(`[EVENT] Usuario registrado: ${user.email}`);
});

notificationEmitter.on("user.validated", (user) => {
  console.log(`[EVENT] Usuario validado: ${user.email}`);
});

notificationEmitter.on("user.logged_in", (user) => {
  console.log(`[EVENT] Login correcto: ${user.email}`);
});

notificationEmitter.on("user:deleted", (user) => {
  console.log(`[EVENT] Usuario eliminado: ${user.email}`);
});

notificationEmitter.on("user:invited", (user) => {
  console.log(`[EVENT] Usuario invitado: ${user.email}`);
});


export default notificationEmitter;