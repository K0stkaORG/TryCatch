import express, { Application, json } from "express";
import { createServer, Server as HTTPServer } from "http";

import { ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData } from "@try-catch/shared-types";
import cors from "cors";
import { isNull, sql } from "drizzle-orm";
import { Server as SocketIOServer } from "socket.io";
import { db, Flights } from "./db";
import { ActiveFlightHandler } from "./lib/activeFlightHandler";
import { ExtendedError } from "./lib/errors";
import { logger } from "./lib/logger";
import { errorHandler } from "./restAPI/middleware/errorHandler";
import { setupRoutes } from "./restAPI/routes";
import { setupSocketHandlers } from "./socket";

export async function startServer(port: number): Promise<HTTPServer> {
	// Test database connection
	try {
		await db.execute(sql`SELECT NOW()`);
		logger.info("Database connection established");
	} catch (error) {
		throw new ExtendedError("Failed to establish connection to the database", { error });
	}

	// Create HTTP and Socket.IO servers
	const app: Application = express();
	const httpServer: HTTPServer = createServer(app);
	const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
		httpServer,
		{
			cors: {
				origin: "*",
			},
		},
	);

	// Start active flight handler
	const activeFlight = await db.query.Flights.findFirst({
		columns: {
			id: true,
			name: true,
		},
		where: isNull(Flights.durationMs),
	});

	if (activeFlight)
		try {
			ActiveFlightHandler.initialize(activeFlight);
		} catch (error) {
			logger.error(new ExtendedError("Failed to initialize ActiveFlightHandler", error));
		}
	else logger.info("No active flight found. ActiveFlightHandler not initialized.");

	// Security middleware
	app.use(cors());

	// Body parsing middleware
	app.use(json({ limit: "10mb" }));

	// Health check endpoint
	app.get("/health", (_req, res) => {
		res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() });
	});

	// Setup routes
	setupRoutes(app);

	// Setup Socket.IO handlers
	setupSocketHandlers(io);

	// Error handling middleware (must be last)
	app.use(errorHandler);

	// Start server
	return new Promise((resolve, reject) => {
		httpServer.listen(port, () => resolve(httpServer));

		// Handle server startup error
		httpServer.on("error", (error: { code?: string }) => {
			if (error.code === "EADDRINUSE")
				reject(new ExtendedError(`Port ${port} is already in use. Please choose a different port.`, {}));
			else reject(new ExtendedError(`Failed to start server`, { error }));
		});
	});
}
