"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type?: "INFO" | "SUCCESS" | "WARNING";
  isRead: boolean;
  createdAt: string;
}

function timeAgo(dateString: string): string {
  try {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "Hace un momento";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours} h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `Hace ${days} d`;
    return date.toLocaleDateString("es-PE", { day: "2-digit", month: "short" });
  } catch {
    return "";
  }
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Polling de notificaciones cada 25 segundos
  const { data: notifications = [] } = useQuery<AppNotification[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await api.get("/notifications");
      return Array.isArray(res.data) ? res.data : [];
    },
    refetchInterval: 25000,
    staleTime: 10000,
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Mutación para marcar como leída
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/notifications/${id}`, { isRead: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Mutación para marcar todas como leídas
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unreadList = notifications.filter((n) => !n.isRead);
      await Promise.all(
        unreadList.map((n) =>
          api.patch(`/notifications/${n.id}`, { isRead: true }).catch(() => null)
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const renderIcon = (type?: string, title?: string) => {
    const t = (type || "").toUpperCase();
    const ttl = (title || "").toLowerCase();

    if (t === "SUCCESS" || ttl.includes("aprobad") || ttl.includes("recibid") || ttl.includes("confirmad")) {
      return <CheckCircle2 size={16} className="text-emerald-500" style={{ color: "#10B981", flexShrink: 0 }} />;
    }
    if (t === "WARNING" || ttl.includes("observad") || ttl.includes("discrepancia") || ttl.includes("atención")) {
      return <AlertTriangle size={16} className="text-amber-500" style={{ color: "#F59E0B", flexShrink: 0 }} />;
    }
    return <Info size={16} className="text-blue-500" style={{ color: "#3B82F6", flexShrink: 0 }} />;
  };

  return (
    <div ref={containerRef} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Notificaciones"
        style={{
          position: "relative",
          background: "none",
          border: "none",
          padding: 8,
          cursor: "pointer",
          borderRadius: 8,
          color: "inherit",
          display: "grid",
          placeItems: "center",
          transition: "background 0.15s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.04)")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              minWidth: 16,
              height: 16,
              padding: "0 4px",
              backgroundColor: "#EF4444",
              color: "#FFFFFF",
              fontSize: 10,
              fontWeight: 700,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid #FFFFFF",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 340,
            maxHeight: 440,
            backgroundColor: "#FFFFFF",
            borderRadius: 14,
            boxShadow: "0 12px 32px -4px rgba(0, 0, 0, 0.15), 0 4px 12px -2px rgba(0, 0, 0, 0.08)",
            border: "1px solid rgba(0, 0, 0, 0.08)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            animation: "fadeIn 0.15s ease-out",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: "#F9FAFB",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <strong style={{ fontSize: 13, color: "#111827" }}>Notificaciones</strong>
              {unreadCount > 0 && (
                <span
                  style={{
                    backgroundColor: "rgba(16, 185, 129, 0.12)",
                    color: "#059669",
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "1px 7px",
                    borderRadius: 10,
                  }}
                >
                  {unreadCount} nuevas
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  fontSize: 11,
                  color: "#059669",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <CheckCheck size={13} />
                <span>Marcar leídas</span>
              </button>
            )}
          </div>

          {/* Listado */}
          <div style={{ flex: 1, overflowY: "auto", maxHeight: 360 }}>
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: "40px 20px",
                  textAlign: "center",
                  color: "#9CA3AF",
                  fontSize: 13,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Bell size={24} style={{ opacity: 0.3 }} />
                <span>No tienes notificaciones registradas</span>
              </div>
            ) : (
              notifications.map((item) => {
                const isUnread = !item.isRead;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (isUnread) markAsReadMutation.mutate(item.id);
                    }}
                    style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid rgba(0, 0, 0, 0.04)",
                      display: "flex",
                      gap: 12,
                      alignItems: "flex-start",
                      cursor: "pointer",
                      backgroundColor: isUnread ? "rgba(16, 185, 129, 0.04)" : "#FFFFFF",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = isUnread
                        ? "rgba(16, 185, 129, 0.08)"
                        : "#F9FAFB")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = isUnread
                        ? "rgba(16, 185, 129, 0.04)"
                        : "#FFFFFF")
                    }
                  >
                    <div style={{ marginTop: 2 }}>{renderIcon(item.type, item.title)}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "baseline",
                          marginBottom: 3,
                        }}
                      >
                        <h4
                          style={{
                            margin: 0,
                            fontSize: 12.5,
                            fontWeight: isUnread ? 700 : 600,
                            color: isUnread ? "#111827" : "#374151",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: 180,
                          }}
                        >
                          {item.title}
                        </h4>
                        <span style={{ fontSize: 10.5, color: "#9CA3AF", flexShrink: 0 }}>
                          {timeAgo(item.createdAt)}
                        </span>
                      </div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 11.5,
                          lineHeight: 1.4,
                          color: "#6B7280",
                          wordBreak: "break-word",
                        }}
                      >
                        {item.message}
                      </p>
                    </div>
                    {isUnread && (
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          backgroundColor: "#10B981",
                          marginTop: 6,
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
