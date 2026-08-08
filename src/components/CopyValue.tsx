"use client";
import { useState } from "react";
import { CheckIcon, CopyIcon } from "./Icons";
export function CopyValue({
  value,
  prefix = "",
}: {
  value: string;
  prefix?: string;
}) {
  const [copied, setCopied] = useState(false);
  const compact =
    value.length > 14 ? `${value.slice(0, 6)}…${value.slice(-4)}` : value;
  async function copy(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }
  return (
    <span className="copy-value">
      <span className="mono">
        {prefix}
        {compact}
      </span>
      <button
        onClick={copy}
        className="copy-btn"
        aria-label={copied ? "Copiado" : "Copiar valor"}
        title={copied ? "Copiado" : "Copiar"}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </button>
      {copied && <span className="copy-toast">Copiado</span>}
    </span>
  );
}
