import { describe, it, expect } from "vitest";
import { t } from "@/lib/i18n";

describe("i18n Localization Unit Tests", () => {
  it("obtiene correctamente textos anidados del diccionario es-PE", () => {
    expect(t("brand.name")).toBe("Livora");
    expect(t("roles.HOGAR")).toBe("Ciudadano / Hogar");
    expect(t("complaintBook.responseTime")).toBe("15 días hábiles improrrogables");
  });

  it("retorna la clave o fallback si no existe", () => {
    // @ts-ignore
    expect(t("non.existent.key", "Texto por defecto")).toBe("Texto por defecto");
    // @ts-ignore
    expect(t("another.missing.key")).toBe("another.missing.key");
  });
});
