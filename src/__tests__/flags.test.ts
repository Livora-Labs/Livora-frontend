import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getFeatureFlags, isFeatureEnabled, isMaintenanceMode } from "@/lib/flags";

describe("FeatureFlags Unit Tests", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("retorna valores por defecto cuando no hay variables de entorno explícitas", () => {
    delete process.env.NEXT_PUBLIC_MAINTENANCE_MODE;
    const flags = getFeatureFlags();

    expect(flags.maintenanceMode).toBe(false);
    expect(flags.enablePwaPush).toBe(true);
    expect(flags.enableOfflineQueue).toBe(true);
    expect(flags.enableIpfsPreviews).toBe(true);
  });

  it("activa el modo de mantenimiento si NEXT_PUBLIC_MAINTENANCE_MODE es 'true'", () => {
    process.env.NEXT_PUBLIC_MAINTENANCE_MODE = "true";
    expect(isMaintenanceMode()).toBe(true);
    expect(isFeatureEnabled("maintenanceMode")).toBe(true);
  });

  it("desactiva features específicas si se configuran en 'false'", () => {
    process.env.NEXT_PUBLIC_ENABLE_PWA_PUSH = "false";
    expect(isFeatureEnabled("enablePwaPush")).toBe(false);
  });
});
