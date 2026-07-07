import { Flight, Packet, ValidPacket } from "@try-catch/shared-types";
import { SerialPort } from "serialport";
import { asc, db, eq, FlightPackets } from "~/db";
import { ENV } from "~/env";
import { decodePacket } from "./decodePacket";
import { ExtendedError } from "./errors";
import { ESPPathPicker } from "./espPathPicker";
import { logger } from "./logger";
import { TelemetryEmulator } from "./telemetryEmulator";

const COMMIT_EVERY_N_PACKETS = 10;
const EXPECTED_PACKETS_PER_INTERVAL = 10;
const PACKET_LOSS_HEARTBEAT_INTERVAL_MS = 4000;

export class ActiveFlightHandler {
	private static _instance: ActiveFlightHandler | undefined;
	private static newPacketListener: ((packet: Pick<ValidPacket, "receivedAt" | "parsedData">) => void) | undefined;
	private static packetLossListener: ((percentLoss: number) => void) | undefined;
	private static flightEndListener: (() => void) | undefined;

	private packetLossInterval: NodeJS.Timeout;
	private commitBuffer: Pick<Packet, "rawBytes" | "receivedAt" | "parsedData">[] = [];

	private port: SerialPort | undefined;
	private telemetryEmulator: TelemetryEmulator | undefined;

	private serialAccumulator: Buffer = Buffer.alloc(0);

	private constructor(
		public readonly flight: Pick<Flight, "id" | "name">,
		public readonly packets: Pick<Packet, "receivedAt" | "parsedData">[],
	) {
		this.packetLossInterval = this.setupPacketLossDetection();

		if (ENV.EMULATED_TELEMETRY) this.setupTelemetryEmulator();
		else this.setupSerialPort();
	}

	private setupPacketLossDetection(): NodeJS.Timeout {
		return setInterval(() => {
			const packetLossCutoff = Date.now() - PACKET_LOSS_HEARTBEAT_INTERVAL_MS;

			let packetsReceivedInInterval = 0;

			for (let i = this.packets.length - 1; i >= 0; i--) {
				if (this.packets[i].receivedAt.getTime() < packetLossCutoff) break;

				packetsReceivedInInterval++;
			}

			const percentLoss =
				((EXPECTED_PACKETS_PER_INTERVAL - packetsReceivedInInterval) / EXPECTED_PACKETS_PER_INTERVAL) * 100;

			if (percentLoss > 50)
				logger.warn(
					`Severe packet loss detected: ${percentLoss.toFixed(2)}% (${packetsReceivedInInterval}/${EXPECTED_PACKETS_PER_INTERVAL} packets received in the last ${PACKET_LOSS_HEARTBEAT_INTERVAL_MS / 1000} seconds)`,
				);

			ActiveFlightHandler.packetLossListener?.(percentLoss);
		}, PACKET_LOSS_HEARTBEAT_INTERVAL_MS);
	}

	private setupTelemetryEmulator() {
		this.telemetryEmulator = new TelemetryEmulator(
			EXPECTED_PACKETS_PER_INTERVAL / PACKET_LOSS_HEARTBEAT_INTERVAL_MS,
			(packet) => {
				const now = new Date();

				this.packets.push({
					receivedAt: new Date(),
					parsedData: packet,
				});

				ActiveFlightHandler.newPacketListener?.({
					receivedAt: now,
					parsedData: packet,
				});
			},
		);
	}

	private setupSerialPort() {
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

		this.port.on("error", (data) => {
			logger.error(data);
		});

		this.port.on("data", (chunk: Buffer) => {
			// Concatenate newly arrived data onto our accumulator
			this.serialAccumulator = Buffer.concat([this.serialAccumulator, chunk]);

			// Loop as long as we have enough bytes to potentially process a packet
			while (this.serialAccumulator.length >= 33) {
				// Frame Synchronization: Check for magic sync bytes (0xA5, 0x5A)
				if (this.serialAccumulator[0] !== 0xa5 || this.serialAccumulator[1] !== 0x5a) {
					// Out of sync! Shift buffer forward by 1 byte and scan again
					this.serialAccumulator = this.serialAccumulator.subarray(1);
					continue;
				}

				// If the buffer starts with the header but doesn't have 33 bytes yet,
				// break out and wait for the next "data" event to complete it.
				if (this.serialAccumulator.length < 33) {
					break;
				}

				// Slice out exactly one 33-byte packet frame
				const packetBuffer = this.serialAccumulator.subarray(0, 33);
				// Advance the accumulator past this packet
				this.serialAccumulator = this.serialAccumulator.subarray(33);

				// Process the verified packet
				const hexString = packetBuffer.toString("hex").toUpperCase();
				const [packetData, error] = decodePacket(packetBuffer);

				if (error) logger.warn(`Received unrecognized packet: ${error} (raw: ${hexString})`);

				this.commitBuffer.push({
					rawBytes: hexString,
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
			}
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

		logger.info(`Stopping ActiveFlightHandler for flight ID ${ActiveFlightHandler._instance.flight.id}...`);

		const instance = ActiveFlightHandler._instance;
		ActiveFlightHandler._instance = undefined;

		instance.port?.close();
		instance.telemetryEmulator?.stop();
		clearInterval(instance.packetLossInterval);

		instance.commitPackets().then(() => ActiveFlightHandler.flightEndListener?.());
	}

	public static onNewPacket(listener: (packet: Pick<ValidPacket, "receivedAt" | "parsedData">) => void) {
		ActiveFlightHandler.newPacketListener = listener;
	}

	public static onPacketLoss(listener: (percentLoss: number) => void) {
		ActiveFlightHandler.packetLossListener = listener;
	}

	public static onFlightEnd(listener: () => void) {
		ActiveFlightHandler.flightEndListener = listener;
	}

	public sendRocketCommand(bytes: number[]) {
		logger.info(`Sending rocket command: ${bytes.map((b) => `0x${b.toString(16).padStart(2, "0")}`).join(" ")}`);

		if (!this.port || !this.port.isOpen) {
			logger.warn("Rocket command ignored: serial port not open.");
			return;
		}

		let iteration = 1;

		const iterationSuffix = {
			1: "st",
			2: "nd",
			3: "rd",
		};

		const sendPacket = () => {
			this.port?.write(Buffer.from(bytes), (err) => {
				if (err)
					logger.error(
						`Error sending ${iteration}${iterationSuffix[iteration as 1] ?? "th"} rocket command: ${err.message}`,
					);
			});

			iteration++;
		};

		sendPacket();

		setTimeout(sendPacket, 100);

		setTimeout(sendPacket, 100);
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
