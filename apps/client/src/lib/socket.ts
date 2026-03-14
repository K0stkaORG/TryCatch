import { ClientToServerEvents, Packet, ServerToClientEvents } from "@try-catch/shared-types";
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

const isDevelopment = import.meta.env.DEV;

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(isDevelopment ? "http://localhost:3000" : "/", {
	autoConnect: false,
});

export const usePackets = () => {
	const [packets, setPackets] = useState<Pick<Packet, "receivedAt" | "parsedData" | "rawBytes">[]>([]);

	useEffect(() => {
		socket.connect();

		socket.on("initialSync", ({ packets }) => {
			setPackets(packets);
		});

		socket.on("packet", ({ packet }) => {
			setPackets((prevPackets) => {
				console.log("Received packet:", packet);
				console.log("Previous packets:", prevPackets);

				return [...prevPackets, packet];
			});
		});

		return () => {
			socket.off("initialSync");
			socket.off("packet");

			socket.disconnect();
		};
	}, []);

	return packets;
};
