"use client";

import React, { useState, useEffect, useMemo } from "react";
import { PageHead, Status } from "@/components/Shell";
import { fetchKycApplications, updateKycStatus, fetchAdminUsers, updateAdminUserStatus } from "@/lib/api";
import { showToast, ToastContainer } from "@/components/ToastNotification";
import { Users, ShieldCheck, RefreshCw, Search, Filter } from "lucide-react";

const date = (value: string) =>
  new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

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

  // --- Estado para Auditoría KYC ---
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [kycSearch, setKycSearch] = useState("");
  const [kycStatusFilter, setKycStatusFilter] = useState("ALL");
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
        k.documentNumber?.toLowerCase().includes(q);
      const matchStatus =
        kycStatusFilter === "ALL" || k.status === kycStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [items, kycSearch, kycStatusFilter]);

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
      loadKyc();
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
      loadKyc();
    } catch (err: any) {
      showToast("Error al aprobar expediente KYC", "error", err.message);
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
                    <th style={{ padding: "12px 16px", fontWeight: 700 }}>Estado Operativo</th>
                    <th style={{ padding: "12px 16px", fontWeight: 700 }}>Actividad Registrada</th>
                    <th style={{ padding: "12px 16px", fontWeight: 700 }}>Fecha Registro</th>
                    <th style={{ padding: "12px 16px", fontWeight: 700, textAlign: "right" }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {usersLoading ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
                        Cargando directorio de usuarios...
                      </td>
                    </tr>
                  ) : usersList.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
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
                          {u.role === "ADMIN" ? (
                            <span
                              style={{
                                fontSize: 11,
                                color: "var(--muted)",
                                padding: "4px 8px",
                                fontStyle: "italic",
                              }}
                            >
                              Administrador
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
                          {kycSearch || kycStatusFilter !== "ALL"
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
                          ) : (
                            <div style={{ fontSize: 11, color: "var(--muted, #94a3b8)" }}>
                              {k.bankCci ? `CCI: ${k.bankCci}` : "—"}
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            {k.documentUrl && (
                              <a
                                className="btn"
                                href={k.documentUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={{ fontSize: 11, padding: "3px 8px", textAlign: "center" }}
                              >
                                Frente documento
                              </a>
                            )}
                            {k.documentUrlBack && (
                              <a
                                className="btn"
                                href={k.documentUrlBack}
                                target="_blank"
                                rel="noreferrer"
                                style={{ fontSize: 11, padding: "3px 8px", textAlign: "center" }}
                              >
                                Reverso documento
                              </a>
                            )}
                            {k.selfieUrl && (
                              <a
                                className="btn"
                                href={k.selfieUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={{ fontSize: 11, padding: "3px 8px", textAlign: "center" }}
                              >
                                Foto de perfil / Selfie
                              </a>
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
    </>
  );
}

