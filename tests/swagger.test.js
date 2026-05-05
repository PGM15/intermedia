import { swaggerSpec } from "../src/config/swagger.js";

describe("Swagger documentation", () => {
  it("should document the health endpoint", () => {
    expect(swaggerSpec.paths).toHaveProperty("/health");
  });

  it("should document delivery note update operations", () => {
    expect(swaggerSpec.paths["/api/deliverynote/{id}"]).toHaveProperty("put");
    expect(swaggerSpec.paths["/api/deliverynote/{id}"]).toHaveProperty("patch");
  });
});
