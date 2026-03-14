import {
	ActiveFlightDataResponse,
	FinishedFlightDataRequest,
	FinishedFlightDataResponse,
	FlightsListResponse,
	NewFlightRequest,
} from "@try-catch/shared-types";
import { Router } from "express";
import { and, db, desc, eq, FlightPackets, Flights, isNotNull } from "~/db";
import { ActiveFlightHandler } from "~/lib/activeFlightHandler";
import { UserRequestError } from "~/lib/errors";
import { RouteHandler } from "../middleware/validation";

const flightsRouter: Router = Router();

flightsRouter.get(
	"/list",
	RouteHandler(null, async (): Promise<FlightsListResponse> => {
		const flights = await db.query.Flights.findMany({
			where: isNotNull(Flights.durationMs),
			orderBy: desc(Flights.createdAt),
		});

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
