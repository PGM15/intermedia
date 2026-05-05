import { sendVerificationEmail } from "../src/services/mail.services.js";

describe("Mail service", () => {
  it("should build a verification email without external SMTP in test", async () => {
    const result = await sendVerificationEmail({
      to: "user@test.com",
      code: "123456",
    });

    expect(result.envelope.to).toContain("user@test.com");
    expect(result.message.toString()).toContain("123456");
  });
});
