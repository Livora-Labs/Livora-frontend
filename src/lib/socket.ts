import { io, Socket } from "socket.io-client";
import { queryClient } from "@/lib/queryClient";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

let socketInstance: Socket | null = null;

/**
 * Inicializa o retorna la instancia singleton de Socket.IO con opciones
 * de reconexión con backoff exponencial e invalidación reactiva de caché.
 */
export function getSocket(token?: string): Socket {
  const activeToken =
    token || (typeof window !== "undefined" ? localStorage.getItem("livora_token") : "");

  if (!socketInstance) {
    socketInstance = io(API_URL, {
      query: { token: activeToken || "" },
      auth: { token: activeToken || "" },
      autoConnect: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
      timeout: 10000,
    });

    // ─────────────────────────────────────────────────────────────
    // LISTENERS GLOBALES PARA INVALIDACIÓN REACTIVA DE REACT QUERY
    // ─────────────────────────────────────────────────────────────

    socketInstance.on("batch:completed", (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["balance"] });
      queryClient.invalidateQueries({ queryKey: ["blockchainHealth"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardMetrics"] });
    });

    socketInstance.on("redemption:completed", (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["storeRedemptions"] });
      queryClient.invalidateQueries({ queryKey: ["balance"] });
      queryClient.invalidateQueries({ queryKey: ["walletTransactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardMetrics"] });
      queryClient.invalidateQueries({ queryKey: ["storeSettlements"] });
    });

    socketInstance.on("collection:created", () => {
      queryClient.invalidateQueries({ queryKey: ["collectionRequests"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardMetrics"] });
    });

    socketInstance.on("collection:updated", () => {
      queryClient.invalidateQueries({ queryKey: ["collectionRequests"] });
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardMetrics"] });
    });

    socketInstance.on("b2b:transferred", () => {
      queryClient.invalidateQueries({ queryKey: ["incomingB2bTransfers"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    });

    socketInstance.on("b2b:received", () => {
      queryClient.invalidateQueries({ queryKey: ["incomingB2bTransfers"] });
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
    });
  } else if (activeToken) {
    if (socketInstance.io.opts) {
      socketInstance.io.opts.query = { token: activeToken };
      if (socketInstance.auth && typeof socketInstance.auth === "object") {
        (socketInstance.auth as any).token = activeToken;
      }
    }
    if (!socketInstance.connected) {
      socketInstance.connect();
    }
  }

  return socketInstance;
}

export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
