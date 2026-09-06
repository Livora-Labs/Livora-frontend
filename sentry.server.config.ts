import * as Sentry from "@sentry/nextjs";

function sanitizeServerPii(event: Sentry.ErrorEvent): Sentry.ErrorEvent {
  if (event.user) {
    delete event.user.email;
    delete event.user.username;
    delete event.user.ip_address;
  }

  if (event.request?.headers) {
    if (event.request.headers["authorization"] || event.request.headers["Authorization"]) {
      event.request.headers["authorization"] = "[SCRUBBED_BEARER_TOKEN]";
    }
  }

  return event;
}

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "",
  tracesSampleRate: 0.1,
  debug: false,
  beforeSend(event) {
    return sanitizeServerPii(event);
  },
});
