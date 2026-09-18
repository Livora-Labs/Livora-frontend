"use client";

import React from "react";
import { Shell } from "@/components/Shell";

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  return <Shell role="company">{children}</Shell>;
}
