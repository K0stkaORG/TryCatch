import {
	ActiveFlightDataResponse,
	FinishedFlightDataRequest,
	FinishedFlightDataResponse,
	FlightsListResponse,
	NewFlightRequest,
	ValidPacket,
} from "@try-catch/shared-types";
import { Router } from "express";
import { and, count, db, desc, eq, FlightPackets, Flights, isNotNull } from "~/db";
import { ActiveFlightHandler } from "~/lib/activeFlightHandler";
import { UserRequestError } from "~/lib/errors";
import { RouteHandler } from "../middleware/validation";

const flightsRouter: Router = Router();

flightsRouter.get(
	"/list",
	RouteHandler(null, async (): Promise<FlightsListResponse> => {
		const flights = await db
			.select({
				id: Flights.id,
				name: Flights.name,
				createdAt: Flights.createdAt,
				firstPacketAt: Flights.firstPacketAt,
				durationMs: Flights.durationMs,
				numberOfPackets: count(FlightPackets.id),
			})
			.from(Flights)
			.leftJoin(FlightPackets, eq(FlightPackets.flightId, Flights.id))
			.where(isNotNull(Flights.durationMs))
			.groupBy(Flights.id)
			.orderBy(desc(Flights.createdAt));

		return {
			activeFlight: ActiveFlightHandler.isActive ? ActiveFlightHandler.instance.flight : null,
			archivedFlights: flights,
		};
	}),
);

flightsRouter.get(
	"/active",
	RouteHandler(null, async (): Promise<ActiveFlightDataResponse> => {
		if (!ActiveFlightHandler.isActive) throw new UserRequestError("There is no active flight");

		return ActiveFlightHandler.instance.flight;
	}),
);

flightsRouter.post(
	"/details",
	RouteHandler(FinishedFlightDataRequest, async ({ flightId }): Promise<FinishedFlightDataResponse> => {
		const flight = await db.query.Flights.findFirst({
			where: and(eq(Flights.id, flightId), isNotNull(Flights.durationMs)),
			with: {
				flightPackets: {
					orderBy: desc(FlightPackets.receivedAt),
					columns: {
						id: true,
						rawBytes: true,
						parsedData: true,
						receivedAt: true,
					},
				},
			},
		});

		if (!flight) throw new UserRequestError("Flight not found");

		return flight;
	}),
);

flightsRouter.get(
	"/download/:flightId",
	RouteHandler(null, async (_data, req, res): Promise<void> => {
		const flightId = parseInt(req.params.flightId, 10);

		if (isNaN(flightId)) throw new UserRequestError("Invalid flight ID");

		const flightPackets = await db.query.FlightPackets.findMany({
			where: eq(FlightPackets.flightId, flightId),
			orderBy: desc(FlightPackets.receivedAt),
			columns: {
				id: true,
				rawBytes: true,
				parsedData: true,
				receivedAt: true,
			},
		});

		if (flightPackets.length === 0) throw new UserRequestError("Flight not found");

		// 1. Define all flat CSV headers explicitly
		const csvHeaders = [
			"id",
			"rawBytes",
			"receivedAt",
			"timestampMs",
			"packetId",
			"raw_stateFlags",
			"raw_accelX",
			"raw_accelY",
			"raw_accelZ",
			"raw_gyroX",
			"raw_gyroY",
			"raw_gyroZ",
			"raw_pressureScaled",
			"raw_triboVoltageRaw",
			"raw_batteryVoltageRaw",
			"raw_gpsLatOffset",
			"raw_gpsLonOffset",
			"raw_gpsAltMeters",
			"raw_ky024Analog",
			"position_latitude",
			"position_longitude",
			"position_altitude",
			"velocity_latitude",
			"velocity_longitude",
			"velocity_altitude",
			"velocity_total",
			"acceleration_latitude",
			"acceleration_longitude",
			"acceleration_altitude",
			"acceleration_total",
			"orientation_roll",
			"orientation_pitch",
			"orientation_yaw",
			"angularVelocity_roll",
			"angularVelocity_pitch",
			"angularVelocity_yaw",
			"barometricAltitude",
			"batteryVoltage",
			"triboelectricVoltage",
			"launchDetected",
			"apogeeDetected",
			"parachuteDeployed",
		];

		// 2. Map rows by pulling out every nested property safely
		const csvRows = flightPackets.map((packet) => {
			// Cast or explicitly type the database response to match your ValidPacket structure
			const p = packet.parsedData as ValidPacket["parsedData"] | null;

			const columns = [
				packet.id,
				`"${packet.rawBytes.replace(/"/g, '""')}"`, // Escape quotes inside raw strings
				packet.receivedAt.toISOString(),

				// Top-level parsed data
				p?.timestampMs ?? "",
				p?.packetId ?? "",

				// Raw sub-object
				p?.raw?.stateFlags ?? "",
				p?.raw?.accelX ?? "",
				p?.raw?.accelY ?? "",
				p?.raw?.accelZ ?? "",
				p?.raw?.gyroX ?? "",
				p?.raw?.gyroY ?? "",
				p?.raw?.gyroZ ?? "",
				p?.raw?.pressureScaled ?? "",
				p?.raw?.triboVoltageRaw ?? "",
				p?.raw?.batteryVoltageRaw ?? "",
				p?.raw?.gpsLatOffset ?? "",
				p?.raw?.gpsLonOffset ?? "",
				p?.raw?.gpsAltMeters ?? "",
				p?.raw?.ky024Analog ?? "",

				// Position sub-object
				p?.position?.latitude ?? "",
				p?.position?.longitude ?? "",
				p?.position?.altitude ?? "",

				// Velocity sub-object
				p?.velocity?.latitude ?? "",
				p?.velocity?.longitude ?? "",
				p?.velocity?.altitude ?? "",
				p?.velocity?.total ?? "",

				// Acceleration sub-object
				p?.acceleration?.latitude ?? "",
				p?.acceleration?.longitude ?? "",
				p?.acceleration?.altitude ?? "",
				p?.acceleration?.total ?? "",

				// Orientation sub-object
				p?.orientation?.roll ?? "",
				p?.orientation?.pitch ?? "",
				p?.orientation?.yaw ?? "",

				// Angular Velocity sub-object
				p?.angularVelocity?.roll ?? "",
				p?.angularVelocity?.pitch ?? "",
				p?.angularVelocity?.yaw ?? "",

				// Remaining flat telemetry fields
				p?.barometricAltitude ?? "",
				p?.batteryVoltage ?? "",
				p?.triboelectricVoltage ?? "",
				p?.launchDetected !== undefined ? String(p.launchDetected) : "",
				p?.apogeeDetected !== undefined ? String(p.apogeeDetected) : "",
				p?.parachuteDeployed !== undefined ? String(p.parachuteDeployed) : "",
			];

			return columns.join(",");
		});

		// 3. Assemble full content
		const csvContent = [csvHeaders.join(","), ...csvRows].join("\n");

		// 4. Send back as actual file download response
		res.setHeader("Content-Type", "text/csv");
		res.setHeader("Content-Disposition", `attachment; filename=flight_${flightId}_packets.csv`);
		res.write(csvContent);
		res.send();
	}),
);

flightsRouter.post(
	"/new",
	RouteHandler(NewFlightRequest, async ({ name }): Promise<Record<string, never>> => {
		if (ActiveFlightHandler.isActive) throw new UserRequestError("There is already an active flight");

		const newFlightId = await db
			.insert(Flights)
			.values({
				name,
			})
			.returning({ id: Flights.id })
			.then((res) => res[0].id);

		await ActiveFlightHandler.initialize({
			id: newFlightId,
			name,
		});

		return {};
	}),
);

flightsRouter.post(
	"/stop",
	RouteHandler(null, async (): Promise<Record<string, never>> => {
		if (!ActiveFlightHandler.isActive) throw new UserRequestError("There is no active flight to end");

		const flightId = ActiveFlightHandler.instance.flight.id;

		ActiveFlightHandler.stop();

		const flightFirstPacketAt = await db.query.Flights.findFirst({
			where: eq(Flights.id, flightId),
			columns: {
				firstPacketAt: true,
			},
		}).then((res) => res!.firstPacketAt);

		await db
			.update(Flights)
			.set({
				durationMs: flightFirstPacketAt ? Date.now() - flightFirstPacketAt.getTime() : 0,
			})
			.where(eq(Flights.id, flightId));

		return {};
	}),
);

export { flightsRouter };
