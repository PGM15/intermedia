import http from "http";
import request from "supertest";
import { io as ClientSocket } from "socket.io-client";
import app from "../src/app.js";
import { configureSocket } from "../src/config/socket.js";
import { createAndLoginUser } from "./helpers/auth-helpers.js";

const waitForEvent = (socket, event, timeout = 1500) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timeout esperando evento ${event}`)),
      timeout
    );

    socket.once(event, (payload) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });

const waitForNoEvent = (socket, event, timeout = 300) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, timeout);

    socket.once(event, () => {
      clearTimeout(timer);
      reject(new Error(`Evento inesperado recibido: ${event}`));
    });
  });

const waitForConnect = (socket) =>
  new Promise((resolve, reject) => {
    socket.once("connect", resolve);
    socket.once("connect_error", reject);
  });

const waitForConnectError = (socket) =>
  new Promise((resolve) => {
    socket.once("connect_error", resolve);
  });

describe("Socket.IO realtime events", () => {
  let server;
  let io;
  let baseUrl;
  let authA;
  let authB;
  let socketA;
  let socketB;
  let clientId;
  let projectId;
  let deliveryNoteId;

  const signaturePng = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64"
  );

  beforeAll(async () => {
    server = http.createServer(app);
    io = configureSocket(server, app);

    await new Promise((resolve) => {
      server.listen(0, "127.0.0.1", resolve);
    });

    const { port } = server.address();
    baseUrl = `http://127.0.0.1:${port}`;

    authA = await createAndLoginUser();
    authB = await createAndLoginUser();
  });

  afterAll(async () => {
    socketA?.disconnect();
    socketB?.disconnect();

    await new Promise((resolve) => io.close(resolve));
    await new Promise((resolve) => server.close(resolve));
  });

  it("should reject unauthenticated sockets", async () => {
    const socket = ClientSocket(baseUrl, {
      transports: ["websocket"],
      reconnection: false,
      forceNew: true,
    });

    const error = await waitForConnectError(socket);
    expect(error.message).toBe("Token JWT requerido");

    socket.disconnect();
  });

  it("should authenticate sockets and receive welcome", async () => {
    socketA = ClientSocket(baseUrl, {
      transports: ["websocket"],
      reconnection: false,
      forceNew: true,
      auth: { token: authA.accessToken },
    });

    socketB = ClientSocket(baseUrl, {
      transports: ["websocket"],
      reconnection: false,
      forceNew: true,
      auth: { token: authB.accessToken },
    });

    await Promise.all([waitForConnect(socketA), waitForConnect(socketB)]);

    const welcomePromise = waitForEvent(socketA, "welcome");
    socketA.emit("getWelcome");

    const payload = await welcomePromise;
    expect(payload.message).toBe("Conectado correctamente al WebSocket");
  });

  it("should emit client:new only to sockets in the same company room", async () => {
    const sameCompanyEvent = waitForEvent(socketA, "client:new");
    const otherCompanyNoEvent = waitForNoEvent(socketB, "client:new");

    const res = await request(app)
      .post("/api/client")
      .set("Authorization", `Bearer ${authA.accessToken}`)
      .send({
        name: "Cliente Socket",
        cif: `S${Date.now().toString().slice(-8)}`,
        email: "socket-client@test.com",
      });

    expect(res.statusCode).toBe(201);
    clientId = res.body.data._id;

    const payload = await sameCompanyEvent;
    await otherCompanyNoEvent;

    expect(payload.client._id).toBe(clientId);
  });

  it("should emit project:new only to sockets in the same company room", async () => {
    const sameCompanyEvent = waitForEvent(socketA, "project:new");
    const otherCompanyNoEvent = waitForNoEvent(socketB, "project:new");

    const res = await request(app)
      .post("/api/project")
      .set("Authorization", `Bearer ${authA.accessToken}`)
      .send({
        name: "Proyecto Socket",
        projectCode: `SOCKET-${Date.now()}`,
        client: clientId,
      });

    expect(res.statusCode).toBe(201);
    projectId = res.body.data._id;

    const payload = await sameCompanyEvent;
    await otherCompanyNoEvent;

    expect(payload.project._id).toBe(projectId);
  });

  it("should emit deliverynote:new only to sockets in the same company room", async () => {
    const sameCompanyEvent = waitForEvent(socketA, "deliverynote:new");
    const otherCompanyNoEvent = waitForNoEvent(socketB, "deliverynote:new");

    const res = await request(app)
      .post("/api/deliverynote")
      .set("Authorization", `Bearer ${authA.accessToken}`)
      .send({
        client: clientId,
        project: projectId,
        format: "material",
        workDate: "2026-04-15",
        material: "Arena",
        quantity: 12,
        unit: "sacos",
      });

    expect(res.statusCode).toBe(201);
    deliveryNoteId = res.body.data._id;

    const payload = await sameCompanyEvent;
    await otherCompanyNoEvent;

    expect(payload.deliveryNote._id).toBe(deliveryNoteId);
  });

  it("should emit deliverynote:signed only to sockets in the same company room", async () => {
    const sameCompanyEvent = waitForEvent(socketA, "deliverynote:signed");
    const otherCompanyNoEvent = waitForNoEvent(socketB, "deliverynote:signed");

    const res = await request(app)
      .patch(`/api/deliverynote/${deliveryNoteId}/sign`)
      .set("Authorization", `Bearer ${authA.accessToken}`)
      .attach("signature", signaturePng, {
        filename: "signature.png",
        contentType: "image/png",
      });

    expect(res.statusCode).toBe(200);

    const payload = await sameCompanyEvent;
    await otherCompanyNoEvent;

    expect(payload.deliveryNote._id).toBe(deliveryNoteId);
    expect(payload.deliveryNote.signed).toBe(true);
  });
});
