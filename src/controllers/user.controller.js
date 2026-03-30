import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import { generateAccessToken, generateRefreshToken } from "../utils/token.js";
import { generateVerificationCode } from "../utils/generateVerificationCode.js";
import Company from "../models/company.model.js"

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
  const { code } = req.body || {};
  const user = req.user;

  if (!code) {
    throw new AppError("Debes enviar el código de verificación", 400);
  }

  if (user.status === "active") {
    throw new AppError("El usuario ya está validado", 400);
  }

  if (user.verificationAttempts <= 0) {
    throw new AppError("Has superado el número máximo de intentos", 429);
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

//Controlador para el login de usuarios
export const loginUser = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email, deleted: false });

  if (!user) {
    throw new AppError("Credenciales incorrectas", 401);
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new AppError("Credenciales incorrectas", 401);
  }

  if (user.status !== "active") {
    throw new AppError("Debes validar tu cuenta antes de iniciar sesión", 401);
  }

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save();

  res.status(200).json({
    ok: true,
    message: "Login correcto",
    data: {
      user: {
        id: user._id,
        email: user.email,
        status: user.status,
        role: user.role,
        fullName: user.fullName
      },
      accessToken,
      refreshToken
    }
  });
});

//Controlador para el GET
export const getMe = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate("company")
    .select("-password -refreshToken -verificationCode -verificationAttempts");

  if (!user) {
    throw new AppError("Usuario no encontrado", 404);
  }

  res.status(200).json({
    ok: true,
    data: {
      user
    }
  });
});


export const completeProfile = catchAsync(async (req, res) => {
  const { name, lastName, nif, address } = req.body;

  if(req.user.status !== "active"){
    throw new AppError("Debes validar tu cuenta antes de completar el perfil", 401);
  }
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      name,
      lastName,
      nif,
      address
    },
    {
      new: true,
      runValidators: true
    }
  ).select("-password -refreshToken -verificationCode -verificationAttempts");

  if (!updatedUser) {
    throw new AppError("Usuario no encontrado", 404);
  }

  res.status(200).json({
    ok: true,
    message: "Datos personales actualizados correctamente",
    data: {
      user: updatedUser
    }
  });
});


export const assignCompany = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user || user.deleted) {
    throw new AppError("Usuario no encontrado", 404);
  }

  if (user.status !== "active") {
    throw new AppError("Debes validar tu cuenta antes de asociar una empresa", 401);
  }

  const { isFreelance, name, cif, address } = req.body;

  let company;

  if (isFreelance) {
    if (!user.nif) {
      throw new AppError("Debes completar tu perfil antes de darte de alta como autónomo", 400);
    }

    company = await Company.findOne({ cif: user.nif, deleted: false });

    if (!company) {
      company = await Company.create({
        owner: user._id,
        name: user.fullName || user.email,
        cif: user.nif,
        address: user.address,
        isFreelance: true
      });
    }

    user.company = company._id;
    user.role = "admin";

    await user.save();

    const populatedUser = await User.findById(user._id)
      .populate("company")
      .select("-password -refreshToken -verificationCode -verificationAttempts");

    return res.status(200).json({
      ok: true,
      message: "Empresa de autónomo asignada correctamente",
      data: {
        user: populatedUser
      }
    });
  }

  company = await Company.findOne({ cif, deleted: false });

  if (!company) {
    company = await Company.create({
      owner: user._id,
      name,
      cif,
      address,
      isFreelance: false
    });

    user.company = company._id;
    user.role = "admin";
  } else {
    user.company = company._id;
    user.role = "guest";
  }

  await user.save();

  const populatedUser = await User.findById(user._id)
    .populate("company")
    .select("-password -refreshToken -verificationCode -verificationAttempts");

  res.status(200).json({
    ok: true,
    message: "Empresa asignada correctamente",
    data: {
      user: populatedUser
    }
  });
});


//Controlador para subir el logo de la empresa
export const uploadCompanyLogo = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user || user.deleted) {
    throw new AppError("Usuario no encontrado", 404);
  }

  if (!user.company) {
    throw new AppError("El usuario no tiene ninguna empresa asociada", 400);
  }

  if (!req.file) {
    throw new AppError("Debes subir un archivo de imagen", 400);
  }

  const company = await Company.findById(user.company);

  if (!company || company.deleted) {
    throw new AppError("Empresa no encontrada", 404);
  }

  company.logo = `/uploads/${req.file.filename}`;
  await company.save();

  const populatedUser = await User.findById(user._id)
    .populate("company")
    .select("-password -refreshToken -verificationCode -verificationAttempts");

  res.status(200).json({
    ok: true,
    message: "Logo subido correctamente",
    data: {
      user: populatedUser
    }
  });
});