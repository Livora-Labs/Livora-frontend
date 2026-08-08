import type { SVGProps } from "react";
type Props = SVGProps<SVGSVGElement>;
const base = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};
export const DashboardIcon = (p: Props) => (
  <svg {...base} {...p}>
    <rect x="3" y="3" width="7" height="7" rx="2" />
    <rect x="14" y="3" width="7" height="7" rx="2" />
    <rect x="3" y="14" width="7" height="7" rx="2" />
    <rect x="14" y="14" width="7" height="7" rx="2" />
  </svg>
);
export const BatchIcon = (p: Props) => (
  <svg {...base} {...p}>
    <path d="m12 3 8 4.5-8 4.5-8-4.5L12 3Z" />
    <path d="m4 12 8 4.5 8-4.5M4 16.5l8 4.5 8-4.5" />
  </svg>
);
export const CertificateIcon = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M6 3h9l3 3v15H6z" />
    <path d="M14 3v4h4M9 12h6M9 16h4" />
  </svg>
);
export const InventoryIcon = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5z" />
    <path d="m4 7.5 8 4.5 8-4.5M12 12v9" />
  </svg>
);
export const UsersIcon = (p: Props) => (
  <svg {...base} {...p}>
    <circle cx="9" cy="8" r="3" />
    <path d="M3.5 20v-2a5.5 5.5 0 0 1 11 0v2M16 4.5a3 3 0 0 1 0 5.5M16.5 14a5 5 0 0 1 4 4.9V20" />
  </svg>
);
export const BlockchainIcon = (p: Props) => (
  <svg {...base} {...p}>
    <rect x="8" y="8" width="8" height="8" rx="2" />
    <path d="M5 12H3M21 12h-2M12 5V3M12 21v-2M6.5 6.5 5 5m14 14-1.5-1.5m0-11L19 5M5 19l1.5-1.5" />
  </svg>
);
export const PurchaseIcon = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M3 7h15l-1.5 8h-11zM3 7 2 3H0M8 20h.01M15 20h.01" />
  </svg>
);
export const TraceIcon = (p: Props) => (
  <svg {...base} {...p}>
    <circle cx="5" cy="6" r="2" />
    <circle cx="19" cy="18" r="2" />
    <path d="M7 6h4a3 3 0 0 1 3 3v6a3 3 0 0 0 3 3M7 18h3M14 6h3" />
  </svg>
);
export const CopyIcon = (p: Props) => (
  <svg {...base} {...p}>
    <rect x="8" y="8" width="11" height="11" rx="2" />
    <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
  </svg>
);
export const CheckIcon = (p: Props) => (
  <svg {...base} {...p}>
    <path d="m5 12 4 4L19 6" />
  </svg>
);
