import request from "supertest";
import app from "../src/app.js";
import { createAndLoginUser } from "./helpers/auth-helper.js";

describe("Client endpoints", () => {
  let accessToken;

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
  });

  it("should get clients", async () => {
    const res = await request(app)
      .get("/api/client")
      .set("Authorization", `Bearer ${accessToken}`);

    console.log("GET CLIENTS BODY:", res.body);
    expect(res.statusCode).toBe(200);
  });
});