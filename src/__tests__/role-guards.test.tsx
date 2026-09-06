import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { Shell } from "@/components/Shell";
import { AuthProvider } from "@/context/AuthContext";
import { QueryProvider } from "@/lib/queryClient";

const mockPush = vi.fn();
let currentPathname = "/centro";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => currentPathname,
}));

vi.mock("@/components/ToastNotification", () => ({
  showToast: vi.fn(),
  ToastContainer: () => null,
}));

vi.mock("@/lib/api", () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
  },
  fetchBalance: vi.fn().mockResolvedValue({ balance: "150.00", publicKey: "GABC..." }),
}));

vi.mock("@/lib/socket", () => ({
  getSocket: vi.fn().mockReturnValue({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  }),
  disconnectSocket: vi.fn(),
}));

describe("Web Shell Guard and Role Isolation Tests", () => {
  beforeEach(() => {
    localStorage.clear();
    mockPush.mockClear();
    vi.clearAllMocks();
  });

  it("permite a ADMIN navegar en /centro bajo privilegios de auditoria", () => {
    localStorage.setItem("livora_token", "admin_jwt");
    localStorage.setItem("livora_role", "ADMIN");
    currentPathname = "/centro";

    render(
      <QueryProvider>
        <AuthProvider>
          <Shell role="centro">
            <div>Panel de Centro</div>
          </Shell>
        </AuthProvider>
      </QueryProvider>
    );

    expect(screen.getByText("Panel de Centro")).toBeDefined();
    expect(mockPush).not.toHaveBeenCalledWith("/company");
    expect(mockPush).not.toHaveBeenCalledWith("/admin");
  });

  it("intercepta y reencausa a EMPRESA_B2B cuando intenta acceder a /admin", () => {
    localStorage.setItem("livora_token", "company_jwt");
    localStorage.setItem("livora_role", "EMPRESA_B2B");
    currentPathname = "/admin";

    render(
      <QueryProvider>
        <AuthProvider>
          <Shell role="admin">
            <div>Panel Restringido</div>
          </Shell>
        </AuthProvider>
      </QueryProvider>
    );

    expect(mockPush).toHaveBeenCalledWith("/company");
  });

  it("intercepta y reencausa a CENTRO_ACOPIO cuando intenta acceder a /company", () => {
    localStorage.setItem("livora_token", "centro_jwt");
    localStorage.setItem("livora_role", "CENTRO_ACOPIO");
    currentPathname = "/company";

    render(
      <QueryProvider>
        <AuthProvider>
          <Shell role="company">
            <div>Panel Restringido</div>
          </Shell>
        </AuthProvider>
      </QueryProvider>
    );

    expect(mockPush).toHaveBeenCalledWith("/centro");
  });

  it("bloquea y expulsa inmediatamente a roles moviles como HOGAR", () => {
    localStorage.setItem("livora_token", "hogar_jwt");
    localStorage.setItem("livora_role", "HOGAR");
    currentPathname = "/centro";

    render(
      <QueryProvider>
        <AuthProvider>
          <Shell role="centro">
            <div>Panel Restringido</div>
          </Shell>
        </AuthProvider>
      </QueryProvider>
    );

    expect(mockPush).toHaveBeenCalledWith("/");
  });
});
