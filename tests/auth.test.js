import request from "supertest";
import app from "../src/app.js";

describe("Auth flow", () => {
  const email = `test${Date.now()}@test.com`;
  const password = "12345678";
  let accessToken;
  let refreshToken;
  let verificationCode;
  let companyCif;
  const imagePng = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64"
  );

  it("should register user", async () => {
    const res = await request(app)
      .post("/api/user/register")
      .send({ email, password });

    console.log("REGISTER BODY:", res.body);
    expect([200, 201]).toContain(res.statusCode);

    accessToken = res.body.data?.accessToken;
    verificationCode = res.body.data?.verificationCode;
  });

  it("should validate user", async () => {
    const res = await request(app)
      .put("/api/user/validation")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ code: verificationCode });

    expect(res.statusCode).toBe(200);
  });

  it("should login user", async () => {
    const res = await request(app)
      .post("/api/user/login")
      .send({ email, password });

    console.log("LOGIN BODY:", res.body);
    expect(res.statusCode).toBe(200);

    accessToken = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;
  });

  it("should get current user", async () => {
    const res = await request(app)
      .get("/api/user")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
  });

  it("should return 401 for an invalid JWT", async () => {
    const res = await request(app)
      .get("/api/user")
      .set("Authorization", "Bearer invalid.token");

    expect(res.statusCode).toBe(401);
    expect(res.body.status).toBe("fail");
    expect(res.body.message).toBe("Token inválido");
  });

  it("should complete profile and assign company", async () => {
    const profileRes = await request(app)
      .put("/api/user/register")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Auth",
        lastName: "User",
        nif: `Y${Date.now().toString().slice(-8)}`,
        address: {
          street: "Calle Auth",
          city: "Madrid",
          postalCode: "28001",
          country: "España",
        },
      });

    expect(profileRes.statusCode).toBe(200);

    companyCif = `C${Date.now().toString().slice(-8)}`;

    const companyRes = await request(app)
      .patch("/api/user/company")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        isFreelance: false,
        name: "Auth Company SL",
        cif: companyCif,
        address: {
          street: "Calle Empresa",
          city: "Madrid",
          postalCode: "28002",
          country: "España",
        },
      });

    expect(companyRes.statusCode).toBe(200);
  });

  it("should update the authenticated admin company", async () => {
    const companyRes = await request(app)
      .patch("/api/user/company")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        isFreelance: false,
        name: "Auth Company Updated SL",
        cif: companyCif,
        address: {
          street: "Calle Empresa Actualizada",
          city: "Madrid",
          postalCode: "28003",
          country: "España",
        },
      });

    expect(companyRes.statusCode).toBe(200);
    expect(companyRes.body.data.user.company.name).toBe("Auth Company Updated SL");
    expect(companyRes.body.data.user.role).toBe("admin");
  });

  it("should upload company logo to cloud storage", async () => {
    const res = await request(app)
      .patch("/api/user/logo")
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("logo", imagePng, {
        filename: "logo.png",
        contentType: "image/png",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.user.company.logo).toContain(
      "https://cloudinary.test/bildyapp/logos/logo.webp"
    );
  });

  it("should refresh, invite, logout and change password", async () => {
    const refreshRes = await request(app)
      .post("/api/user/refresh")
      .send({ refreshToken });

    expect(refreshRes.statusCode).toBe(200);

    const inviteRes = await request(app)
      .post("/api/user/invite")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        email: `guest${Date.now()}@test.com`,
        password: "12345678",
      });

    expect(inviteRes.statusCode).toBe(201);

    const logoutRes = await request(app)
      .post("/api/user/logout")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ refreshToken });

    expect(logoutRes.statusCode).toBe(200);

    const loginAgainRes = await request(app)
      .post("/api/user/login")
      .send({ email, password });

    const newAccessToken = loginAgainRes.body.data.accessToken;

    const passwordRes = await request(app)
      .put("/api/user/password")
      .set("Authorization", `Bearer ${newAccessToken}`)
      .send({
        currentPassword: password,
        newPassword: "123456789",
      });

    expect(passwordRes.statusCode).toBe(200);
  });

  it("should return health status", async () => {
    const res = await request(app).get("/health");

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.db).toBe("connected");
    expect(res.body).toHaveProperty("uptime");
    expect(res.body).toHaveProperty("timestamp");
  });
});
