import { ClientToServerEvents, Flight, ServerToClientEvents, ValidPacket } from "@try-catch/shared-types";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";

const PACKET_BUFFER_SIZE = 100;
const PACKET_LOSS_BUFFER_SIZE = 10;

const isDevelopment = import.meta.env.DEV;

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(isDevelopment ? "http://localhost:3000" : "/", {
	autoConnect: false,
});

type PacketType = Pick<ValidPacket, "receivedAt" | "parsedData">;

export const usePackets = (flightId: Flight["id"]) => {
	const navigate = useNavigate();

	const [connected, setConnected] = useState(socket.connected);
	const [packetBuffer, setPacketBuffer] = useState<PacketType[]>([]);
	const [packetLossBuffer, setPacketLossBuffer] = useState<number[]>(
		Array.from({ length: PACKET_LOSS_BUFFER_SIZE }, () => 0),
	);

	useEffect(() => {
		socket.connect();

		socket.on("connect", () => setConnected(true));
		socket.on("disconnect", () => setConnected(false));

		socket.on("initialSync", ({ packets }) => setPacketBuffer(packets.slice(-PACKET_BUFFER_SIZE)));

		socket.on("packet", ({ packet }) =>
			setPacketBuffer((prev) => [...prev.slice(-PACKET_BUFFER_SIZE + 1), packet]),
		);

		socket.on("packetLoss", ({ percentLoss }) =>
			setPacketLossBuffer((prev) => [...prev.slice(-PACKET_LOSS_BUFFER_SIZE + 1), percentLoss]),
		);

		socket.on("flightEnded", () => {
			toast.warning("The flight has ended.");

			setTimeout(() => navigate(`/flight/${flightId}`), 50);
		});

		return () => {
			socket.off("connect");
			socket.off("disconnect");

			socket.off("initialSync");

			socket.off("packet");
			socket.off("packetLoss");
			socket.off("flightEnded");

			setConnected(false);

			socket.disconnect();
		};
	}, [flightId, navigate]);

	return {
		connected,
		packets: packetBuffer,
		packetLoss: packetLossBuffer,
	};
};
