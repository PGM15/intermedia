import { z } from "zod";

const workerSchema = z.object({
  name: z.string().min(1, "Worker name is required"),
  hours: z.number().min(0, "Worker hours must be >= 0"),
});

export const createDeliveryNoteSchema = z.object({
  client: z.string().min(1, "Client is required"),
  project: z.string().min(1, "Project is required"),
  format: z.enum(["material", "hours"]),
  description: z.string().optional(),
  workDate: z.string().min(1, "Work date is required"),

  material: z.string().optional(),
  quantity: z.number().min(0).optional(),
  unit: z.string().optional(),

  hours: z.number().min(0).optional(),
  workers: z.array(workerSchema).optional(),
});