import request from "supertest";
import app from "../src/app.js";
import { createAndLoginUser } from "./helpers/auth-helpers.js";

describe("Project endpoints", () => {
  let accessToken;
  let clientId;
  let projectId;

  beforeAll(async () => {
    const auth = await createAndLoginUser();
    accessToken = auth.accessToken;

    const clientRes = await request(app)
      .post("/api/client")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Cliente Proyecto",
        cif: `B${Date.now().toString().slice(-8)}`,
        email: "clienteproyecto@test.com",
      });

    clientId = clientRes.body.data?._id;
  }, 20000);

  it("should create project", async () => {
    const res = await request(app)
      .post("/api/project")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Proyecto Test",
        projectCode: `TEST-${Date.now()}`,
        client: clientId,
      });

    console.log("CREATE PROJECT BODY:", res.body);
    expect(res.statusCode).toBe(201);
    projectId = res.body.data._id;
  });

  it("should list, get and update project", async () => {
    const listRes = await request(app)
      .get(`/api/project?client=${clientId}&active=true`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(listRes.statusCode).toBe(200);

    const getRes = await request(app)
      .get(`/api/project/${projectId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(getRes.statusCode).toBe(200);

    const updateRes = await request(app)
      .put(`/api/project/${projectId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        notes: "Notas actualizadas",
        active: false,
      });

    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.body.data.active).toBe(false);
  });

  it("should archive and restore project", async () => {
    const archiveRes = await request(app)
      .delete(`/api/project/${projectId}?soft=true`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(archiveRes.statusCode).toBe(200);

    const archivedRes = await request(app)
      .get("/api/project/archived")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(archivedRes.statusCode).toBe(200);
    expect(archivedRes.body.data.some((project) => project._id === projectId)).toBe(true);

    const restoreRes = await request(app)
      .patch(`/api/project/${projectId}/restore`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(restoreRes.statusCode).toBe(200);
  });

  it("should delete project permanently", async () => {
    const res = await request(app)
      .delete(`/api/project/${projectId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
  });
});
