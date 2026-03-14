import z from "zod";

export const FlightNameSchema = z.string().min(1).max(100);

export type Flight = {
	id: number;
	name: string;
	createdAt: Date;
	firstPacketAt: Date | null;
	durationMs: number | null;
};
