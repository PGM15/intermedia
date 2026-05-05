import jwt from "jsonwebtoken";
import AppError from "../utils/appError.js";
import User from "../models/user.model.js";
import catchAsync from "../utils/catchAsync.js";

const protect = catchAsync(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    throw new AppError("No autorizado, token no proporcionado", 401);
  }

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new AppError("Token expirado", 401);
    }

    throw new AppError("Token inválido", 401);
  }

  const user = await User.findById(decoded.id);

  if (!user || user.deleted) {
    throw new AppError("Usuario no encontrado o eliminado", 401);
  }

  req.user = user;

  next();
});

export default protect;
