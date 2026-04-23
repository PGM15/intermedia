import request from "supertest";
import app from "../src/app.js";
import { createAndLoginUser } from "./helpers/auth-helper.js";

describe("Project endpoints", () => {
  let accessToken;
  let clientId;

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
  });
});