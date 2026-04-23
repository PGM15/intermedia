import request from "supertest";
import app from "../src/app.js";
import { createAndLoginUser } from "./helpers/auth-helper.js";

describe("DeliveryNote endpoints", () => {
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
        name: "Cliente DN",
        cif: `B${Date.now().toString().slice(-8)}`,
        email: "clientedn@test.com",
      });

    clientId = clientRes.body.data?._id;

    const projectRes = await request(app)
      .post("/api/project")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Proyecto DN",
        projectCode: `DN-${Date.now()}`,
        client: clientId,
      });

    projectId = projectRes.body.data?._id;
  }, 20000);

  it("should create delivery note", async () => {
    const res = await request(app)
      .post("/api/deliverynote")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        client: clientId,
        project: projectId,
        format: "material",
        workDate: "2026-04-13",
        material: "Cemento",
        quantity: 10,
        unit: "sacos",
      });

    console.log("CREATE DELIVERYNOTE BODY:", res.body);
    expect(res.statusCode).toBe(201);
  });
});