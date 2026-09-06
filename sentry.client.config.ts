import * as Sentry from "@sentry/nextjs";

/**
 * Función de sanitización para eliminar PII (Datos Personales) antes de enviar a Sentry
 */
function sanitizePii(event: Sentry.ErrorEvent): Sentry.ErrorEvent {
  // 1. Eliminar datos directos del usuario
  if (event.user) {
    delete event.user.email;
    delete event.user.username;
    delete event.user.ip_address;
  }

  // 2. Sanitizar cabeceras HTTP sensibles (Tokens JWT)
  if (event.request?.headers) {
    if (event.request.headers["authorization"] || event.request.headers["Authorization"]) {
      event.request.headers["authorization"] = "[SCRUBBED_BEARER_TOKEN]";
    }
    if (event.request.headers["cookie"]) {
      event.request.headers["cookie"] = "[SCRUBBED_COOKIE]";
    }
  }

  // 3. Sanitizar breadcrumbs de navegación o red con DNIs, correos o números telefónicos
  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map((crumb) => {
      if (crumb.data && typeof crumb.data === "object") {
        const sanitizedData = { ...crumb.data };
        const sensitiveKeys = ["password", "documentNumber", "dni", "phone", "email", "refreshToken", "accessToken", "bankAccount"];
        for (const key of sensitiveKeys) {
          if (sanitizedData[key]) {
            sanitizedData[key] = "[FILTERED_PII]";
          }
        }
        crumb.data = sanitizedData;
      }
      return crumb;
    });
  }

  return event;
}

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "",
  tracesSampleRate: 0.1, // Muestreo eficiente para producción
  debug: false,
  beforeSend(event) {
    return sanitizePii(event);
  },
});
