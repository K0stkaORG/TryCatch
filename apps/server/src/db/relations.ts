import { relations } from "drizzle-orm";
import { FlightPackets, Flights } from "./models";

export const FlightRelations = relations(Flights, ({ many }) => ({
	flightPackets: many(FlightPackets),
}));

export const FlightPacketRelations = relations(FlightPackets, ({ one }) => ({
	flight: one(Flights, {
		fields: [FlightPackets.flightId],
		references: [Flights.id],
	}),
}));
