import { z } from "zod";

/**
 * Esquema de validación para perfil comercial de Tienda Aliada
 */
export const storeProfileSchema = z.object({
  businessName: z
    .string()
    .min(3, "La razón social o nombre comercial debe tener al menos 3 caracteres"),
  ruc: z
    .string()
    .length(11, "El RUC debe constar de exactamente 11 dígitos")
    .regex(/^\d{11}$/, "El RUC debe contener solo dígitos numéricos"),
  address: z
    .string()
    .min(5, "Ingrese una dirección física comercial válida"),
  bankAccount: z
    .string()
    .min(10, "Ingrese un número de cuenta o Código de Cuenta Interbancario (CCI) válido"),
});

export type StoreProfileFormData = z.infer<typeof storeProfileSchema>;

/**
 * Esquema de validación para cobro POS de EcoTokens
 */
export const posChargeSchema = z.object({
  chargeAmount: z
    .string()
    .min(1, "El monto a cobrar es obligatorio")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "El monto a cobrar debe ser mayor a 0 EcoTokens",
    }),
  concept: z.string().max(120, "El concepto no puede exceder 120 caracteres").optional(),
});

export type PosChargeFormData = z.infer<typeof posChargeSchema>;
