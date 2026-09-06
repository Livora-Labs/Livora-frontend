/**
 * Sistema centralizado de Feature Flags para Livora Eco Platform
 */

export interface FeatureFlags {
  maintenanceMode: boolean;
  enablePwaPush: boolean;
  enableOfflineQueue: boolean;
  enableIpfsPreviews: boolean;
}

export function getFeatureFlags(): FeatureFlags {
  return {
    maintenanceMode: process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true",
    enablePwaPush: process.env.NEXT_PUBLIC_ENABLE_PWA_PUSH !== "false",
    enableOfflineQueue: process.env.NEXT_PUBLIC_ENABLE_OFFLINE_QUEUE !== "false",
    enableIpfsPreviews: process.env.NEXT_PUBLIC_ENABLE_IPFS_PREVIEWS !== "false",
  };
}

export function isFeatureEnabled(flag: keyof FeatureFlags): boolean {
  const flags = getFeatureFlags();
  return Boolean(flags[flag]);
}

export function isMaintenanceMode(): boolean {
  return isFeatureEnabled("maintenanceMode");
}
