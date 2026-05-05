import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import AppError from "../utils/appError.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/token.js";
import { generateVerificationCode } from "../utils/generateVerificationCode.js";
import Company from "../models/company.model.js";
import notificationEmitter from "../services/notification.service.js";
import { sendVerificationEmail } from "../services/mail.services.js";
import sharp from "sharp";
import { uploadImageBuffer } from "../services/storage.service.js";



export const registerUser = async (req, res) => {
  const { email, password } = req.body;

  const existingUser = await User.findOne({ email });

  if (existingUser && existingUser.status === "active") {
    throw AppError.conflict("Ya existe un usuario registrado con ese email");
  }

  if (existingUser && existingUser.status === "pending") {
    throw AppError.conflict(
      "Ya existe un usuario pendiente de validación con ese email"
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
    status: "pending",
  });

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save();

  await sendVerificationEmail({
    to: user.email,
    code: verificationCode,
  });

  notificationEmitter.emit("user.registered", user);

  res.status(201).json({
    ok: true,
    message: "Usuario registrado correctamente",
    data: {
      user: {
        id: user._id,
        email: user.email,
        status: user.status,
      },
      accessToken,
      refreshToken,
      verificationCode,
    },
  });
};

export const validateUser = async (req, res) => {
  const { code } = req.body || {};
  const user = req.user;

  if (!code) {
    throw AppError.badRequest("Debes enviar el código de verificación");
  }

  if (user.status === "active") {
    throw AppError.badRequest("El usuario ya está validado");
  }

  if (user.verificationAttempts <= 0) {
    throw AppError.tooManyRequests("Has superado el número máximo de intentos");
  }

  if (user.verificationCode !== code) {
    user.verificationAttempts -= 1;
    await user.save();

    throw AppError.badRequest(
      `Código incorrecto. Intentos restantes: ${user.verificationAttempts}`
    );
  }

  user.status = "active";
  user.verificationCode = null;
  user.verificationAttempts = 0;
  await user.save();

  notificationEmitter.emit("user.validated", user);

  res.status(200).json({
    ok: true,
    message: "Usuario validado correctamente",
  });
};

// Controlador para el login de usuarios
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email, deleted: false });

  if (!user) {
    throw AppError.unauthorized("Credenciales incorrectas");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw AppError.unauthorized("Credenciales incorrectas");
  }

  if (user.status !== "active") {
    throw AppError.unauthorized("Debes validar tu cuenta antes de iniciar sesión");
  }

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save();

  notificationEmitter.emit("user.logged_in", user);

  res.status(200).json({
    ok: true,
    message: "Login correcto",
    data: {
      user: {
        id: user._id,
        email: user.email,
        status: user.status,
        role: user.role,
        fullName: user.fullName,
      },
      accessToken,
      refreshToken,
    },
  });
};

// Controlador para refrescar sesión
export const refreshSession = async (req, res) => {
  const { refreshToken } = req.body;

  const decoded = verifyRefreshToken(refreshToken);

  const user = await User.findById(decoded.id);

  if (!user || user.deleted) {
    throw AppError.unauthorized("Usuario no encontrado");
  }

  if (!user.refreshToken || user.refreshToken !== refreshToken) {
    throw AppError.unauthorized("Refresh token inválido");
  }

  const newAccessToken = generateAccessToken(user._id);

  res.status(200).json({
    ok: true,
    message: "Token renovado correctamente",
    data: {
      accessToken: newAccessToken,
    },
  });
};

// Controlador para cerrar sesión
export const logoutUser = async (req, res) => {
  const { refreshToken } = req.body;

  const user = await User.findById(req.user._id);

  if (!user || user.deleted) {
    throw AppError.notFound("Usuario no encontrado");
  }

  if (!user.refreshToken || user.refreshToken !== refreshToken) {
    throw AppError.unauthorized("Refresh token inválido");
  }

  user.refreshToken = null;
  await user.save();

  res.status(200).json({
    ok: true,
    message: "Logout correcto",
  });
};

// Controlador para el GET
export const getMe = async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate("company")
    .select("-password -refreshToken -verificationCode -verificationAttempts");

  if (!user) {
    throw AppError.notFound("Usuario no encontrado");
  }

  res.status(200).json({
    ok: true,
    data: { user },
  });
};

export const completeProfile = async (req, res) => {
  const { name, lastName, nif, address } = req.body;

  if (req.user.status !== "active") {
    throw AppError.unauthorized(
      "Debes validar tu cuenta antes de completar el perfil"
    );
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { name, lastName, nif, address },
    { new: true, runValidators: true }
  ).select("-password -refreshToken -verificationCode -verificationAttempts");

  if (!updatedUser) {
    throw AppError.notFound("Usuario no encontrado");
  }

  res.status(200).json({
    ok: true,
    message: "Datos personales actualizados correctamente",
    data: { user: updatedUser },
  });
};

export const assignCompany = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user || user.deleted) {
    throw AppError.notFound("Usuario no encontrado");
  }

  if (user.status !== "active") {
    throw AppError.unauthorized(
      "Debes validar tu cuenta antes de asociar una empresa"
    );
  }

  const { isFreelance, name, cif, address } = req.body;
  let company;

  if (isFreelance) {
    if (!user.nif) {
      throw AppError.badRequest(
        "Debes completar tu perfil antes de darte de alta como autónomo"
      );
    }

    company = await Company.findOne({ cif: user.nif, deleted: false });

    if (!company) {
      company = await Company.create({
        owner: user._id,
        name: user.fullName || user.email,
        cif: user.nif,
        address: user.address,
        isFreelance: true,
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
      data: { user: populatedUser },
    });
  }

  company = await Company.findOne({ cif, deleted: false });

  if (!company) {
    company = await Company.create({
      owner: user._id,
      name,
      cif,
      address,
      isFreelance: false,
    });
    user.company = company._id;
    user.role = "admin";
  } else if (
    company.owner.toString() === user._id.toString() ||
    (user.company?.toString() === company._id.toString() && user.role === "admin")
  ) {
    company.name = name || company.name;
    company.address = address || company.address;
    await company.save();

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
    data: { user: populatedUser },
  });
};

// Controlador para subir el logo de la empresa
export const uploadCompanyLogo = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user || user.deleted) {
    throw AppError.notFound("Usuario no encontrado");
  }

  if (!user.company) {
    throw AppError.badRequest("El usuario no tiene ninguna empresa asociada");
  }

  if (!req.file) {
    throw AppError.badRequest("Debes subir un archivo de imagen");
  }

  const company = await Company.findById(user.company);

  if (!company || company.deleted) {
    throw AppError.notFound("Empresa no encontrada");
  }

  const optimizedLogoBuffer = await sharp(req.file.buffer)
    .resize({ width: 800, height: 800, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();

  const uploadedLogo = await uploadImageBuffer(
    optimizedLogoBuffer,
    "bildyapp/logos"
  );

  company.logo = uploadedLogo.url;
  await company.save();

  const populatedUser = await User.findById(user._id)
    .populate("company")
    .select("-password -refreshToken -verificationCode -verificationAttempts");

  res.status(200).json({
    ok: true,
    message: "Logo subido correctamente",
    data: { user: populatedUser },
  });
};

export const deleteUser = async (req, res) => {
  const { soft } = req.query;

  const user = await User.findById(req.user._id);

  if (!user || user.deleted) {
    throw AppError.notFound("Usuario no encontrado");
  }

  if (soft === "true") {
    user.deleted = true;
    user.refreshToken = null;
    await user.save();

    notificationEmitter.emit("user:deleted", user);

    return res.status(200).json({
      ok: true,
      message: "Usuario eliminado lógicamente",
    });
  }

  await User.findByIdAndDelete(req.user._id);

  notificationEmitter.emit("user:deleted", user);

  res.status(200).json({
    ok: true,
    message: "Usuario eliminado definitivamente",
  });
};

export const inviteUser = async (req, res) => {
  const { email, password } = req.body;

  const adminUser = await User.findById(req.user._id);

  if (!adminUser || adminUser.deleted) {
    throw AppError.notFound("Usuario no encontrado");
  }

  if (adminUser.role !== "admin") {
    throw AppError.forbidden("No tienes permisos para invitar usuarios");
  }

  if (!adminUser.company) {
    throw AppError.badRequest("Debes tener una empresa asociada para invitar usuarios");
  }

  const existingUser = await User.findOne({ email });

  if (existingUser && !existingUser.deleted) {
    throw AppError.conflict("Ya existe un usuario registrado con ese email");
  }

  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const invitedUser = await User.create({
    email,
    password: hashedPassword,
    role: "guest",
    status: "verified",
    company: adminUser.company,
    verificationCode: null,
    verificationAttempts: 0,
  });

  notificationEmitter.emit("user:invited", invitedUser);

  res.status(201).json({
    ok: true,
    message: "Usuario invitado correctamente",
    data: {
      user: {
        id: invitedUser._id,
        email: invitedUser.email,
        role: invitedUser.role,
        status: invitedUser.status,
        company: invitedUser.company,
      },
    },
  });
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id);

  if (!user || user.deleted) {
    throw AppError.notFound("Usuario no encontrado");
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);

  if (!isMatch) {
    throw AppError.unauthorized("La contraseña actual es incorrecta");
  }

  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
  const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

  user.password = hashedPassword;
  user.refreshToken = null;
  await user.save();

  res.status(200).json({
    ok: true,
    message: "Contraseña actualizada correctamente. Debes iniciar sesión de nuevo.",
  });
};
