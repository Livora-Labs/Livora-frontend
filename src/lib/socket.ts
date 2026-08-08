import { io, Socket } from "socket.io-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

let socketInstance: Socket | null = null;

export function getSocket(token?: string): Socket {
  const activeToken = token || (typeof window !== "undefined" ? localStorage.getItem("livora_token") : "");

  if (!socketInstance) {
    socketInstance = io(API_URL, {
      query: { token: activeToken || "" },
      auth: { token: activeToken || "" },
      autoConnect: true,
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
    });
  } else if (activeToken && socketInstance.io.opts.query) {
    socketInstance.io.opts.query = { token: activeToken };
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
