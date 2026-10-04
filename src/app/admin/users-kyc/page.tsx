"use client";

import React, { useState, useEffect, useMemo } from "react";
import { PageHead, Status } from "@/components/Shell";
import { fetchKycApplications, updateKycStatus, fetchAdminUsers, updateAdminUserStatus, adminRegularizePassword } from "@/lib/api";
import { showToast, ToastContainer } from "@/components/ToastNotification";
import { Users, ShieldCheck, RefreshCw, Search, Filter, KeyRound, Mail, Lock, Eye, EyeOff, X, Sparkles, Building2, ExternalLink, CheckCircle2, AlertTriangle, FileText, ZoomIn } from "lucide-react";
import { MediaViewerModal, MediaItem } from "@/components/MediaViewerModal";

const date = (value: string) =>
  new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

function KycStatusBadge({ status }: { status?: string }) {
  switch (status) {
    case "APPROVED":
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 10,
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: 6,
            background: "rgba(16, 185, 129, 0.12)",
            color: "#10B981",
            border: "1px solid rgba(16, 185, 129, 0.25)",
          }}
        >
          <ShieldCheck size={11} />
          VERIFICADO
        </span>
      );
    case "PENDING":
    case "IN_REVIEW":
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 10,
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: 6,
            background: "rgba(245, 158, 11, 0.12)",
            color: "#F59E0B",
            border: "1px solid rgba(245, 158, 11, 0.25)",
          }}
        >
          <AlertTriangle size={11} />
          PENDIENTE
        </span>
      );
    case "OBSERVED":
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 10,
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: 6,
            background: "rgba(249, 115, 22, 0.12)",
            color: "#F97316",
            border: "1px solid rgba(249, 115, 22, 0.25)",
          }}
        >
          OBSERVADO
        </span>
      );
    case "REJECTED":
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 10,
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: 6,
            background: "rgba(244, 63, 94, 0.12)",
            color: "#F43F5E",
            border: "1px solid rgba(244, 63, 94, 0.25)",
          }}
        >
          RECHAZADO
        </span>
      );
    default:
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 10,
            fontWeight: 600,
            padding: "3px 8px",
            borderRadius: 6,
            background: "rgba(148, 163, 184, 0.1)",
            color: "var(--muted, #94a3b8)",
            border: "1px solid rgba(148, 163, 184, 0.2)",
          }}
        >
          NO PRESENTADO
        </span>
      );
  }
}

function KycSkeleton() {
  return (
    <>
      <div className="grid kpis">
        {[1, 2, 3, 4].map((x) => (
          <div
            key={x}
            className="card kpi animate-pulse"
            style={{
              height: 110,
              background: "var(--panel)",
              border: "1px solid var(--line)",
              borderRadius: 12,
            }}
          >
            <div
              style={{
                height: 12,
                width: "50%",
                background: "var(--line)",
                borderRadius: 4,
                marginBottom: 12,
              }}
            />
            <div
              style={{
                height: 24,
                width: "70%",
                background: "var(--line)",
                borderRadius: 4,
              }}
            />
          </div>
        ))}
      </div>
      <section
        className="card animate-pulse"
        style={{
          height: 280,
          background: "var(--panel)",
          border: "1px solid var(--line)",
          borderRadius: 12,
          marginTop: 24,
        }}
      />
    </>
  );
}

export default function Page() {
  const [activeTab, setActiveTab] = useState<"users" | "kyc">("users");

  // --- Estado para Directorio Global de Usuarios ---
  const [usersList, setUsersList] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userStatusFilter, setUserStatusFilter] = useState("all");
  const [userPage, setUserPage] = useState(1);
  const [userMeta, setUserMeta] = useState({
    total: 0,
    page: 1,
    limit: 15,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // --- Estado para Modal de Auditoría KYC Directa desde Directorio ---
  const [selectedUserForKyc, setSelectedUserForKyc] = useState<any | null>(null);
  const [userKycObservation, setUserKycObservation] = useState("");
  const [userKycSubmitting, setUserKycSubmitting] = useState(false);

  // --- Estado para Visor Multimedia Universal ---
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerItems, setViewerItems] = useState<MediaItem[]>([]);
  const [viewerInitialIndex, setViewerInitialIndex] = useState(0);

  const openMediaViewer = (mediaItems: MediaItem[], initialIdx = 0) => {
    if (!mediaItems || mediaItems.length === 0) return;
    setViewerItems(mediaItems);
    setViewerInitialIndex(initialIdx);
    setViewerOpen(true);
  };

  const getKycMediaItems = (k: any): MediaItem[] => {
    const media: MediaItem[] = [];
    const name = k.user?.name || k.user?.email || "Usuario";
    if (k.user?.role === "TIENDA") {
      if (k.documentUrl) {
        media.push({
          url: k.documentUrl,
          title: `Fachada del Local Comercial`,
          subtitle: `${name} · RUC: ${k.taxIdRuc || k.documentNumber || "No especificado"}`,
          type: "image",
        });
      }
    } else {
      if (k.documentUrl) {
        media.push({
          url: k.documentUrl,
          title: `Frente del Documento (${k.documentType || "DNI/CE"})`,
          subtitle: `${name} · N° ${k.documentNumber || "-"}`,
          type: k.documentUrl.toLowerCase().includes(".pdf") ? "pdf" : "image",
        });
      }
      if (k.documentUrlBack) {
        media.push({
          url: k.documentUrlBack,
          title: `Reverso del Documento`,
          subtitle: `${name} · N° ${k.documentNumber || "-"}`,
          type: k.documentUrlBack.toLowerCase().includes(".pdf") ? "pdf" : "image",
        });
      }
      if (k.selfieUrl) {
        media.push({
          url: k.selfieUrl,
          title: `Selfie / Foto de Perfil`,
          subtitle: `${name} · Verificación Biométrica`,
          type: "image",
        });
      }
    }
    return media;
  };

  const getUserKycMediaItems = (user: any): MediaItem[] => {
    const media: MediaItem[] = [];
    if (!user) return media;
    const name = user.name || user.email || "Usuario";
    const kyc = user.kycApplications?.[0];

    if (user.role === "TIENDA") {
      const facadeUrl = user.storeProfile?.logoUrl || kyc?.documentUrl;
      if (facadeUrl) {
        media.push({
          url: facadeUrl,
          title: `Fachada del Comercio`,
          subtitle: `${name} · RUC: ${user.storeProfile?.ruc || kyc?.taxIdRuc || "-"}`,
          type: "image",
        });
      }
    } else {
      const frontDoc = user.dniPhotoUrl || kyc?.documentUrl;
      if (frontDoc) {
        media.push({
          url: frontDoc,
          title: `Frente del Documento de Identidad`,
          subtitle: `${name} · ${user.dniDocumentNumber || kyc?.documentNumber || "-"}`,
          type: frontDoc.toLowerCase().includes(".pdf") ? "pdf" : "image",
        });
      }
      const backDoc = kyc?.documentUrlBack;
      if (backDoc) {
        media.push({
          url: backDoc,
          title: `Reverso del Documento de Identidad`,
          subtitle: `${name} · ${user.dniDocumentNumber || kyc?.documentNumber || "-"}`,
          type: backDoc.toLowerCase().includes(".pdf") ? "pdf" : "image",
        });
      }
      const selfie = user.profilePhotoUrl || kyc?.selfieUrl;
      if (selfie) {
        media.push({
          url: selfie,
          title: `Foto de Perfil / Selfie`,
          subtitle: `${name} · Registro biométrico`,
          type: "image",
        });
      }
    }
    return media;
  };

  // --- Estado para Modal de Regularización de Contraseña ---
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<any | null>(null);
  const [regularizeMode, setRegularizeMode] = useState<"email" | "manual">("email");
  const [adminNewPassword, setAdminNewPassword] = useState("");
  const [showAdminNewPassword, setShowAdminNewPassword] = useState(false);
  const [regularizingLoading, setRegularizingLoading] = useState(false);

  // Generador de contraseña aleatoria segura
  const generateRandomPassword = () => {
    const uppers = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lowers = "abcdefghijkmnpqrstuvwxyz";
    const numbers = "23456789";
    const symbols = "!@#$%*?";
    const all = uppers + lowers + numbers + symbols;

    let res = "";
    res += uppers[Math.floor(Math.random() * uppers.length)];
    res += lowers[Math.floor(Math.random() * lowers.length)];
    res += numbers[Math.floor(Math.random() * numbers.length)];
    res += symbols[Math.floor(Math.random() * symbols.length)];
    for (let i = 0; i < 8; i++) {
      res += all[Math.floor(Math.random() * all.length)];
    }
    setAdminNewPassword(res);
  };

  const handleRegularizePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForPassword) return;

    if (regularizeMode === "manual") {
      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_+\-=\[\]\\/])[A-Za-z\d!@#$%^&*(),.?":{}|<>_+\-=\[\]\\/]{8,}$/;
      if (!passwordRegex.test(adminNewPassword)) {
        showToast(
          "Contraseña débil",
          "error",
          "Debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y caracteres especiales.",
        );
        return;
      }
    }

    setRegularizingLoading(true);
    try {
      const payload =
        regularizeMode === "manual"
          ? { newPassword: adminNewPassword }
          : { sendResetEmail: true };
      const res = await adminRegularizePassword(selectedUserForPassword.id, payload);
      showToast(
        "Operación exitosa",
        "success",
        res.message || "Contraseña regularizada con éxito.",
      );
      setSelectedUserForPassword(null);
      setAdminNewPassword("");
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message || err.message || "Error al regularizar contraseña";
      showToast("Error", "error", Array.isArray(errMsg) ? errMsg.join(", ") : errMsg);
    } finally {
      setRegularizingLoading(false);
    }
  };

  // --- Estado para Auditoría KYC ---
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [kycSearch, setKycSearch] = useState("");
  const [kycStatusFilter, setKycStatusFilter] = useState("ALL");
  const [kycRoleFilter, setKycRoleFilter] = useState("ALL");
  const [kycPage, setKycPage] = useState(1);
  const kycPageSize = 8;

  const filteredKycItems = useMemo(() => {
    return items.filter((k) => {
      const q = kycSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        k.user?.email?.toLowerCase().includes(q) ||
        k.user?.name?.toLowerCase().includes(q) ||
        k.fullName?.toLowerCase().includes(q) ||
        k.documentNumber?.toLowerCase().includes(q) ||
        k.businessName?.toLowerCase().includes(q) ||
        k.taxIdRuc?.toLowerCase().includes(q) ||
        k.user?.storeProfile?.businessName?.toLowerCase().includes(q) ||
        k.user?.storeProfile?.ruc?.toLowerCase().includes(q);
      const matchStatus =
        kycStatusFilter === "ALL" || k.status === kycStatusFilter;
      const matchRole =
        kycRoleFilter === "ALL" || k.user?.role === kycRoleFilter;
      return matchSearch && matchStatus && matchRole;
    });
  }, [items, kycSearch, kycStatusFilter, kycRoleFilter]);

  const kycTotalPages = Math.ceil(filteredKycItems.length / kycPageSize) || 1;
  const paginatedKycItems = useMemo(() => {
    const start = (kycPage - 1) * kycPageSize;
    return filteredKycItems.slice(start, start + kycPageSize);
  }, [filteredKycItems, kycPage, kycPageSize]);

  // Estado para modal de observación o rechazo
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<"OBSERVED" | "REJECTED">("OBSERVED");
  const [selectedKyc, setSelectedKyc] = useState<any | null>(null);
  const [observationText, setObservationText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadUsers(userPage);
    loadKyc();
  }, [userPage, userRoleFilter, userStatusFilter]);

  const loadUsers = async (page = userPage) => {
    setUsersLoading(true);
    try {
      const params: any = { page, limit: 15 };
      if (userRoleFilter !== "all") params.role = userRoleFilter;
      if (userStatusFilter !== "all") params.userStatus = userStatusFilter;
      if (userSearch.trim()) params.search = userSearch.trim();

      const res = await fetchAdminUsers(params);
      setUsersList(res.data || []);
      if (res.meta) setUserMeta(res.meta);
    } catch (err: any) {
      showToast("Error al cargar usuarios", "error", err.message);
    } finally {
      setUsersLoading(false);
    }
  };

  const loadKyc = async () => {
    setLoading(true);
    try {
      const data = await fetchKycApplications();
      setItems(data || []);
    } catch (err: any) {
      showToast("Error al cargar expedientes KYC", "error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserActive = async (user: any) => {
    const newActive = !user.isActive;
    const newStatus = newActive ? "ACTIVE" : "SUSPENDED_FRAUD";
    try {
      await updateAdminUserStatus(user.id, {
        isActive: newActive,
        userStatus: newStatus,
      });
      showToast(
        newActive ? "Usuario reactivado exitosamente" : "Usuario suspendido del sistema",
        "success"
      );
      loadUsers(userPage);
    } catch (err: any) {
      showToast("Error al actualizar usuario", "error", err.message);
    }
  };

  const openActionModal = (kyc: any, action: "OBSERVED" | "REJECTED") => {
    setSelectedKyc(kyc);
    setModalAction(action);
    setObservationText("");
    setModalOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedKyc) return;
    if (modalAction === "OBSERVED" && (!observationText || observationText.trim().length < 5)) {
      showToast("Observación requerida", "error", "Ingresa una explicación de al menos 5 caracteres para que el usuario pueda subsanar.");
      return;
    }
    setSubmitting(true);
    try {
      await updateKycStatus(selectedKyc.userId, modalAction, observationText.trim() || undefined);
      showToast(
        modalAction === "OBSERVED"
          ? `Expediente observado (Intento ${Math.min(3, (selectedKyc.retryCount || 0) + 1)}/3)`
          : "Expediente rechazado formalmente",
        "success",
      );
      setModalOpen(false);
      setSelectedKyc(null);
      await Promise.all([loadKyc(), loadUsers(userPage)]);
    } catch (err: any) {
      showToast("Error al procesar expediente", "error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (kyc: any) => {
    try {
      await updateKycStatus(kyc.userId, "APPROVED");
      showToast("Expediente KYC aprobado y cuenta activada", "success");
      await Promise.all([loadKyc(), loadUsers(userPage)]);
    } catch (err: any) {
      showToast("Error al aprobar expediente KYC", "error", err.message);
    }
  };

  const handleUserKycDecision = async (status: "APPROVED" | "OBSERVED" | "REJECTED") => {
    if (!selectedUserForKyc) return;
    if (status === "OBSERVED" && (!userKycObservation || userKycObservation.trim().length < 5)) {
      showToast(
        "Observación requerida",
        "error",
        "Ingresa una explicación detallada de al menos 5 caracteres para que el usuario pueda subsanar sus documentos.",
      );
      return;
    }

    setUserKycSubmitting(true);
    try {
      await updateKycStatus(selectedUserForKyc.id, status, userKycObservation.trim() || undefined);
      showToast(
        status === "APPROVED"
          ? (selectedUserForKyc.role === "TIENDA"
              ? "Comercio verificado exitosamente. Ya puede operar con LIVO."
              : "Usuario verificado exitosamente en la red.")
          : status === "OBSERVED"
          ? "Expediente puesto en estado OBSERVADO."
          : "Expediente RECHAZADO formalmente.",
        "success",
      );
      setSelectedUserForKyc(null);
      setUserKycObservation("");
      await Promise.all([loadUsers(userPage), loadKyc()]);
    } catch (err: any) {
      showToast("Error al procesar dictamen KYC", "error", err.message);
    } finally {
      setUserKycSubmitting(false);
    }
  };

  const pendingCount = items.filter((x) => x.status === "PENDING" || x.status === "IN_REVIEW").length;
  const observedCount = items.filter((x) => x.status === "OBSERVED").length;
  const approvedCount = items.filter((x) => x.status === "APPROVED").length;
  const rejectedCount = items.filter((x) => x.status === "REJECTED").length;

  return (
    <>
      <ToastContainer />
      <PageHead
        eyebrow="Gobernanza y Cumplimiento"
        title="Gestión de Usuarios y KYC"
        description="Directorio unificado de usuarios registrados, estados operativos y auditoría legal de expedientes para la red Livora."
        action={
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => { loadUsers(userPage); loadKyc(); }}
              className="btn secondary"
              style={{ fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <RefreshCw size={13} />
              <span>Refrescar</span>
            </button>
          </div>
        }
      />

      {/* Selector de Pestañas */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 24,
          background: "var(--panel2, #f1f5f9)",
          padding: 6,
          borderRadius: 12,
          width: "fit-content",
          border: "1px solid var(--line, #e2e8f0)",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("users")}
          style={{
            padding: "8px 18px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 700,
            background: activeTab === "users" ? "var(--panel, #ffffff)" : "transparent",
            color: activeTab === "users" ? "var(--text, #0f172a)" : "var(--muted, #64748b)",
            boxShadow: activeTab === "users" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            transition: "all 0.15s ease",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Users size={15} />
          <span>Directorio de Usuarios ({userMeta.total})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("kyc")}
          style={{
            padding: "8px 18px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 700,
            background: activeTab === "kyc" ? "var(--panel, #ffffff)" : "transparent",
            color: activeTab === "kyc" ? "var(--text, #0f172a)" : "var(--muted, #64748b)",
            boxShadow: activeTab === "kyc" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            transition: "all 0.15s ease",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <ShieldCheck size={15} />
          <span>Auditoría KYC</span>
          {pendingCount > 0 && (
            <span style={{ background: "var(--amber)", color: "#000", padding: "1px 6px", borderRadius: 10, fontSize: 11, marginLeft: 2 }}>
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {activeTab === "users" ? (
        <>
          {/* Barra de Filtros para Directorio */}
          <div className="toolbar" style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginBottom: 16 }}>
            <div className="search" style={{ flex: "1 1 280px" }}>
              <input
                placeholder="Buscar por nombre, email o teléfono..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadUsers(1)}
              />
            </div>
            <select
              value={userRoleFilter}
              onChange={(e) => {
                setUserRoleFilter(e.target.value);
                setUserPage(1);
              }}
              style={{ width: "auto", minWidth: 160 }}
            >
              <option value="all">Todos los roles</option>
              <option value="HOGAR">HOGAR</option>
              <option value="RECOLECTOR">RECOLECTOR</option>
              <option value="CENTRO_ACOPIO">CENTRO DE ACOPIO</option>
              <option value="EMPRESA_B2B">EMPRESA B2B</option>
              <option value="TIENDA">TIENDA COMERCIAL</option>
              <option value="ADMIN">ADMINISTRADOR</option>
            </select>
            <select
              value={userStatusFilter}
              onChange={(e) => {
                setUserStatusFilter(e.target.value);
                setUserPage(1);
              }}
              style={{ width: "auto", minWidth: 160 }}
            >
              <option value="all">Todos los estados</option>
              <option value="ACTIVE">ACTIVE (Activo)</option>
              <option value="PENDING_VERIFICATION">PENDING_VERIFICATION</option>
              <option value="SUSPENDED">SUSPENDED (Suspendido)</option>
              <option value="BANNED">BANNED (Bloqueado)</option>
            </select>
            <button onClick={() => loadUsers(1)} className="btn primary" style={{ fontSize: 12, padding: "8px 14px" }}>
              Buscar
            </button>
          </div>

          <section className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="table-wrap">
              <table className="table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "var(--panel2)", borderBottom: "1px solid var(--line)", textAlign: "left" }}>
                    <th style={{ padding: "12px 16px", fontWeight: 700 }}>Usuario</th>
                    <th style={{ padding: "12px 16px", fontWeight: 700 }}>Rol del Ecosistema</th>
                    <th style={{ padding: "12px 16px", fontWeight: 700 }}>Billetera Stellar</th>
                    <th style={{ padding: "12px 16px", fontWeight: 700 }}>Estado Cuenta</th>
                    <th style={{ padding: "12px 16px", fontWeight: 700 }}>Estado KYC</th>
                    <th style={{ padding: "12px 16px", fontWeight: 700 }}>Actividad Registrada</th>
                    <th style={{ padding: "12px 16px", fontWeight: 700 }}>Fecha Registro</th>
                    <th style={{ padding: "12px 16px", fontWeight: 700, textAlign: "right" }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {usersLoading ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
                        Cargando directorio de usuarios...
                      </td>
                    </tr>
                  ) : usersList.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
                        No se encontraron usuarios para los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    usersList.map((u) => (
                      <tr key={u.id} style={{ borderBottom: "1px solid var(--line)" }}>
                        <td style={{ padding: "14px 16px" }}>
                          <strong style={{ display: "block" }}>{u.name || "Sin nombre"}</strong>
                          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{u.email}</div>
                          {u.phone && <div style={{ fontSize: 11, color: "var(--muted)" }}>Tel: {u.phone}</div>}
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span
                            style={{
                              display: "inline-block",
                              fontSize: 10,
                              fontWeight: 700,
                              textTransform: "uppercase",
                              padding: "3px 8px",
                              borderRadius: 6,
                              background: "rgba(5, 150, 105, 0.1)",
                              color: "var(--green)",
                              border: "1px solid rgba(5, 150, 105, 0.2)",
                            }}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          {u.walletAddress ? (
                            <span className="mono" style={{ fontSize: 11, color: "var(--blue)" }}>
                              {u.walletAddress.slice(0, 6)}…{u.walletAddress.slice(-4)}
                            </span>
                          ) : (
                            <span style={{ fontSize: 11, color: "var(--muted)" }}>Custodia en servidor</span>
                          )}
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span
                            style={{
                              display: "inline-block",
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "3px 8px",
                              borderRadius: 6,
                              background: u.isActive
                                ? "rgba(16, 185, 129, 0.1)"
                                : "rgba(244, 63, 94, 0.1)",
                              color: u.isActive ? "#10B981" : "#F43F5E",
                            }}
                          >
                            {u.isActive ? "ACTIVO" : "SUSPENDIDO"}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <KycStatusBadge status={u.kycStatus || u.kycApplications?.[0]?.status} />
                          {u.role === "TIENDA" && u.storeProfile?.businessName && (
                            <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 4, fontWeight: 600 }}>
                              {u.storeProfile.businessName}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: "14px 16px", fontSize: 11, color: "var(--muted)" }}>
                          {u._count ? (
                            <div>
                              <div>Lotes: {u._count.collectorBatches || 0}</div>
                              <div>Solicitudes: {(u._count.householdRequests || 0) + (u._count.collectorRequests || 0)}</div>
                            </div>
                          ) : "—"}
                        </td>
                        <td style={{ padding: "14px 16px", fontSize: 12, color: "var(--muted)" }}>
                          {date(u.createdAt)}
                        </td>
                        <td style={{ padding: "14px 16px", textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                            {(u.role === "TIENDA" || u.role === "RECOLECTOR" || u.role === "HOGAR") && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedUserForKyc(u);
                                  setUserKycObservation("");
                                }}
                                className="btn"
                                style={{
                                  fontSize: 11,
                                  padding: "4px 8px",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  background: (u.kycStatus === "APPROVED" || u.kycApplications?.[0]?.status === "APPROVED")
                                    ? "rgba(16, 185, 129, 0.1)"
                                    : "rgba(5, 150, 105, 0.9)",
                                  color: (u.kycStatus === "APPROVED" || u.kycApplications?.[0]?.status === "APPROVED")
                                    ? "#10B981"
                                    : "#ffffff",
                                  border: (u.kycStatus === "APPROVED" || u.kycApplications?.[0]?.status === "APPROVED")
                                    ? "1px solid rgba(16, 185, 129, 0.3)"
                                    : "1px solid var(--green)",
                                  fontWeight: 600,
                                }}
                                title="Auditar y validar expediente KYC"
                              >
                                <ShieldCheck size={12} />
                                <span>{(u.kycStatus === "APPROVED" || u.kycApplications?.[0]?.status === "APPROVED") ? "Verificado" : "Validar / Auditar"}</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedUserForPassword(u);
                                setRegularizeMode("email");
                                setAdminNewPassword("");
                              }}
                              className="btn secondary"
                              style={{
                                fontSize: 11,
                                padding: "4px 8px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                              title="Regularizar contraseña del usuario"
                            >
                              <KeyRound size={12} color="var(--green)" />
                              <span>Contraseña</span>
                            </button>
                            {u.role === "ADMIN" ? (
                              <span
                                style={{
                                  fontSize: 11,
                                  color: "var(--muted)",
                                  padding: "4px 8px",
                                  fontStyle: "italic",
                                }}
                              >
                                Admin
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleToggleUserActive(u)}
                                className="btn ghost"
                                style={{
                                  fontSize: 11,
                                  padding: "4px 8px",
                                  color: u.isActive ? "#F43F5E" : "var(--green)",
                                  borderColor: u.isActive ? "rgba(244,63,94,0.3)" : "rgba(5,150,105,0.3)",
                                }}
                              >
                                {u.isActive ? "Suspender" : "Reactivar"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Paginación de Usuarios */}
          {userMeta.totalPages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 20,
                padding: "14px 18px",
                background: "var(--panel)",
                borderRadius: 12,
                border: "1px solid var(--line)",
              }}
            >
              <div style={{ fontSize: 12, color: "var(--muted)" }}>
                Página <strong>{userMeta.page}</strong> de <strong>{userMeta.totalPages}</strong> ({userMeta.total} usuarios registrados)
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                  disabled={!userMeta.hasPrevPage || usersLoading}
                  className="btn secondary"
                  style={{ fontSize: 12, padding: "6px 12px", opacity: !userMeta.hasPrevPage || usersLoading ? 0.5 : 1 }}
                >
                  ← Anterior
                </button>
                <button
                  onClick={() => setUserPage((p) => p + 1)}
                  disabled={!userMeta.hasNextPage || usersLoading}
                  className="btn secondary"
                  style={{ fontSize: 12, padding: "6px 12px", opacity: !userMeta.hasNextPage || usersLoading ? 0.5 : 1 }}
                >
                  Siguiente →
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Pestaña de Auditoría KYC */
        <>
          {loading ? (
            <KycSkeleton />
          ) : (
            <>
              <div className="grid kpis" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
                <div className="card kpi">
                  <div className="kpi-label">POR REVISAR</div>
                  <div className="kpi-value">{pendingCount}</div>
                  <div className="trend">Pendientes / En cola</div>
                </div>
                <div className="card kpi">
                  <div className="kpi-label">OBSERVADOS</div>
                  <div className="kpi-value" style={{ color: "#F59E0B" }}>{observedCount}</div>
                  <div className="trend">En subsanación (máx. 3 intentos)</div>
                </div>
                <div className="card kpi">
                  <div className="kpi-label">VERIFICADOS</div>
                  <div className="kpi-value" style={{ color: "#10B981" }}>{approvedCount}</div>
                  <div className="trend">Habilitados en la red</div>
                </div>
                <div className="card kpi">
                  <div className="kpi-label">RECHAZADOS</div>
                  <div className="kpi-value" style={{ color: "#F43F5E" }}>{rejectedCount}</div>
                  <div className="trend">Inhabilitados</div>
                </div>
              </div>

              <section className="card" style={{ marginTop: 24, padding: 0, overflow: "hidden" }}>
                <div
                  className="section-title"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 12,
                    padding: "16px 20px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <h2 style={{ margin: 0, fontSize: 16 }}>Expedientes Registrados ({filteredKycItems.length})</h2>
                    <span className="live">En tiempo real</span>
                  </div>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <div style={{ position: "relative" }}>
                      <Search
                        size={14}
                        style={{
                          position: "absolute",
                          left: 10,
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "var(--muted, #64748b)",
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Buscar por nombre, email o DNI..."
                        value={kycSearch}
                        onChange={(e) => {
                          setKycSearch(e.target.value);
                          setKycPage(1);
                        }}
                        style={{
                          paddingLeft: 30,
                          paddingRight: 10,
                          paddingTop: 5,
                          paddingBottom: 5,
                          fontSize: 12,
                          borderRadius: 8,
                          border: "1px solid var(--line, #cbd5e1)",
                          background: "var(--bg, #f8fafc)",
                          color: "var(--text, #0f172a)",
                          minWidth: 220,
                        }}
                      />
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Filter size={14} style={{ color: "var(--muted, #64748b)" }} />
                      <select
                        value={kycStatusFilter}
                        onChange={(e) => {
                          setKycStatusFilter(e.target.value);
                          setKycPage(1);
                        }}
                        style={{
                          padding: "5px 10px",
                          fontSize: 12,
                          borderRadius: 8,
                          border: "1px solid var(--line, #cbd5e1)",
                          background: "var(--bg, #f8fafc)",
                          color: "var(--text, #0f172a)",
                        }}
                      >
                        <option value="ALL">Todos los estados</option>
                        <option value="PENDING">Pendientes</option>
                        <option value="OBSERVED">Observados</option>
                        <option value="APPROVED">Aprobados</option>
                        <option value="REJECTED">Rechazados</option>
                      </select>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Users size={14} style={{ color: "var(--muted, #64748b)" }} />
                      <select
                        value={kycRoleFilter}
                        onChange={(e) => {
                          setKycRoleFilter(e.target.value);
                          setKycPage(1);
                        }}
                        style={{
                          padding: "5px 10px",
                          fontSize: 12,
                          borderRadius: 8,
                          border: "1px solid var(--line, #cbd5e1)",
                          background: "var(--bg, #f8fafc)",
                          color: "var(--text, #0f172a)",
                        }}
                      >
                        <option value="ALL">Todos los roles</option>
                        <option value="TIENDA">Tiendas Comerciales</option>
                        <option value="RECOLECTOR">Recolectores</option>
                        <option value="HOGAR">Hogares</option>
                      </select>
                    </div>
                  </div>
                </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>USUARIO / ROL</th>
                    <th>DATOS DE IDENTIFICACIÓN</th>
                    <th>VEHÍCULO / COMERCIO</th>
                    <th>DOCUMENTOS</th>
                    <th>ESTADO Y REINTENTOS</th>
                    <th>ACCIÓN AUDITORA</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredKycItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", color: "#94A3B8", padding: 40 }}>
                        <div>
                          {kycSearch || kycStatusFilter !== "ALL" || kycRoleFilter !== "ALL"
                            ? "No hay expedientes que coincidan con los filtros aplicados."
                            : "No hay expedientes KYC registrados en el sistema."}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedKycItems.map((k) => (
                      <tr key={k.id}>
                        <td>
                          <strong>{k.user?.name || k.user?.email || "—"}</strong>
                          <div className="mono" style={{ fontSize: 11, color: "var(--muted, #94a3b8)", marginTop: 2 }}>
                            {k.user?.email}
                          </div>
                          <div style={{ marginTop: 4 }}>
                            <span
                              style={{
                                display: "inline-block",
                                fontSize: 10,
                                fontWeight: 600,
                                textTransform: "uppercase",
                                padding: "2px 6px",
                                borderRadius: 4,
                                background: "rgba(59, 130, 246, 0.15)",
                                color: "#60A5FA",
                                border: "1px solid rgba(59, 130, 246, 0.3)",
                              }}
                            >
                              {k.user?.role || "USUARIO"}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: 12 }}>
                            {k.documentType || "DNI"}: <strong>{k.documentNumber || "—"}</strong>
                          </div>
                          {k.taxIdRuc && (
                            <div style={{ fontSize: 11, color: "var(--muted, #94a3b8)", marginTop: 2 }}>
                              RUC: {k.taxIdRuc}
                            </div>
                          )}
                          {k.businessName && (
                            <div style={{ fontSize: 11, color: "var(--muted, #94a3b8)" }}>
                              Razón Social: {k.businessName}
                            </div>
                          )}
                        </td>
                        <td>
                          {k.user?.role === "RECOLECTOR" ? (
                            <div style={{ fontSize: 11 }}>
                              <div>Transporte: <strong>{k.transportType || "A pie / Manual"}</strong></div>
                              {k.vehiclePlate && <div>Placa: <strong className="mono">{k.vehiclePlate}</strong></div>}
                              {k.associationName && <div style={{ color: "var(--muted, #94a3b8)" }}>Asoc: {k.associationName}</div>}
                            </div>
                          ) : k.user?.role === "TIENDA" ? (
                            <div style={{ fontSize: 11 }}>
                              <div>Comercio: <strong>{k.businessName || k.user?.storeProfile?.businessName || "Tienda Aliada"}</strong></div>
                              {k.taxIdRuc && <div>RUC: <strong className="mono">{k.taxIdRuc}</strong></div>}
                              {k.bankCci && <div>CCI: <span className="mono">{k.bankCci}</span></div>}
                              {k.user?.storeProfile?.address && (
                                <div style={{ color: "var(--muted, #94a3b8)", marginTop: 2 }}>
                                  Dir: {k.user.storeProfile.address}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div style={{ fontSize: 11, color: "var(--muted, #94a3b8)" }}>
                              {k.bankCci ? `CCI: ${k.bankCci}` : "—"}
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            {k.user?.role === "TIENDA" ? (
                              k.documentUrl ? (
                                <button
                                  type="button"
                                  onClick={() => openMediaViewer(getKycMediaItems(k), 0)}
                                  className="btn"
                                  style={{
                                    fontSize: 11,
                                    padding: "4px 8px",
                                    textAlign: "center",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 5,
                                    justifyContent: "center",
                                    background: "rgba(5, 150, 105, 0.12)",
                                    color: "var(--green)",
                                    borderColor: "rgba(5, 150, 105, 0.35)",
                                    cursor: "pointer",
                                  }}
                                >
                                  <Building2 size={12} />
                                  <span>Fachada del Local</span>
                                  <Eye size={11} />
                                </button>
                              ) : (
                                <span style={{ fontSize: 11, color: "var(--muted)" }}>Sin foto de fachada</span>
                              )
                            ) : (
                              <>
                                {k.documentUrl && (
                                  <button
                                    type="button"
                                    onClick={() => openMediaViewer(getKycMediaItems(k), 0)}
                                    className="btn"
                                    style={{
                                      fontSize: 11,
                                      padding: "3px 8px",
                                      textAlign: "center",
                                      cursor: "pointer",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 4,
                                      justifyContent: "center",
                                    }}
                                  >
                                    <FileText size={11} />
                                    <span>Frente documento</span>
                                  </button>
                                )}
                                {k.documentUrlBack && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const items = getKycMediaItems(k);
                                      const idx = items.findIndex((i) => i.url === k.documentUrlBack);
                                      openMediaViewer(items, idx >= 0 ? idx : 0);
                                    }}
                                    className="btn"
                                    style={{
                                      fontSize: 11,
                                      padding: "3px 8px",
                                      textAlign: "center",
                                      cursor: "pointer",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 4,
                                      justifyContent: "center",
                                    }}
                                  >
                                    <FileText size={11} />
                                    <span>Reverso documento</span>
                                  </button>
                                )}
                                {k.selfieUrl && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const items = getKycMediaItems(k);
                                      const idx = items.findIndex((i) => i.url === k.selfieUrl);
                                      openMediaViewer(items, idx >= 0 ? idx : 0);
                                    }}
                                    className="btn"
                                    style={{
                                      fontSize: 11,
                                      padding: "3px 8px",
                                      textAlign: "center",
                                      cursor: "pointer",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 4,
                                      justifyContent: "center",
                                    }}
                                  >
                                    <Users size={11} />
                                    <span>Foto de perfil / Selfie</span>
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                        <td>
                          <Status value={k.status} />
                          <div style={{ fontSize: 11, color: "var(--muted, #94a3b8)", marginTop: 4 }}>
                            Reintentos: <strong>{k.retryCount || 0}/3</strong>
                          </div>
                          {k.observationNotes && (
                            <div
                              style={{
                                fontSize: 11,
                                color: "#F59E0B",
                                marginTop: 4,
                                maxWidth: 180,
                                background: "rgba(245, 158, 11, 0.1)",
                                padding: "4px 6px",
                                borderRadius: 4,
                              }}
                            >
                              Nota: {k.observationNotes}
                            </div>
                          )}
                        </td>
                        <td>
                          {k.status === "PENDING" || k.status === "IN_REVIEW" || k.status === "OBSERVED" ? (
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                              <button
                                className="btn primary"
                                onClick={() => handleApprove(k)}
                                style={{ fontSize: 11, padding: "4px 8px" }}
                              >
                                Aprobar
                              </button>
                              <button
                                className="btn"
                                onClick={() => openActionModal(k, "OBSERVED")}
                                style={{
                                  fontSize: 11,
                                  padding: "4px 8px",
                                  borderColor: "#F59E0B",
                                  color: "#F59E0B",
                                }}
                              >
                                Observar
                              </button>
                              <button
                                className="btn"
                                onClick={() => openActionModal(k, "REJECTED")}
                                style={{
                                  fontSize: 11,
                                  padding: "4px 8px",
                                  borderColor: "#F43F5E",
                                  color: "#F43F5E",
                                }}
                              >
                                Rechazar
                              </button>
                            </div>
                          ) : (
                            <span className="muted" style={{ fontSize: 11 }}>
                              Dictamen final ({date(k.updatedAt)})
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {kycTotalPages > 1 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "14px 20px",
                  borderTop: "1px solid var(--line, #e2e8f0)",
                  background: "var(--panel2, #f8fafc)",
                  fontSize: 12,
                }}
              >
                <div style={{ color: "var(--muted, #64748b)" }}>
                  Página <strong>{kycPage}</strong> de <strong>{kycTotalPages}</strong> ({filteredKycItems.length} expedientes)
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => setKycPage((p) => Math.max(1, p - 1))}
                    disabled={kycPage === 1}
                    className="btn secondary"
                    style={{ fontSize: 12, padding: "5px 12px" }}
                  >
                    ← Anterior
                  </button>
                  <button
                    onClick={() => setKycPage((p) => Math.min(kycTotalPages, p + 1))}
                    disabled={kycPage === kycTotalPages}
                    className="btn secondary"
                    style={{ fontSize: 12, padding: "5px 12px" }}
                  >
                    Siguiente →
                  </button>
                </div>
              </div>
            )}
          </section>
        </>
      )}
        </>
      )}

      {/* Modal para Observación o Rechazo */}
      {modalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: 480,
              background: "var(--panel)",
              border: "1px solid var(--line)",
              borderRadius: 16,
              boxShadow: "var(--card-shadow)",
              padding: 24,
            }}
          >
            <h3 style={{ margin: "0 0 8px 0", fontSize: 18, color: "var(--text)" }}>
              {modalAction === "OBSERVED" ? "Observar Expediente KYC" : "Rechazar Expediente KYC"}
            </h3>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
              {modalAction === "OBSERVED"
                ? `El usuario ${selectedKyc?.user?.name || selectedKyc?.user?.email} recibirá una notificación con tus observaciones y podrá corregir sus documentos (Intento actual: ${selectedKyc?.retryCount || 0}/3).`
                : `El usuario ${selectedKyc?.user?.name || selectedKyc?.user?.email} quedará inhabilitado para operar con el rol solicitado.`}
            </p>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>
                Motivo / Instrucciones de subsanación:
              </label>
              <textarea
                value={observationText}
                onChange={(e) => setObservationText(e.target.value)}
                placeholder={
                  modalAction === "OBSERVED"
                    ? "Ej: Foto del documento borrosa en el reverso. Subir captura nítida con buena iluminación."
                    : "Ej: Documentación no corresponde al titular o documento apócrifo detectado."
                }
                rows={4}
                style={{
                  width: "100%",
                  background: "var(--input-bg)",
                  border: "1px solid var(--line)",
                  borderRadius: 10,
                  color: "var(--input-color)",
                  padding: 12,
                  fontSize: 13,
                  outline: "none",
                  resize: "vertical",
                }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button
                className="btn"
                disabled={submitting}
                onClick={() => {
                  setModalOpen(false);
                  setSelectedKyc(null);
                }}
                style={{
                  background: "var(--panel2)",
                  border: "1px solid var(--line)",
                  color: "var(--text)",
                }}
              >
                Cancelar
              </button>
              <button
                className="btn"
                disabled={submitting}
                onClick={handleConfirmAction}
                style={{
                  background: modalAction === "OBSERVED" ? "var(--amber)" : "var(--red)",
                  color: "#FFF",
                  borderColor: "transparent",
                  fontWeight: 600,
                }}
              >
                {submitting ? "Guardando..." : modalAction === "OBSERVED" ? "Confirmar observación" : "Confirmar rechazo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Regularización de Contraseña de Usuario */}
      {selectedUserForPassword && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 16,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !regularizingLoading) {
              setSelectedUserForPassword(null);
            }
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: 500,
              background: "var(--panel)",
              borderRadius: 16,
              border: "1px solid var(--line)",
              padding: 24,
              boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
              position: "relative",
            }}
          >
            {/* Header del Modal */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: "rgba(16, 185, 129, 0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--green)",
                  }}
                >
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "var(--text)" }}>
                    Regularizar Contraseña
                  </h3>
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>
                    Gestión de credenciales administrativas
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserForPassword(null)}
                disabled={regularizingLoading}
                aria-label="Cerrar modal"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--muted)",
                  cursor: "pointer",
                  padding: 4,
                  display: "flex",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Ficha del Usuario */}
            <div
              style={{
                padding: "10px 14px",
                background: "var(--panel2)",
                borderRadius: 10,
                border: "1px solid var(--line)",
                marginBottom: 16,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: 12,
              }}
            >
              <div>
                <strong style={{ color: "var(--text)", display: "block" }}>
                  {selectedUserForPassword.name || "Sin nombre registrado"}
                </strong>
                <span style={{ color: "var(--muted)" }}>{selectedUserForPassword.email}</span>
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: 6,
                  background: "rgba(16, 185, 129, 0.1)",
                  color: "var(--green)",
                }}
              >
                {selectedUserForPassword.role}
              </span>
            </div>

            {/* Selector de Modo (Tabs) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
                marginBottom: 20,
              }}
            >
              <button
                type="button"
                onClick={() => setRegularizeMode("email")}
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  border: regularizeMode === "email" ? "2px solid var(--green)" : "1px solid var(--line)",
                  background: regularizeMode === "email" ? "rgba(16, 185, 129, 0.1)" : "transparent",
                  color: regularizeMode === "email" ? "var(--green)" : "var(--muted)",
                  transition: "all 0.15s ease",
                }}
              >
                <Mail size={14} />
                <span>Enviar Correo</span>
              </button>
              <button
                type="button"
                onClick={() => setRegularizeMode("manual")}
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  border: regularizeMode === "manual" ? "2px solid var(--green)" : "1px solid var(--line)",
                  background: regularizeMode === "manual" ? "rgba(16, 185, 129, 0.1)" : "transparent",
                  color: regularizeMode === "manual" ? "var(--green)" : "var(--muted)",
                  transition: "all 0.15s ease",
                }}
              >
                <Lock size={14} />
                <span>Asignar Manualmente</span>
              </button>
            </div>

            {/* Contenido según el modo */}
            <form onSubmit={handleRegularizePassword}>
              {regularizeMode === "email" ? (
                <div>
                  <div
                    style={{
                      padding: 14,
                      background: "rgba(16, 185, 129, 0.05)",
                      borderRadius: 10,
                      border: "1px solid rgba(16, 185, 129, 0.2)",
                      marginBottom: 20,
                    }}
                  >
                    <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "var(--text)" }}>
                      Se generará un token único con 1 hora de vigencia y se despachará un correo oficial de recuperación a <strong>{selectedUserForPassword.email}</strong>.
                    </p>
                    <p style={{ margin: "8px 0 0", fontSize: 12, lineHeight: 1.5, color: "var(--muted)" }}>
                      El usuario abrirá el enlace en su navegador para registrar su nueva contraseña. Al finalizar, el sistema le informará que ya puede cerrar esa pestaña y regresar a la aplicación o iniciar sesión en la web.
                    </p>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                    <button
                      type="button"
                      className="btn secondary"
                      disabled={regularizingLoading}
                      onClick={() => setSelectedUserForPassword(null)}
                      style={{ padding: "10px 16px", fontSize: 13 }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={regularizingLoading}
                      style={{
                        background: "var(--green)",
                        color: "#06110d",
                        border: "none",
                        padding: "10px 18px",
                        borderRadius: 10,
                        fontSize: 13,
                        fontWeight: 800,
                        cursor: regularizingLoading ? "not-allowed" : "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        opacity: regularizingLoading ? 0.7 : 1,
                      }}
                    >
                      <Mail size={15} />
                      <span>{regularizingLoading ? "Enviando correo..." : "Enviar Correo de Recuperación"}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>
                        Nueva Contraseña:
                      </label>
                      <button
                        type="button"
                        onClick={generateRandomPassword}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "var(--green)",
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Sparkles size={12} />
                        <span>Generar segura</span>
                      </button>
                    </div>

                    <div style={{ position: "relative" }}>
                      <input
                        type={showAdminNewPassword ? "text" : "password"}
                        value={adminNewPassword}
                        onChange={(e) => setAdminNewPassword(e.target.value)}
                        placeholder="Mínimo 8 caracteres (A-Z, a-z, 0-9, símbolos)"
                        required
                        style={{
                          width: "100%",
                          background: "var(--input-bg)",
                          border: "1px solid var(--line)",
                          borderRadius: 10,
                          color: "var(--input-color)",
                          padding: "10px 40px 10px 12px",
                          fontSize: 13,
                          outline: "none",
                          fontFamily: showAdminNewPassword ? "monospace" : "inherit",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminNewPassword(!showAdminNewPassword)}
                        aria-label="Alternar visibilidad"
                        style={{
                          position: "absolute",
                          right: 10,
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "transparent",
                          border: "none",
                          color: "var(--muted)",
                          cursor: "pointer",
                          padding: 4,
                          display: "flex",
                        }}
                      >
                        {showAdminNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <span style={{ display: "block", fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
                      Asigna esta clave y comunícasela al usuario por un canal seguro (teléfono, en persona).
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
                    <button
                      type="button"
                      className="btn secondary"
                      disabled={regularizingLoading}
                      onClick={() => setSelectedUserForPassword(null)}
                      style={{ padding: "10px 16px", fontSize: 13 }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={regularizingLoading || !adminNewPassword}
                      style={{
                        background: "var(--green)",
                        color: "#06110d",
                        border: "none",
                        padding: "10px 18px",
                        borderRadius: 10,
                        fontSize: 13,
                        fontWeight: 800,
                        cursor: regularizingLoading || !adminNewPassword ? "not-allowed" : "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        opacity: regularizingLoading || !adminNewPassword ? 0.6 : 1,
                      }}
                    >
                      <Lock size={15} />
                      <span>{regularizingLoading ? "Guardando..." : "Asignar Contraseña"}</span>
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Modal de Auditoría KYC Directa desde Directorio */}
      {selectedUserForKyc && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: 580,
              maxHeight: "90vh",
              overflowY: "auto",
              background: "var(--panel)",
              border: "1px solid var(--line)",
              borderRadius: 16,
              boxShadow: "var(--card-shadow)",
              padding: 24,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <ShieldCheck size={20} color="var(--green)" />
                  <h3 style={{ margin: 0, fontSize: 18, color: "var(--text)" }}>
                    Auditoría de Expediente KYC
                  </h3>
                </div>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>
                  Revisión regulatoria de identidad y antecedentes para la red Livora
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserForKyc(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--muted)",
                  cursor: "pointer",
                  padding: 4,
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Ficha Resumen del Usuario */}
            <div
              style={{
                background: "var(--panel2, #f8fafc)",
                border: "1px solid var(--line)",
                borderRadius: 12,
                padding: 14,
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div>
                  <strong style={{ fontSize: 14, color: "var(--text)" }}>
                    {selectedUserForKyc.name || selectedUserForKyc.email}
                  </strong>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                    {selectedUserForKyc.email}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      padding: "3px 8px",
                      borderRadius: 6,
                      background: "rgba(5, 150, 105, 0.1)",
                      color: "var(--green)",
                      border: "1px solid rgba(5, 150, 105, 0.2)",
                    }}
                  >
                    {selectedUserForKyc.role}
                  </span>
                  <div style={{ marginTop: 4 }}>
                    <KycStatusBadge status={selectedUserForKyc.kycStatus || selectedUserForKyc.kycApplications?.[0]?.status} />
                  </div>
                </div>
              </div>

              {/* Datos Específicos para Tienda */}
              {selectedUserForKyc.role === "TIENDA" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12, marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--line)" }}>
                  <div>
                    <span style={{ color: "var(--muted)", display: "block", fontSize: 11 }}>Razón Social / Nombre:</span>
                    <strong>{selectedUserForKyc.storeProfile?.businessName || selectedUserForKyc.name || "Sin nombre registrado"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--muted)", display: "block", fontSize: 11 }}>RUC:</span>
                    <strong className="mono">{selectedUserForKyc.storeProfile?.ruc || selectedUserForKyc.kycApplications?.[0]?.taxIdRuc || "Sin RUC"}</strong>
                  </div>
                  <div style={{ gridColumn: "span 2" }}>
                    <span style={{ color: "var(--muted)", display: "block", fontSize: 11 }}>Dirección Física Comercial:</span>
                    <span>{selectedUserForKyc.storeProfile?.address || selectedUserForKyc.address || "Sin dirección registrada"}</span>
                  </div>
                  <div style={{ gridColumn: "span 2" }}>
                    <span style={{ color: "var(--muted)", display: "block", fontSize: 11 }}>Cuenta Interbancaria (CCI):</span>
                    <span className="mono">{selectedUserForKyc.storeProfile?.bankAccount || selectedUserForKyc.kycApplications?.[0]?.bankCci || "Sin CCI registrado"}</span>
                  </div>
                </div>
              )}

              {/* Datos Específicos para Recolector */}
              {selectedUserForKyc.role === "RECOLECTOR" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12, marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--line)" }}>
                  <div>
                    <span style={{ color: "var(--muted)", display: "block", fontSize: 11 }}>Documento DNI/CE:</span>
                    <strong className="mono">{selectedUserForKyc.dniDocumentNumber || selectedUserForKyc.kycApplications?.[0]?.documentNumber || "No especificado"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--muted)", display: "block", fontSize: 11 }}>Vehículo / Transporte:</span>
                    <strong>{selectedUserForKyc.kycApplications?.[0]?.transportType || "Manual"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--muted)", display: "block", fontSize: 11 }}>Placa de Vehículo:</span>
                    <strong className="mono">{selectedUserForKyc.kycApplications?.[0]?.vehiclePlate || "N/A"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--muted)", display: "block", fontSize: 11 }}>Asociación de Recicladores:</span>
                    <span>{selectedUserForKyc.kycApplications?.[0]?.associationName || "Independiente"}</span>
                  </div>
                </div>
              )}

              {/* Datos Específicos para Hogar */}
              {selectedUserForKyc.role === "HOGAR" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12, marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--line)" }}>
                  <div>
                    <span style={{ color: "var(--muted)", display: "block", fontSize: 11 }}>Documento de Identidad:</span>
                    <strong className="mono">{selectedUserForKyc.dniDocumentNumber || selectedUserForKyc.kycApplications?.[0]?.documentNumber || "No especificado"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--muted)", display: "block", fontSize: 11 }}>Dirección Residencial:</span>
                    <span>{selectedUserForKyc.address || "Sin dirección registrada"}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Documentos y Evidencia Fotográfica */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
                Evidencia Documental Registrada
              </label>

              {selectedUserForKyc.role === "TIENDA" && (
                selectedUserForKyc.storeProfile?.logoUrl || selectedUserForKyc.kycApplications?.[0]?.documentUrl ? (
                  <div style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 12, background: "var(--panel2)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>Fotografía de la Fachada Comercial:</span>
                      <button
                        type="button"
                        onClick={() => openMediaViewer(getUserKycMediaItems(selectedUserForKyc), 0)}
                        className="btn secondary"
                        style={{ fontSize: 11, padding: "4px 10px", display: "inline-flex", alignItems: "center", gap: 5, cursor: "pointer" }}
                      >
                        <ZoomIn size={12} />
                        <span>Inspeccionar en Visor Seguro</span>
                      </button>
                    </div>
                    <div
                      onClick={() => openMediaViewer(getUserKycMediaItems(selectedUserForKyc), 0)}
                      style={{
                        position: "relative",
                        borderRadius: 8,
                        overflow: "hidden",
                        border: "1px solid var(--line)",
                        cursor: "pointer",
                        background: "rgba(0, 0, 0, 0.2)",
                        maxHeight: 220,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                      title="Haz clic para ampliar con zoom y rotación"
                    >
                      <img
                        src={selectedUserForKyc.storeProfile?.logoUrl || selectedUserForKyc.kycApplications?.[0]?.documentUrl}
                        alt="Fachada de la tienda"
                        style={{
                          width: "100%",
                          maxHeight: 220,
                          objectFit: "cover",
                          display: "block",
                        }}
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = "none";
                          const fallback = target.parentElement?.querySelector(".img-fallback") as HTMLElement;
                          if (fallback) fallback.style.display = "flex";
                        }}
                      />
                      <div
                        className="img-fallback"
                        style={{
                          display: "none",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: 24,
                          gap: 8,
                          color: "var(--muted)",
                          fontSize: 12,
                        }}
                      >
                        <AlertTriangle size={24} style={{ color: "var(--amber)" }} />
                        <span>No se pudo previsualizar miniatura directa. Haz clic para abrir en visor seguro.</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: 16, background: "var(--panel2)", borderRadius: 10, textAlign: "center", color: "var(--muted)", fontSize: 12 }}>
                    No se ha adjuntado fotografía de fachada aún.
                  </div>
                )
              )}

              {selectedUserForKyc.role !== "TIENDA" && (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {(selectedUserForKyc.dniPhotoUrl || selectedUserForKyc.kycApplications?.[0]?.documentUrl) && (
                    <button
                      type="button"
                      onClick={() => {
                        const items = getUserKycMediaItems(selectedUserForKyc);
                        openMediaViewer(items, 0);
                      }}
                      className="btn secondary"
                      style={{ fontSize: 12, padding: "8px 12px", display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}
                    >
                      <FileText size={14} />
                      <span>Frente del Documento</span>
                      <ZoomIn size={12} />
                    </button>
                  )}
                  {selectedUserForKyc.kycApplications?.[0]?.documentUrlBack && (
                    <button
                      type="button"
                      onClick={() => {
                        const items = getUserKycMediaItems(selectedUserForKyc);
                        const backUrl = selectedUserForKyc.kycApplications?.[0]?.documentUrlBack;
                        const idx = items.findIndex((i) => i.url === backUrl);
                        openMediaViewer(items, idx >= 0 ? idx : 0);
                      }}
                      className="btn secondary"
                      style={{ fontSize: 12, padding: "8px 12px", display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}
                    >
                      <FileText size={14} />
                      <span>Reverso del Documento</span>
                      <ZoomIn size={12} />
                    </button>
                  )}
                  {(selectedUserForKyc.profilePhotoUrl || selectedUserForKyc.kycApplications?.[0]?.selfieUrl) && (
                    <button
                      type="button"
                      onClick={() => {
                        const items = getUserKycMediaItems(selectedUserForKyc);
                        const selfieUrl = selectedUserForKyc.profilePhotoUrl || selectedUserForKyc.kycApplications?.[0]?.selfieUrl;
                        const idx = items.findIndex((i) => i.url === selfieUrl);
                        openMediaViewer(items, idx >= 0 ? idx : 0);
                      }}
                      className="btn secondary"
                      style={{ fontSize: 12, padding: "8px 12px", display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}
                    >
                      <Users size={14} />
                      <span>Selfie / Foto de Perfil</span>
                      <ZoomIn size={12} />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Campo de Observaciones / Motivo */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>
                Observaciones del Auditor (requerido para Observar o Rechazar):
              </label>
              <textarea
                value={userKycObservation}
                onChange={(e) => setUserKycObservation(e.target.value)}
                placeholder="Ingresa notas o indicaciones para el titular (ej: RUC inactivo en SUNAT, fotografía de fachada borrosa)..."
                rows={3}
                style={{
                  width: "100%",
                  background: "var(--input-bg)",
                  border: "1px solid var(--line)",
                  borderRadius: 10,
                  color: "var(--input-color)",
                  padding: 10,
                  fontSize: 12,
                  outline: "none",
                  resize: "vertical",
                }}
              />
            </div>

            {/* Acciones de Auditoría */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <button
                type="button"
                className="btn secondary"
                disabled={userKycSubmitting}
                onClick={() => setSelectedUserForKyc(null)}
                style={{ padding: "8px 14px", fontSize: 12 }}
              >
                Cerrar
              </button>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  disabled={userKycSubmitting}
                  onClick={() => handleUserKycDecision("REJECTED")}
                  style={{
                    background: "rgba(244, 63, 94, 0.1)",
                    color: "#F43F5E",
                    border: "1px solid rgba(244, 63, 94, 0.3)",
                    padding: "8px 14px",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: userKycSubmitting ? "not-allowed" : "pointer",
                  }}
                >
                  Rechazar
                </button>
                <button
                  type="button"
                  disabled={userKycSubmitting}
                  onClick={() => handleUserKycDecision("OBSERVED")}
                  style={{
                    background: "rgba(245, 158, 11, 0.1)",
                    color: "#F59E0B",
                    border: "1px solid rgba(245, 158, 11, 0.3)",
                    padding: "8px 14px",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: userKycSubmitting ? "not-allowed" : "pointer",
                  }}
                >
                  Observar
                </button>
                <button
                  type="button"
                  disabled={userKycSubmitting}
                  onClick={() => handleUserKycDecision("APPROVED")}
                  style={{
                    background: "var(--green, #059669)",
                    color: "#06110d",
                    border: "none",
                    padding: "8px 18px",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: userKycSubmitting ? "not-allowed" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <CheckCircle2 size={14} />
                  <span>{userKycSubmitting ? "Procesando..." : "Aprobar y Habilitar"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visor Multimedia Universal */}
      <MediaViewerModal
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        items={viewerItems}
        initialIndex={viewerInitialIndex}
      />
    </>
  );
}

