import z from "zod";
import { Flight } from "../models/flight";
import { Packet } from "../models/packet";

export type FlightsListResponse = {
	activeFlight: Pick<Flight, "id" | "name"> | null;
	archivedFlights: Flight[];
};

export type ActiveFlightDataResponse = Pick<Flight, "id" | "name">;

export const FinishedFlightDataRequest = z.object({
	flightId: z.number(),
});
export type FinishedFlightDataRequest = z.infer<typeof FinishedFlightDataRequest>;

export type FinishedFlightDataResponse = Flight & {
	flightPackets: Omit<Packet, "flightId">[];
};

export const NewFlightRequest = z.object({
	name: z.string(),
});
export type NewFlightRequest = z.infer<typeof NewFlightRequest>;
