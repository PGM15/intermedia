import request from "supertest";
import app from "../../src/app.js";

export const createAndLoginUser = async () => {
  const email = `test${Date.now()}@test.com`;
  const password = "123456";

  const registerRes = await request(app)
    .post("/api/user/register")
    .send({ email, password });

  const initialAccessToken = registerRes.body.data?.accessToken;
  const verificationCode = registerRes.body.data?.verificationCode;

  await request(app)
    .put("/api/user/validation")
    .set("Authorization", `Bearer ${initialAccessToken}`)
    .send({ code: verificationCode });

  await request(app)
    .put("/api/user/register")
    .set("Authorization", `Bearer ${initialAccessToken}`)
    .send({
      name: "Usuario",
      lastName: "Test",
      nif: `Z${Date.now().toString().slice(-8)}`,
      address: {
        street: "Calle Test",
        city: "Madrid",
        postalCode: "28001",
        country: "España",
      },
    });

  await request(app)
    .patch("/api/user/company")
    .set("Authorization", `Bearer ${initialAccessToken}`)
    .send({
      isFreelance: false,
      name: "Empresa Test",
      cif: `B${Date.now().toString().slice(-8)}`,
      address: {
        street: "Gran Via",
        city: "Madrid",
        postalCode: "28013",
        country: "España",
      },
    });

  const loginRes = await request(app)
    .post("/api/user/login")
    .send({ email, password });

  const accessToken =
    loginRes.body.accessToken || loginRes.body.data?.accessToken;

  const refreshToken =
    loginRes.body.refreshToken || loginRes.body.data?.refreshToken;

  return { email, password, accessToken, refreshToken, loginRes };
};
