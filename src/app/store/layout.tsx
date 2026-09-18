"use client";

import React from "react";
import { Shell } from "@/components/Shell";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return <Shell role="store">{children}</Shell>;
}
