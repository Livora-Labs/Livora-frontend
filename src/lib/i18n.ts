import esPE from "@/locales/es-PE.json";

type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

export type TranslationKey = NestedKeyOf<typeof esPE>;

/**
 * Función de traducción y localización para obtener cadenas tipadas
 */
export function t(key: TranslationKey, fallback?: string): string {
  const keys = key.split(".");
  let current: any = esPE;

  for (const k of keys) {
    if (current && typeof current === "object" && k in current) {
      current = current[k];
    } else {
      return fallback || key;
    }
  }

  return typeof current === "string" ? current : fallback || key;
}

export const locale = "es-PE";
export default t;
