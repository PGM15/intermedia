import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import { generateAccessToken, generateRefreshToken } from "../utils/token.js";
import { generateVerificationCode } from "../utils/generateVerificationCode.js";

export const registerUser = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  const existingUser = await User.findOne({ email });

  if (existingUser && existingUser.status === "active") {
    throw new AppError("Ya existe un usuario registrado con ese email", 409);
  }

  if (existingUser && existingUser.status === "pending") {
    throw new AppError(
      "Ya existe un usuario pendiente de validación con ese email",
      409
    );
  }

  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  const verificationCode = generateVerificationCode();

  const user = await User.create({
    email,
    password: hashedPassword,
    verificationCode,
    verificationAttempts: 3,
    status: "pending"
  });

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save();

  res.status(201).json({
    ok: true,
    message: "Usuario registrado correctamente",
    data: {
      user: {
        id: user._id,
        email: user.email,
        status: user.status
      },
      accessToken,
      refreshToken,
      verificationCode
    }
  });
});

export const validateUser = catchAsync(async (req, res) => {
  const { code } = req.body;

  const user = req.user;

  if (user.status === "active") {
    throw new AppError("El usuario ya está validado", 400);
  }

  if (user.verificationAttempts <= 0) {
    throw new AppError(
      "Has superado el número máximo de intentos",
      429
    );
  }

  if (user.verificationCode !== code) {
    user.verificationAttempts -= 1;
    await user.save();

    throw new AppError(
      `Código incorrecto. Intentos restantes: ${user.verificationAttempts}`,
      400
    );
  }

  user.status = "active";
  user.verificationCode = null;
  user.verificationAttempts = 0;

  await user.save();

  res.status(200).json({
    ok: true,
    message: "Usuario validado correctamente"
  });
});