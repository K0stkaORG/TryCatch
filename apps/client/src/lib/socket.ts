import { ClientToServerEvents, Packet, ServerToClientEvents } from "@try-catch/shared-types";
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";

const PACKET_BUFFER_SIZE = 100;

const isDevelopment = import.meta.env.DEV;

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(isDevelopment ? "http://localhost:3000" : "/", {
	autoConnect: false,
});

type PacketType = Pick<Packet, "receivedAt" | "parsedData">;

export const usePackets = () => {
	const [connected, setConnected] = useState(socket.connected);
	const [packetBuffer, setPacketBuffer] = useState<PacketType[]>([]);
	const [packetLoss, setPacketLoss] = useState(0);

	useEffect(() => {
		socket.connect();

		socket.on("connect", () => setConnected(true));
		socket.on("disconnect", () => setConnected(false));

		socket.on("initialSync", ({ packets }) => setPacketBuffer(packets.slice(-PACKET_BUFFER_SIZE)));

		socket.on("packet", ({ packet }) =>
			setPacketBuffer((prev) => [...prev.slice(-PACKET_BUFFER_SIZE + 1), packet]),
		);

		socket.on("packetLoss", ({ percentLoss }) => setPacketLoss(percentLoss));

		socket.on("flightEnded", () => {
			toast.warning("The flight has ended. No new packets will be received.");
		});

		return () => {
			socket.off("connect");
			socket.off("disconnect");

			socket.off("initialSync");

			socket.off("packet");
			socket.off("packetLoss");
			socket.off("flightEnded");

			socket.disconnect();
		};
	}, []);

	return {
		connected,
		packets: packetBuffer,
		packetLoss,
	};
};
