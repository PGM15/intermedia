import request from "supertest";
import app from "../src/app.js";
import { createAndLoginUser } from "./helpers/auth-helpers.js";

describe("Client endpoints", () => {
  let accessToken;
  let clientId;

  beforeAll(async () => {
    const auth = await createAndLoginUser();
    accessToken = auth.accessToken;
  }, 20000);

  it("should create client", async () => {
    const res = await request(app)
      .post("/api/client")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Cliente Test",
        cif: `B${Date.now().toString().slice(-8)}`,
        email: "cliente@test.com",
      });

    console.log("CREATE CLIENT BODY:", res.body);
    expect(res.statusCode).toBe(201);
    clientId = res.body.data._id;
  });

  it("should get clients", async () => {
    const res = await request(app)
      .get("/api/client")
      .set("Authorization", `Bearer ${accessToken}`);

    console.log("GET CLIENTS BODY:", res.body);
    expect(res.statusCode).toBe(200);
  });

  it("should get and update client", async () => {
    const getRes = await request(app)
      .get(`/api/client/${clientId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(getRes.statusCode).toBe(200);

    const updateRes = await request(app)
      .put(`/api/client/${clientId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Cliente Test Actualizado",
        phone: "600000000",
      });

    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.body.data.name).toBe("Cliente Test Actualizado");
  });

  it("should archive and restore client", async () => {
    const archiveRes = await request(app)
      .delete(`/api/client/${clientId}?soft=true`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(archiveRes.statusCode).toBe(200);

    const archivedRes = await request(app)
      .get("/api/client/archived")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(archivedRes.statusCode).toBe(200);
    expect(archivedRes.body.data.some((client) => client._id === clientId)).toBe(true);

    const restoreRes = await request(app)
      .patch(`/api/client/${clientId}/restore`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(restoreRes.statusCode).toBe(200);
  });

  it("should delete client permanently", async () => {
    const res = await request(app)
      .delete(`/api/client/${clientId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
  });
});
