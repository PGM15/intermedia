import { z } from "zod";

const addressSchema = z.object({
  street: z.string().optional(),
  number: z.string().optional(),
  postal: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
});

export const createProjectSchema = z.object({
  name: z.string().min(2),
  projectCode: z.string().min(2),
  client: z.string(),
  email: z.string().email().optional(),
  notes: z.string().optional(),
  active: z.boolean().optional(),
  address: addressSchema.optional(),
});

export const updateProjectSchema = createProjectSchema.partial();