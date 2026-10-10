"use client";

import React, { useEffect, useRef, useState } from "react";

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  theme?: "light" | "dark" | "auto";
  className?: string;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onloadTurnstileCallback?: () => void;
  }
}

export function TurnstileWidget({
  onVerify,
  onExpire,
  onError,
  theme = "light",
  className = "",
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Stabilize callbacks in refs to eliminate infinite re-render / flicker loops
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onVerifyRef.current = onVerify;
    onExpireRef.current = onExpire;
    onErrorRef.current = onError;
  });

  const siteKey =
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
    "0x4AAAAAAFRB59i34AEyTGQw";

  useEffect(() => {
    // If Turnstile is already loaded on window
    if (window.turnstile) {
      setLoaded(true);
      return;
    }

    const scriptId = "cf-turnstile-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setLoaded(true);
      };
      document.head.appendChild(script);
    } else {
      script.addEventListener("load", () => setLoaded(true));
    }
  }, []);

  useEffect(() => {
    if (!loaded || !containerRef.current || !window.turnstile) return;

    // Do not re-render if widget is already active
    if (widgetIdRef.current) return;

    try {
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => {
          onVerifyRef.current?.(token);
        },
        "expired-callback": () => {
          onExpireRef.current?.();
        },
        "error-callback": () => {
          onErrorRef.current?.();
        },
        theme,
      });
    } catch (err) {
      console.warn("Turnstile render warning:", err);
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore
        }
        widgetIdRef.current = null;
      }
    };
  }, [loaded, siteKey, theme]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: 65,
      }}
      className={className}
    >
      <div ref={containerRef} />
    </div>
  );
}

export default TurnstileWidget;
