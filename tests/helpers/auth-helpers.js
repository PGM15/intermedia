import request from "supertest";
import app from "../../src/app.js";

export const createAndLoginUser = async () => {
  const email = `test${Date.now()}@test.com`;
  const password = "123456";

  // register
  await request(app)
    .post("/api/user/register")
    .send({ email, password });

  // si tu app requiere validación obligatoria para login,
  // aquí tendrás que validarlo o mockear esa parte
  const loginRes = await request(app)
    .post("/api/user/login")
    .send({ email, password });

  const accessToken =
    loginRes.body.accessToken || loginRes.body.data?.accessToken;

  const refreshToken =
    loginRes.body.refreshToken || loginRes.body.data?.refreshToken;

  return { email, password, accessToken, refreshToken, loginRes };
};