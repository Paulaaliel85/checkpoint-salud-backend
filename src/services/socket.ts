import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "../stores/auth";

const URL_SERVIDOR = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

let socket: Socket | null = null;
let tokenActual: string | null = null;

export function conectarSocket(): Socket | null {
  const auth = useAuthStore();

  if (!auth.token) return null;
  if (socket && tokenActual === auth.token) return socket;

  socket?.disconnect();
  tokenActual = auth.token;
  socket = io(URL_SERVIDOR, { auth: { token: auth.token } });

  return socket;
}

export function desconectarSocket() {
  socket?.disconnect();
  socket = null;
  tokenActual = null;
}