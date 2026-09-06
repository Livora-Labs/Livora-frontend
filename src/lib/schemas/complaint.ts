import { z } from "zod";

/**
 * Esquema de validación para el Libro de Reclamaciones Virtual
 * Conforme al Código de Protección y Defensa del Consumidor (Ley N.º 29571) y Ley N.º 32495 (Indecopi).
 */
export const complaintSchema = z
  .object({
    documentType: z.enum(["DNI", "CE", "PASAPORTE", "RUC"], {
      errorMap: () => ({ message: "Seleccione un tipo de documento válido" }),
    }),
    documentNumber: z
      .string()
      .min(1, "El número de documento es obligatorio"),
    fullName: z
      .string()
      .min(3, "El nombre completo debe tener al menos 3 caracteres"),
    address: z
      .string()
      .min(5, "Ingrese una dirección de domicilio válida"),
    phone: z
      .string()
      .min(7, "Ingrese un número telefónico de contacto válido")
      .regex(/^[\d\s+\-()]{7,15}$/, "Formato telefónico inválido"),
    email: z
      .string()
      .min(1, "El correo electrónico es obligatorio")
      .email("Ingrese un correo electrónico válido"),
    isMinor: z.boolean().default(false),
    representativeName: z.string().optional(),
    representativeDoc: z.string().optional(),
    goodType: z.enum(["PRODUCTO", "SERVICIO"], {
      errorMap: () => ({ message: "Seleccione si es un producto o servicio" }),
    }),
    goodDescription: z
      .string()
      .min(5, "Describa detalladamente el producto o servicio contratado"),
    amount: z
      .string()
      .optional()
      .refine(
        (val) => !val || !isNaN(parseFloat(val)) && parseFloat(val) >= 0,
        "El monto debe ser un valor numérico válido"
      ),
    claimType: z.enum(["RECLAMO", "QUEJA"], {
      errorMap: () => ({ message: "Indique si se trata de un reclamo o una queja" }),
    }),
    claimDetail: z
      .string()
      .min(10, "El detalle de la reclamación debe tener al menos 10 caracteres"),
    consumerRequest: z
      .string()
      .min(5, "Especifique claramente su pedido o pretensión"),
    affidavitConsent: z.literal(true, {
      errorMap: () => ({
        message: "Debe aceptar la declaración jurada de veracidad para registrar su reclamo.",
      }),
    }),
  })
  .superRefine((data, ctx) => {
    // Validación de Documento de Identidad según tipo
    if (data.documentType === "DNI") {
      if (!/^\d{8}$/.test(data.documentNumber)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "El DNI debe constar de exactamente 8 dígitos numéricos",
          path: ["documentNumber"],
        });
      }
    } else if (data.documentType === "RUC") {
      if (!/^\d{11}$/.test(data.documentNumber)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "El RUC debe constar de 11 dígitos numéricos",
          path: ["documentNumber"],
        });
      }
    } else if (data.documentType === "CE") {
      if (data.documentNumber.length < 8 || data.documentNumber.length > 12) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "El Carné de Extranjería debe tener entre 8 y 12 caracteres",
          path: ["documentNumber"],
        });
      }
    }

    // Validación condicional de menores de edad
    if (data.isMinor) {
      if (!data.representativeName || data.representativeName.trim().length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Para menores de edad es obligatorio registrar el nombre del padre, madre o apoderado",
          path: ["representativeName"],
        });
      }
    }
  });

export type ComplaintFormData = z.infer<typeof complaintSchema>;
