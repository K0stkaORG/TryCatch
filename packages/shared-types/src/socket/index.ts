import { ValidPacket } from "../models/packet";

// Data that comes FROM the client TO the server
export type ClientToServerEvents = {};

// Data that goes FROM the server TO the client
export type ServerToClientEvents = {
	initialSync: (data: { packets: Pick<ValidPacket, "receivedAt" | "parsedData">[] }) => void;
	packet: (data: { packet: Pick<ValidPacket, "receivedAt" | "parsedData"> }) => void;
	packetLoss: (data: { percentLoss: number }) => void;
	flightEnded: () => void;
};

// Inter-server events (if needed)
export interface InterServerEvents {}

// Socket data (data stored on the socket instance)
export interface SocketData {}
