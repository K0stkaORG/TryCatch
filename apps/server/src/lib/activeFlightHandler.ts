import { Flight, Packet, ValidPacket } from "@try-catch/shared-types";
import { SerialPort } from "serialport";
import { asc, db, eq, FlightPackets } from "~/db";
import { ExtendedError } from "./errors";
import { ESPPathPicker } from "./espPathPicker";
import { logger } from "./logger";

const COMMIT_EVERY_N_PACKETS = 10;
const EXPECTED_PACKETS_PER_SECOND = 10;
const PACKET_LOSS_HEARTBEAT_INTERVAL_MS = 100;

export class ActiveFlightHandler {
	private static _instance: ActiveFlightHandler | undefined;
	private static newPacketListener: ((packet: Pick<ValidPacket, "receivedAt" | "parsedData">) => void) | undefined;
	private static packetLossListener: ((percentLoss: number) => void) | undefined;
	private static flightEndListener: (() => void) | undefined;

	private port: SerialPort | undefined;
	private interval: NodeJS.Timeout;
	private commitBuffer: Pick<Packet, "rawBytes" | "receivedAt" | "parsedData">[] = [];

	private constructor(
		public readonly flight: Pick<Flight, "id" | "name">,
		public readonly packets: Pick<Packet, "receivedAt" | "parsedData">[],
	) {
		this.interval = setInterval(() => {
			const packetLossCuttof = Date.now() - PACKET_LOSS_HEARTBEAT_INTERVAL_MS;

			let packetsReceivedInInterval = 0;

			for (let i = this.packets.length - 1; i >= 0; i--) {
				if (this.packets[i].receivedAt.getTime() < packetLossCuttof) break;

				packetsReceivedInInterval++;
			}

			const expectedPackets = (EXPECTED_PACKETS_PER_SECOND * PACKET_LOSS_HEARTBEAT_INTERVAL_MS) / 1000;
			const percentLoss = ((expectedPackets - packetsReceivedInInterval) / expectedPackets) * 100;

			if (percentLoss > 50)
				logger.warn(
					`Severe packet loss detected: ${percentLoss.toFixed(2)}% (${packetsReceivedInInterval}/${expectedPackets} packets received in the last ${PACKET_LOSS_HEARTBEAT_INTERVAL_MS / 1000} seconds)`,
				);

			ActiveFlightHandler.packetLossListener?.(percentLoss);
		}, PACKET_LOSS_HEARTBEAT_INTERVAL_MS);

		this.port = new SerialPort({
			path: ESPPathPicker.path,
			baudRate: 115200,
			dataBits: 8,
			stopBits: 1,
			parity: "none",
		});

		this.port.on("open", () => {
			logger.info("Serial port opened successfully.");
			this.port?.set({ dtr: true, rts: true });
		});

		this.port.on("readable", () => {
			logger.info(`Received data from ESP32:`, this.port?.read().toString());
		});

		this.port.on("error", (data) => {
			logger.error(data);
		});

		this.port.on("data", (data) => {
			logger.info(`Received data from ESP32:`, data.toString());

			const packetData = decodePacket(data);

			this.commitBuffer.push({
				rawBytes: data,
				receivedAt: new Date(),
				parsedData: packetData,
			});

			if (this.commitBuffer.length >= COMMIT_EVERY_N_PACKETS) this.commitPackets();

			this.packets.push({
				receivedAt: new Date(),
				parsedData: packetData,
			});

			if (packetData)
				ActiveFlightHandler.newPacketListener?.({
					receivedAt: new Date(),
					parsedData: packetData,
				});
		});
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

		ActiveFlightHandler._instance.port?.destroy();
		clearInterval(ActiveFlightHandler._instance.interval);
		ActiveFlightHandler.flightEndListener?.();

		logger.info(`Stopping ActiveFlightHandler for flight ID ${ActiveFlightHandler._instance.flight.id}...`);

		ActiveFlightHandler._instance = undefined;
	}

	public static onNewPacket(listener: (packet: Pick<Packet, "receivedAt" | "parsedData">) => void) {
		this.newPacketListener = listener;
	}

	public static onPacketLoss(listener: (percentLoss: number) => void) {
		this.packetLossListener = listener;
	}

	public static onFlightEnd(listener: () => void) {
		this.flightEndListener = listener;
	}

	private async commitPackets() {
		if (this.commitBuffer.length === 0) return;

		const packetsToCommit = this.commitBuffer;
		this.commitBuffer = [];

		await db.insert(FlightPackets).values(
			packetsToCommit.map((packet) => ({
				flightId: this.flight.id,
				receivedAt: packet.receivedAt,
				rawBytes: packet.rawBytes,
				parsedData: packet.parsedData,
			})),
		);
	}
}
