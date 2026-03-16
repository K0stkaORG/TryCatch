import { AppServer, AppSocket } from "~/lib/types";

import { ActiveFlightHandler } from "~/lib/activeFlightHandler";
import { ExtendedError } from "~/lib/errors";
import { logger } from "~/lib/logger";

export function setupSocketHandlers(io: AppServer): void {
	ActiveFlightHandler.onNewPacket((packet) => io.emit("packet", { packet }));

	ActiveFlightHandler.onPacketLoss((percentLoss) => io.emit("packetLoss", { percentLoss }));

	ActiveFlightHandler.onFlightEnd(() => {
		io.emit("flightEnded");
		io.disconnectSockets(true);
	});

	io.on("connection", (socket: AppSocket) => {
		// Error handling
		socket.on("error", (error) => logger.error(new ExtendedError(error.message ?? "Unknown socket error", error)));
	});

	// Middleware for initial sync
	io.use(async (socket, next) => {
		if (!ActiveFlightHandler.isActive) {
			logger.warn("Client connected but no active flight. Disconnecting socket.");
			return void socket.disconnect(true);
		}

		socket.emit("initialSync", { packets: ActiveFlightHandler.instance.packets });

		next();
	});
}
