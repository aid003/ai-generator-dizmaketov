import { io, Socket } from "socket.io-client";
import {
  ScraperClientToServerEvents,
  ScraperServerToClientEvents,
} from "./types/types";

const URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5500";

const scraperSocket: Socket<
  ScraperServerToClientEvents,
  ScraperClientToServerEvents
> = io(`${URL}/scraper`, {
  autoConnect: false,
});

export default scraperSocket;
