import { ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData } from "@try-catch/shared-types";
import { Server, Socket } from "socket.io";

export type AppServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
export type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
