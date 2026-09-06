import { z } from "zod";

/**
 * Esquema de validación para pesaje en báscula industrial de Centro de Acopio
 */
export const scaleWeighingSchema = z
  .object({
    petWeight: z.number().min(0, "El peso no puede ser negativo").default(0),
    cartonWeight: z.number().min(0, "El peso no puede ser negativo").default(0),
    vidrioWeight: z.number().min(0, "El peso no puede ser negativo").default(0),
    aluminioWeight: z.number().min(0, "El peso no puede ser negativo").default(0),
    tetrapakWeight: z.number().min(0, "El peso no puede ser negativo").default(0),
    notes: z.string().max(250, "Las notas no pueden exceder 250 caracteres").optional(),
  })
  .refine(
    (data) =>
      data.petWeight > 0 ||
      data.cartonWeight > 0 ||
      data.vidrioWeight > 0 ||
      data.aluminioWeight > 0 ||
      data.tetrapakWeight > 0,
    {
      message: "Debe registrar al menos un material con peso mayor a 0 kg en la báscula",
      path: ["petWeight"],
    }
  );

export type ScaleWeighingFormData = z.infer<typeof scaleWeighingSchema>;

/**
 * Esquema de validación para despacho y transferencia multi-material B2B
 */
export const b2bTransferSchema = z.object({
  destinationCompanyId: z
    .string()
    .min(1, "Debe seleccionar una empresa transformadora de destino"),
  materials: z
    .record(z.string(), z.number().min(0))
    .refine(
      (mats) => Object.values(mats).reduce((acc, curr) => acc + curr, 0) > 0,
      "Debe despachar al menos un material con cantidad mayor a 0 kg"
    ),
  notes: z.string().optional(),
});

export type B2bTransferFormData = z.infer<typeof b2bTransferSchema>;
