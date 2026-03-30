import { z } from "zod";

// Esquema validador para el registro de usuarios
export const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Email no válido"),

  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .max(50, "La contraseña no puede superar los 50 caracteres"),
});

// Esquema validador para el login de usuarios
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Email no válido"),

  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .max(50, "La contraseña no puede superar los 50 caracteres"),
});

export const completeProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(50, "El nombre no puede superar los 50 caracteres"),

  lastName: z
    .string()
    .trim()
    .min(2, "El apellido debe tener al menos 2 caracteres")
    .max(100, "El apellido no puede superar los 100 caracteres"),

  nif: z
    .string()
    .trim()
    .min(8, "El NIF debe tener al menos 8 caracteres")
    .max(20, "El NIF no puede superar los 20 caracteres")
    .transform((value) => value.toUpperCase()),

  address: z.object({
    street: z
      .string()
      .trim()
      .min(3, "La calle debe tener al menos 3 caracteres")
      .max(120, "La calle no puede superar los 120 caracteres"),

    city: z
      .string()
      .trim()
      .min(2, "La ciudad debe tener al menos 2 caracteres")
      .max(80, "La ciudad no puede superar los 80 caracteres"),

    postalCode: z
      .string()
      .trim()
      .min(4, "El código postal debe tener al menos 4 caracteres")
      .max(12, "El código postal no puede superar los 12 caracteres"),

    country: z
      .string()
      .trim()
      .min(2, "El país debe tener al menos 2 caracteres")
      .max(60, "El país no puede superar los 60 caracteres"),
  }),
});

export const companySchema = z.object({
  isFreelance: z.boolean(),

  name: z
    .string()
    .trim()
    .min(2, "El nombre de la empresa debe tener al menos 2 caracteres")
    .max(100, "El nombre de la empresa no puede superar los 100 caracteres")
    .optional(),

  cif: z
    .string()
    .trim()
    .min(8, "El CIF debe tener al menos 8 caracteres")
    .max(20, "El CIF no puede superar los 20 caracteres")
    .transform((value) => value.toUpperCase())
    .optional(),

  address: z
    .object({
      street: z
        .string()
        .trim()
        .min(3, "La calle debe tener al menos 3 caracteres")
        .max(120, "La calle no puede superar los 120 caracteres"),

      city: z
        .string()
        .trim()
        .min(2, "La ciudad debe tener al menos 2 caracteres")
        .max(80, "La ciudad no puede superar los 80 caracteres"),

      postalCode: z
        .string()
        .trim()
        .min(4, "El código postal debe tener al menos 4 caracteres")
        .max(12, "El código postal no puede superar los 12 caracteres"),

      country: z
        .string()
        .trim()
        .min(2, "El país debe tener al menos 2 caracteres")
        .max(60, "El país no puede superar los 60 caracteres"),
    })
    .optional(),
}).superRefine((data, ctx) => {
  if (!data.isFreelance) {
    if (!data.name) {
      ctx.addIssue({
        code: "custom",
        path: ["name"],
        message: "El nombre de la empresa es obligatorio",
      });
    }

    if (!data.cif) {
      ctx.addIssue({
        code: "custom",
        path: ["cif"],
        message: "El CIF es obligatorio",
      });
    }

    if (!data.address) {
      ctx.addIssue({
        code: "custom",
        path: ["address"],
        message: "La dirección es obligatoria",
      });
    }
  }
});

// Esquema validador para refresh de sesión
export const refreshSchema = z.object({
  refreshToken: z
    .string()
    .trim()
    .min(1, "El refresh token es obligatorio"),
});

// Esquema validador para logout
export const logoutSchema = z.object({
  refreshToken: z
    .string()
    .trim()
    .min(1, "El refresh token es obligatorio"),
});