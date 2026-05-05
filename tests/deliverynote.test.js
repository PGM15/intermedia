import request from "supertest";
import app from "../src/app.js";
import { createAndLoginUser } from "./helpers/auth-helpers.js";

describe("DeliveryNote endpoints", () => {
  let accessToken;
  let clientId;
  let projectId;
  let deliveryNoteId;
  let signedDeliveryNoteId;

  const signaturePng = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64"
  );

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
    deliveryNoteId = res.body.data._id;
  });

  it("should list and download delivery note pdf", async () => {
    const listRes = await request(app)
      .get("/api/deliverynote?format=material")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(listRes.statusCode).toBe(200);

    const pdfRes = await request(app)
      .get(`/api/deliverynote/pdf/${deliveryNoteId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(pdfRes.statusCode).toBe(200);
    expect(pdfRes.headers["content-type"]).toContain("application/pdf");
  });

  it("should update an unsigned delivery note", async () => {
    const updateRes = await request(app)
      .patch(`/api/deliverynote/${deliveryNoteId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        description: "Material revisado",
        quantity: 12,
      });

    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.body.data.description).toBe("Material revisado");
    expect(updateRes.body.data.quantity).toBe(12);
  });

  it("should get and delete delivery note", async () => {
    const getRes = await request(app)
      .get(`/api/deliverynote/${deliveryNoteId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(getRes.statusCode).toBe(200);

    const deleteRes = await request(app)
      .delete(`/api/deliverynote/${deliveryNoteId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(deleteRes.statusCode).toBe(200);
  });

  it("should sign delivery note, upload signature/pdf and prevent deletion", async () => {
    const createRes = await request(app)
      .post("/api/deliverynote")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        client: clientId,
        project: projectId,
        format: "hours",
        workDate: "2026-04-14",
        hours: 8,
        workers: [{ name: "Ana", hours: 8 }],
      });

    expect(createRes.statusCode).toBe(201);
    signedDeliveryNoteId = createRes.body.data._id;

    const signRes = await request(app)
      .patch(`/api/deliverynote/${signedDeliveryNoteId}/sign`)
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("signature", signaturePng, {
        filename: "signature.png",
        contentType: "image/png",
      });

    expect(signRes.statusCode).toBe(200);
    expect(signRes.body.data.signed).toBe(true);
    expect(signRes.body.data.signatureUrl).toContain("https://cloudinary.test/");
    expect(signRes.body.data.pdfUrl).toContain("https://cloudinary.test/");

    const pdfRes = await request(app)
      .get(`/api/deliverynote/pdf/${signedDeliveryNoteId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(pdfRes.statusCode).toBe(302);
    expect(pdfRes.headers.location).toBe(signRes.body.data.pdfUrl);

    const updateRes = await request(app)
      .patch(`/api/deliverynote/${signedDeliveryNoteId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ description: "No debería cambiar" });

    expect(updateRes.statusCode).toBe(400);

    const deleteRes = await request(app)
      .delete(`/api/deliverynote/${signedDeliveryNoteId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(deleteRes.statusCode).toBe(400);
  });
});
