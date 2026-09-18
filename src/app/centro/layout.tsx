"use client";

import React from "react";
import { Shell } from "@/components/Shell";

export default function CentroLayout({ children }: { children: React.ReactNode }) {
  return <Shell role="centro">{children}</Shell>;
}
