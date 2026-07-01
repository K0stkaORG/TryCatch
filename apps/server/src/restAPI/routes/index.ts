import express, { Application } from "express";
import path from "path";
import { ENV } from "~/env";
import { logger } from "~/lib/logger";
import { flightsRouter } from "./flights.routes";
import { servoRouter } from "./servo.routes";

const clientPath = ENV.NODE_ENV === "production" ? "../../client/dist" : "../../../../client/dist";

export function setupRoutes(app: Application): void {
	// Serve client static files
	app.use("/flight/*", express.static(path.join(__dirname, clientPath, "index.html")));
	app.use(express.static(path.join(__dirname, clientPath)));

	// API routes
	app.use("/api/flights", flightsRouter);
	app.use("/api/servo", servoRouter);

	// 404 handler
	app.use("*", (req, res) => {
		logger.warn(`Route ${req.originalUrl} not found`);

		res.status(404).json({
			status: "error",
			message: "Route not found",
		});
	});
}
