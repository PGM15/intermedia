import { sendSlackError } from "../services/slack.service.js";

const errorMiddleware = async (err, req, res, next) => {
  const isJwtError =
    err.name === "JsonWebTokenError" || err.name === "TokenExpiredError";
  const statusCode = err.statusCode || (isJwtError ? 401 : 500);
  const status = err.status || (statusCode >= 500 ? "error" : "fail");
  const message = isJwtError
    ? err.name === "TokenExpiredError"
      ? "Token expirado"
      : "Token inválido"
    : err.message || "Error interno del servidor";

  if (statusCode >= 500) {
    await sendSlackError({ err, req });
  }

  res.status(statusCode).json({
    ok: false,
    status,
    message
  });
};

export default errorMiddleware;
