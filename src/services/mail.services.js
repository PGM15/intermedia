import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth:{
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
})

export default transporter;

export const sendVerificationEmail = async ({ to, code }) => {
  const from = process.env.EMAIL_USER || "BildyApp <no-reply@bildyapp.local>";

  return transporter.sendMail({
    from,
    to,
    subject: "Codigo de verificacion de BildyApp",
    text: `Tu codigo de verificacion es: ${code}`,
    html: `
      <h1>Codigo de verificacion</h1>
      <p>Usa este codigo para activar tu cuenta en BildyApp:</p>
      <p><strong>${code}</strong></p>
    `,
  });
};
