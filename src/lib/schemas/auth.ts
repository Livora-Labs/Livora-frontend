import { z } from "zod";

/**
 * Esquema de validación para inicio de sesión
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "El correo electrónico es obligatorio")
    .email("Ingrese un correo electrónico válido"),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Esquema de validación para registro de nuevos usuarios
 * Cumplimiento estricto con Ley 29733 (ANPD) y T&C Livora:
 * - termsAccepted: Obligatorio (Términos & Condiciones + Política de Privacidad)
 * - marketingAccepted: Opcional y desmarcado por defecto
 */
export const registerSchema = z.object({
  email: z
    .string()
    .min(1, "El correo electrónico es obligatorio")
    .email("Ingrese un correo electrónico válido"),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres"),
  role: z.enum(["HOGAR", "RECOLECTOR", "CENTRO_ACOPIO", "EMPRESA_B2B", "TIENDA"], {
    errorMap: () => ({ message: "Seleccione un rol válido" }),
  }),
  termsAccepted: z.literal(true, {
    errorMap: () => ({
      message: "Debe aceptar los Términos y Condiciones y la Política de Privacidad para continuar.",
    }),
  }),
  marketingAccepted: z.boolean().default(false),
});

export type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * Esquema de validación para código de verificación OTP (6 dígitos)
 */
export const otpSchema = z.object({
  code: z
    .string()
    .length(6, "El código OTP debe constar de 6 dígitos")
    .regex(/^\d{6}$/, "El código debe contener únicamente números"),
});

export type OtpFormData = z.infer<typeof otpSchema>;

/**
 * Esquema de validación para recuperación de contraseña
 */
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "El correo electrónico es obligatorio")
    .email("Ingrese un correo electrónico válido"),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

/**
 * Esquema de validación para restablecimiento de contraseña
 */
export const resetPasswordSchema = z
  .object({
    code: z
      .string()
      .length(6, "El código debe tener 6 dígitos")
      .regex(/^\d{6}$/, "El código debe ser numérico"),
    newPassword: z
      .string()
      .min(6, "La nueva contraseña debe tener al menos 6 caracteres"),
    confirmPassword: z
      .string()
      .min(1, "Confirme su nueva contraseña"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
