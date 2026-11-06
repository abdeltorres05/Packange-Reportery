const { z } = require("zod");

const { STATUSES } = require("../repositories/reports");

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Usa el formato AAAA-MM-DD")
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)), {
    message: "Fecha inválida",
  });

const optionalText = (max) =>
  z
    .string()
    .max(max)
    .optional()
    .nullable()
    .transform((value) => (value === "" ? null : value));

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Correo inválido").max(200),
  password: z.string().min(1, "La contraseña es obligatoria").max(200),
});

const agencyCreateSchema = z.object({
  name: z.string().trim().min(2, "El nombre es obligatorio").max(120),
  code: z
    .string()
    .trim()
    .min(2, "El código es obligatorio")
    .max(20)
    .transform((value) => value.toUpperCase()),
});

const agencyUpdateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  code: z
    .string()
    .trim()
    .min(2)
    .max(20)
    .transform((value) => value.toUpperCase())
    .optional(),
  active: z.boolean().optional(),
});

const userCreateSchema = z.object({
  name: z.string().trim().min(2, "El nombre es obligatorio").max(120),
  email: z.string().trim().toLowerCase().email("Correo inválido").max(200),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(200),
  role: z.enum(["super_admin", "agency_admin", "agency_user"]).default("agency_user"),
  agencyId: z.coerce.number().int().positive().optional(),
});

const userUpdateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  email: z.string().trim().toLowerCase().email("Correo inválido").max(200).optional(),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(200).optional(),
  role: z.enum(["super_admin", "agency_admin", "agency_user"]).optional(),
  agencyId: z.coerce.number().int().positive().nullable().optional(),
  active: z.boolean().optional(),
});

const trackingNumber = z
  .string()
  .trim()
  .min(1, "El número de guía es obligatorio")
  .max(60);

const reportCreateSchema = z.object({
  agencyId: z.coerce.number().int().positive().optional(),
  trackingNumber,
  senderName: z.string().trim().min(1).max(120).optional().default("No especificado"),
  senderPhone: z.string().trim().max(40).optional().nullable().transform((value) => value === "" ? null : value),
  recipientName: z.string().trim().min(1).max(120).optional().default("No especificado"),
  recipientPhone: z.string().trim().max(40).optional().nullable().transform((value) => value === "" ? null : value),
  reportDate: dateString.optional().default(() => new Date().toISOString().slice(0, 10)),
  status: z.enum(STATUSES).default("pendiente"),
  description: z.string().trim().min(1, "La descripción es obligatoria").max(2000),
  observations: optionalText(2000),
});

const reportUpdateSchema = z.object({
  trackingNumber: trackingNumber.optional(),
  senderName: z.string().trim().min(1).max(120).optional(),
  senderPhone: z.string().trim().max(40).optional().nullable().transform((value) => value === "" ? null : value),
  recipientName: z.string().trim().min(1).max(120).optional(),
  recipientPhone: z.string().trim().max(40).optional().nullable().transform((value) => value === "" ? null : value),
  reportDate: dateString.optional(),
  status: z.enum(STATUSES).optional(),
  description: z.string().trim().min(1, "La descripción es obligatoria").max(2000).optional(),
  observations: optionalText(2000),
  statusNotes: optionalText(500),
  notes: optionalText(500),
});

const reportListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(STATUSES).optional(),
  from: dateString.optional(),
  to: dateString.optional(),
  q: z.string().trim().max(120).optional(),
  agencyId: z.coerce.number().int().positive().optional(),
});

const statsQuerySchema = z.object({
  from: dateString.optional(),
  to: dateString.optional(),
  agencyId: z.coerce.number().int().positive().optional(),
});

module.exports = {
  loginSchema,
  agencyCreateSchema,
  agencyUpdateSchema,
  userCreateSchema,
  userUpdateSchema,
  reportCreateSchema,
  reportUpdateSchema,
  reportListQuerySchema,
  statsQuerySchema,
};
