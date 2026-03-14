import { Flight, Packet } from "@try-catch/shared-types";
import { asc, db, eq, FlightPackets } from "~/db";
import { ExtendedError } from "./errors";
import { logger } from "./logger";

export class ActiveFlightHandler {
	private static _instance: ActiveFlightHandler | undefined;

	private static newPacketListener: ((packet: Packet) => void) | undefined;

	private interval: NodeJS.Timeout;

	private constructor(
		public readonly flight: Pick<Flight, "id" | "name">,
		public readonly packets: Packet[],
	) {
		this.interval = setInterval(() => {
			ActiveFlightHandler.newPacketListener?.({
				id: 0,
				flightId: this.flight.id,
				receivedAt: new Date(),
				rawBytes: "ASDASD",
				parsedData: null,
			});
		}, 1000);
	}

	public static get isActive() {
		return !!ActiveFlightHandler._instance;
	}

	public static get instance(): ActiveFlightHandler {
		if (!ActiveFlightHandler._instance)
			throw new ExtendedError("ActiveFlightHandler accessed before initialization.");

		return ActiveFlightHandler._instance;
	}

	public static async initialize(flight: Pick<Flight, "id" | "name">) {
		if (ActiveFlightHandler._instance) throw new ExtendedError("ActiveFlightHandler is already initialized.");

		logger.info(`Initializing ActiveFlightHandler for flight ID ${flight.id}...`);

		const packets = await db.query.FlightPackets.findMany({
			where: eq(FlightPackets.flightId, flight.id),
			orderBy: asc(FlightPackets.receivedAt),
		});

		ActiveFlightHandler._instance = new ActiveFlightHandler(flight, packets);
	}

	public static stop() {
		if (!ActiveFlightHandler._instance) return;

		logger.info(`Stopping ActiveFlightHandler for flight ID ${ActiveFlightHandler._instance.flight.id}...`);

		clearInterval(ActiveFlightHandler._instance.interval);
		ActiveFlightHandler._instance = undefined;
	}

	public static onNewPacket(listener: (packet: Packet) => void) {
		this.newPacketListener = listener;
	}
}
