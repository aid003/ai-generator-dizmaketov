import { io, Socket } from "socket.io-client";
import { ClientToServerEvents, ServerToClientEvents } from "./types/types";

const URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5550";

const socketMl: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  `${URL}/ml`,
  {
    autoConnect: true,
  }
);

export default socketMl;
