"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Role, User } from "@/lib/types";
import { api, fetchBalance } from "@/lib/api";
import { disconnectSocket, getSocket } from "@/lib/socket";

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: Role | null;
  balance: string;
  receptionPin: string;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, selectedRole: Role) => Promise<void>;
  verifyEmail: (email: string, code: string) => Promise<User>;
  resendOtp: (email: string) => Promise<void>;
  logout: () => void;
  refreshBalance: () => Promise<void>;
  updateReceptionPin: (pin: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [balance, setBalance] = useState<string>("0.00");
  const [receptionPin, setReceptionPin] = useState<string>("");

  useEffect(() => {
    const savedToken = localStorage.getItem("livora_token");
    const savedRole = localStorage.getItem("livora_role") as Role;
    const savedUser = localStorage.getItem("livora_user");

    if (savedToken && savedRole && savedUser) {
      setToken(savedToken);
      setRole(savedRole);
      const parsedUser = JSON.parse(savedUser) as User;
      setUser(parsedUser);
      if (parsedUser.receptionPin) {
        setReceptionPin(parsedUser.receptionPin);
      }
      getSocket(savedToken);
      // Fetch fresh balance from the DB
      fetchBalance()
        .then((data) => setBalance(String(data.balance)))
        .catch(() => {});
    }
  }, []);

  const refreshBalance = async () => {
    try {
      const data = await fetchBalance();
      setBalance(String(data.balance));
    } catch (err) {
      setBalance("0.00");
    }
  };

  const login = async (email: string, password: string): Promise<User> => {
    const res = await api.post("/auth/login", { email, password });
    if (res.data && res.data.accessToken) {
      const authToken = res.data.accessToken;
      const loggedUser: User = {
        id: res.data.user.id,
        email: res.data.user.email,
        role: res.data.user.role,
        walletAddress: res.data.user.walletAddress,
        receptionPin: res.data.user.receptionPin,
      };

      setToken(authToken);
      setUser(loggedUser);
      setRole(loggedUser.role);
      if (loggedUser.receptionPin) {
        setReceptionPin(loggedUser.receptionPin);
      }

      localStorage.setItem("livora_token", authToken);
      localStorage.setItem("livora_role", loggedUser.role);
      localStorage.setItem("livora_user", JSON.stringify(loggedUser));

      getSocket(authToken);
      await refreshBalance();
      return loggedUser;
    }
    throw new Error("No se pudo iniciar sesión");
  };

  const register = async (email: string, password: string, selectedRole: Role): Promise<void> => {
    await api.post("/auth/register", {
      email,
      password,
      role: selectedRole,
    });
  };

  const verifyEmail = async (email: string, code: string): Promise<User> => {
    const res = await api.post("/auth/verify-email", { email, code });
    if (res.data && res.data.accessToken) {
      const authToken = res.data.accessToken;
      const loggedUser: User = {
        id: res.data.user.id,
        email: res.data.user.email,
        role: res.data.user.role,
        walletAddress: res.data.user.walletAddress,
        receptionPin: res.data.user.receptionPin,
      };

      setToken(authToken);
      setUser(loggedUser);
      setRole(loggedUser.role);
      if (loggedUser.receptionPin) {
        setReceptionPin(loggedUser.receptionPin);
      }

      localStorage.setItem("livora_token", authToken);
      localStorage.setItem("livora_role", loggedUser.role);
      localStorage.setItem("livora_user", JSON.stringify(loggedUser));

      getSocket(authToken);
      await refreshBalance();
      return loggedUser;
    }
    throw new Error("No se pudo verificar el correo");
  };

  const resendOtp = async (email: string): Promise<void> => {
    await api.post("/auth/resend-otp", { email });
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setRole(null);
    setBalance("0.00");
    setReceptionPin("");
    localStorage.removeItem("livora_token");
    localStorage.removeItem("livora_role");
    localStorage.removeItem("livora_user");
    disconnectSocket();
  };

  const updateReceptionPin = (newPin: string) => {
    setReceptionPin(newPin);
    if (user) {
      const updatedUser = { ...user, receptionPin: newPin };
      setUser(updatedUser);
      localStorage.setItem("livora_user", JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        balance,
        receptionPin,
        login,
        register,
        verifyEmail,
        resendOtp,
        logout,
        refreshBalance,
        updateReceptionPin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
}
