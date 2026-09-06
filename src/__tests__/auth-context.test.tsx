import React from "react";
import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { QueryProvider } from "@/lib/queryClient";

// Mock API and Socket dependencies
vi.mock("@/lib/api", () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
  },
  fetchBalance: vi.fn().mockResolvedValue({ balance: "100.00", publicKey: "GABC..." }),
}));

vi.mock("@/lib/socket", () => ({
  getSocket: vi.fn().mockReturnValue({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  }),
  disconnectSocket: vi.fn(),
}));

function TestConsumer() {
  const { user, token, role, logout } = useAuth();
  return (
    <div>
      <span data-testid="auth-token">{token || "NO_TOKEN"}</span>
      <span data-testid="auth-role">{role || "NO_ROLE"}</span>
      <span data-testid="auth-email">{user?.email || "NO_USER"}</span>
      <button onClick={logout} data-testid="btn-logout">
        Logout
      </button>
    </div>
  );
}

describe("AuthContext Unit Tests", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("inicializa con estado vacío cuando no hay tokens en localStorage", () => {
    render(
      <QueryProvider>
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      </QueryProvider>
    );

    expect(screen.getByTestId("auth-token").textContent).toBe("NO_TOKEN");
    expect(screen.getByTestId("auth-role").textContent).toBe("NO_ROLE");
    expect(screen.getByTestId("auth-email").textContent).toBe("NO_USER");
  });

  it("hidrata correctamente la sesión desde localStorage al iniciar", () => {
    const mockUser = { id: "user-123", email: "ciudadano@livora.pe", role: "HOGAR", walletAddress: "GABC..." };
    localStorage.setItem("livora_token", "mock_access_jwt");
    localStorage.setItem("livora_refresh_token", "mock_refresh_jwt");
    localStorage.setItem("livora_role", "HOGAR");
    localStorage.setItem("livora_user", JSON.stringify(mockUser));

    render(
      <QueryProvider>
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      </QueryProvider>
    );

    expect(screen.getByTestId("auth-token").textContent).toBe("mock_access_jwt");
    expect(screen.getByTestId("auth-role").textContent).toBe("HOGAR");
    expect(screen.getByTestId("auth-email").textContent).toBe("ciudadano@livora.pe");
  });

  it("purga de forma segura localStorage y resetea el estado al ejecutar logout", () => {
    const mockUser = { id: "user-123", email: "ciudadano@livora.pe", role: "HOGAR" };
    localStorage.setItem("livora_token", "mock_access_jwt");
    localStorage.setItem("livora_refresh_token", "mock_refresh_jwt");
    localStorage.setItem("livora_role", "HOGAR");
    localStorage.setItem("livora_user", JSON.stringify(mockUser));

    render(
      <QueryProvider>
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      </QueryProvider>
    );

    expect(screen.getByTestId("auth-token").textContent).toBe("mock_access_jwt");

    act(() => {
      screen.getByTestId("btn-logout").click();
    });

    expect(localStorage.getItem("livora_token")).toBeNull();
    expect(localStorage.getItem("livora_refresh_token")).toBeNull();
    expect(localStorage.getItem("livora_user")).toBeNull();
    expect(screen.getByTestId("auth-token").textContent).toBe("NO_TOKEN");
  });
});
