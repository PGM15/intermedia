const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const status = err.status || "error";

  res.status(statusCode).json({
    ok: false,
    status,
    message: err.message || "Error interno del servidor"
  });
};

export default errorMiddleware;