import { z } from 'zod';

export const createClientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  cif: z.string().min(5, 'CIF must be at least 5 characters'),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z
    .object({
      street: z.string().optional(),
      number: z.string().optional(),
      postal: z.string().optional(),
      city: z.string().optional(),
      province: z.string().optional(),
    })
    .optional(),
});

export const updateClientSchema = createClientSchema.partial();