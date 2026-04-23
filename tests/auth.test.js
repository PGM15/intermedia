import request from "supertest";
import app from "../src/app.js";

describe("Auth flow", () => {
  const email = `test${Date.now()}@test.com`;
  const password = "123456";

  it("should register user", async () => {
    const res = await request(app)
      .post("/api/user/register")
      .send({ email, password });

    console.log("REGISTER BODY:", res.body);
    expect([200, 201]).toContain(res.statusCode);
  });

  it("should login user", async () => {
    const res = await request(app)
      .post("/api/user/login")
      .send({ email, password });

    console.log("LOGIN BODY:", res.body);
    expect(res.statusCode).toBe(200);
  });
});