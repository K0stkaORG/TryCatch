import { Packet } from "@try-catch/shared-types";
import { index, integer, pgTable, varchar } from "drizzle-orm/pg-core";

import { jsonb, timestamp } from "drizzle-orm/pg-core";

export const Flights = pgTable("flights", {
	id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
	name: varchar("name", {
		length: 63,
	}).notNull(),
	createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
	firstPacketAt: timestamp("first_packet_at", { mode: "date" }),
	durationMs: integer("duration_ms"),
});

export const FlightPackets = pgTable(
	"flight_packets",
	{
		id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
		flightId: integer("flight_id")
			.notNull()
			.references(() => Flights.id, { onDelete: "cascade" }),
		rawBytes: varchar("raw_bytes", {
			length: 255,
		}).notNull(),
		parsedData: jsonb("parsed_data").$type<Packet["parsedData"]>(),
		receivedAt: timestamp("received_at", { mode: "date" }).notNull().defaultNow(),
	},
	(table) => [index("idx_flight_id").on(table.flightId)],
);
