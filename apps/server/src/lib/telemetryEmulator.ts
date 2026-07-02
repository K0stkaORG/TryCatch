import { RocketFSMState, ValidPacket } from "@try-catch/shared-types";
import { logger } from "./logger";

const FLIGHT_DURATION_SECONDS = 120;
const FLIGHT_APOGEE_METERS = 600;
const BASE_LATITUDE = 49.194;
const BASE_LONGITUDE = 16.607;

const metersToLatitudeDelta = (meters: number) => meters / 111_320;
const metersToLongitudeDelta = (meters: number, latitude: number) =>
	meters / (111_320 * Math.max(0.2, Math.cos((latitude * Math.PI) / 180)));
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const normalizeAngle = (value: number) => ((value + 180) % 360) - 180;
const degreesToMicrodegreesOffset = (value: number, base: number) => Math.round((value - base) * 1_000_000);

type ParsedPacket = ValidPacket["parsedData"];

interface SimulationPhysics {
	altitude: number;
	verticalVelocity: number;
	verticalAcceleration: number;
	velocityLatitude: number;
	velocityLongitude: number;
	accelerationLatitude: number;
	accelerationLongitude: number;
	latitude: number;
	longitude: number;
	fsmState: RocketFSMState;
}

export class TelemetryEmulator {
	private startedAt: Date;
	private packetLossChance: number;

	private lastPacketAt: Date;
	private lastPacket: ParsedPacket;
	private packetId = 0;
	private interval: NodeJS.Timeout;

	private physics!: SimulationPhysics;

	public constructor(
		private readonly expectedPacketsPerSecond: number,
		private readonly onPacketCallback: (packet: ValidPacket["parsedData"]) => void,
	) {
		this.startedAt = new Date();
		this.packetLossChance = 0.03 + Math.random() * 0.1;

		this.lastPacketAt = new Date();
		this.initPhysics();
		this.lastPacket = this.createInitialPacket(this.lastPacketAt);

		this.interval = setInterval(() => {
			const packet = this.packet;
			if (packet) this.onPacketCallback(packet);
		}, 1000 / this.expectedPacketsPerSecond);

		logger.info(
			`TelemetryEmulator initialized with packet loss chance: ${(this.packetLossChance * 100).toFixed(2)}%`,
		);
	}

	private initPhysics() {
		const latitude = BASE_LATITUDE + (Math.random() - 0.5) * 0.0005;
		const longitude = BASE_LONGITUDE + (Math.random() - 0.5) * 0.0005;
		this.physics = {
			altitude: 0,
			verticalVelocity: 0,
			verticalAcceleration: 0,
			velocityLatitude: 0,
			velocityLongitude: 0,
			accelerationLatitude: 0,
			accelerationLongitude: 0,
			latitude,
			longitude,
			fsmState: "00",
		};
	}

	public get packet(): ParsedPacket | null {
		if (this.isPacketLost) return null;

		const now = new Date();
		const elapsedMs = now.getTime() - this.startedAt.getTime();
		const dtSeconds = (now.getTime() - this.lastPacketAt.getTime()) / 1000;

		if (elapsedMs > FLIGHT_DURATION_SECONDS * 1000) {
			this.startedAt = now;
			this.lastPacketAt = now;
			this.initPhysics();
			this.lastPacket = this.createInitialPacket(now);
			return this.lastPacket;
		}

		const t = elapsedMs / 1000;
		const safeDt = clamp(dtSeconds, 0.02, 0.5);

		let {
			altitude,
			verticalVelocity,
			verticalAcceleration,
			velocityLatitude,
			velocityLongitude,
			accelerationLatitude,
			accelerationLongitude,
			latitude,
			longitude,
			fsmState,
		} = this.physics;

		if (t > 0 && t <= FLIGHT_DURATION_SECONDS) {
			if (fsmState === "00" || fsmState === "01") {
				fsmState = "02"; // Switch to Flight
				verticalVelocity = (4 * FLIGHT_APOGEE_METERS) / FLIGHT_DURATION_SECONDS;
			}

			verticalAcceleration = (-8 * FLIGHT_APOGEE_METERS) / (FLIGHT_DURATION_SECONDS * FLIGHT_DURATION_SECONDS);
			const windHeading = t * 0.11;
			const parachuteDeployed = fsmState === "04" || fsmState === "03";
			const windBase = parachuteDeployed ? 10 : 4;
			const windGust = 1.7 * Math.sin(t * 0.2);
			const driftSpeed = windBase + windGust;

			velocityLatitude = driftSpeed * Math.cos(windHeading);
			velocityLongitude = driftSpeed * Math.sin(windHeading);

			accelerationLatitude = (velocityLatitude - this.physics.velocityLatitude) / safeDt;
			accelerationLongitude = (velocityLongitude - this.physics.velocityLongitude) / safeDt;

			verticalVelocity += verticalAcceleration * safeDt;
			altitude += verticalVelocity * safeDt;

			latitude += metersToLatitudeDelta(velocityLatitude * safeDt);
			longitude += metersToLongitudeDelta(velocityLongitude * safeDt, latitude);

			if (verticalVelocity <= 0 && fsmState === "02") {
				fsmState = "03"; // Apogee Reached
			} else if (fsmState === "03") {
				fsmState = "04"; // Chute Deployed on next calculation step
			}

			if (fsmState === "04") {
				verticalVelocity = Math.max(verticalVelocity, -7.5);
				verticalAcceleration = Math.max(verticalAcceleration, -2.5);
			}

			altitude += (Math.random() - 0.5) * safeDt * 0.8;
		} else if (t > FLIGHT_DURATION_SECONDS) {
			fsmState = "04";
			altitude = 0;
			verticalVelocity = 0;
			verticalAcceleration = 0;
			velocityLatitude = 0;
			velocityLongitude = 0;
			accelerationLatitude = 0;
			accelerationLongitude = 0;
		}

		this.physics = {
			altitude,
			verticalVelocity,
			verticalAcceleration,
			velocityLatitude,
			velocityLongitude,
			accelerationLatitude,
			accelerationLongitude,
			latitude,
			longitude,
			fsmState,
		};

		const roll = 18 * Math.sin(t * 0.9);
		const pitch = 14 * Math.sin(t * 0.45 + 0.8);
		const yaw = normalizeAngle((t * 52 + 12 * Math.sin(t * 0.25)) % 360);

		const angularVelocityRoll = (roll - this.lastPacket.orientation.roll) / safeDt;
		const angularVelocityPitch = (pitch - this.lastPacket.orientation.pitch) / safeDt;
		const angularVelocityYaw = (yaw - this.lastPacket.orientation.yaw) / safeDt;

		const triboelectricNoise = (Math.random() - 0.5) * 0.25;
		const triboelectricFromMotion = Math.abs(verticalVelocity) * 0.05;
		const triboelectricFromDrift = (Math.abs(velocityLatitude) + Math.abs(velocityLongitude)) * 0.015;
		const triboelectricVoltage = Math.max(
			0,
			triboelectricFromMotion + triboelectricFromDrift + triboelectricNoise + (fsmState === "04" ? 0.18 : 0),
		);

		const barometricAltitude = Math.max(0, altitude + (Math.random() - 0.5) * 2.2);
		const batteryVoltage = clamp(
			4.2 - (t / FLIGHT_DURATION_SECONDS) * 0.75 + (Math.random() - 0.5) * 0.03,
			3.45,
			4.2,
		);
		const accelerationTotal = Math.hypot(accelerationLatitude, accelerationLongitude, verticalAcceleration);

		const currentPacket: ParsedPacket = {
			timestampMs: now.getTime(),
			packetId: ++this.packetId,
			raw: {
				fsmState: fsmState,
				accelX: accelerationLatitude,
				accelY: accelerationLongitude,
				accelZ: verticalAcceleration,
				gyroX: angularVelocityRoll,
				gyroY: angularVelocityPitch,
				gyroZ: angularVelocityYaw,
				kfAltitudeAgl: Math.max(0, altitude),
				triboVoltageRaw: triboelectricVoltage,
				batteryVoltageRaw: batteryVoltage,
				gpsLatOffset: degreesToMicrodegreesOffset(latitude, BASE_LATITUDE),
				gpsLonOffset: degreesToMicrodegreesOffset(longitude, BASE_LONGITUDE),
				kfVerticalVelocity: verticalVelocity,
				ky024Analog: fsmState === "04" ? 1 : 0,
			},
			position: {
				latitude,
				longitude,
			},
			velocity: {
				altitude: verticalVelocity,
			},
			acceleration: {
				latitude: accelerationLatitude,
				longitude: accelerationLongitude,
				altitude: verticalAcceleration,
				total: accelerationTotal,
			},
			orientation: {
				roll,
				pitch,
				yaw: 0,
			},
			angularVelocity: {
				roll: angularVelocityRoll,
				pitch: angularVelocityPitch,
				yaw: angularVelocityYaw,
			},
			barometricAltitude,
			batteryVoltage,
			triboelectricVoltage,
			fsmState, // Outputs "00", "01", etc.
		};

		this.lastPacket = currentPacket;
		this.lastPacketAt = now;

		return currentPacket;
	}

	private createInitialPacket(now: Date): ParsedPacket {
		return {
			timestampMs: now.getTime(),
			packetId: ++this.packetId,
			raw: {
				fsmState: this.physics.fsmState,
				accelX: 0,
				accelY: 0,
				accelZ: 0,
				gyroX: 0,
				gyroY: 0,
				gyroZ: 0,
				kfAltitudeAgl: 0,
				triboVoltageRaw: 0,
				batteryVoltageRaw: 4.2,
				gpsLatOffset: degreesToMicrodegreesOffset(this.physics.latitude, BASE_LATITUDE),
				gpsLonOffset: degreesToMicrodegreesOffset(this.physics.longitude, BASE_LONGITUDE),
				kfVerticalVelocity: 0,
				ky024Analog: 0,
			},
			position: {
				latitude: this.physics.latitude,
				longitude: this.physics.longitude,
			},
			velocity: {
				altitude: 0,
			},
			acceleration: {
				latitude: 0,
				longitude: 0,
				altitude: 0,
				total: 0,
			},
			orientation: {
				roll: 0,
				pitch: 0,
				yaw: 0,
			},
			angularVelocity: {
				roll: 0,
				pitch: 0,
				yaw: 0,
			},
			barometricAltitude: 0,
			batteryVoltage: 4.2,
			triboelectricVoltage: 0,
			fsmState: this.physics.fsmState,
		};
	}

	private get isPacketLost() {
		return Math.random() < this.packetLossChance;
	}

	public stop() {
		logger.info("Stopping TelemetryEmulator...");
		clearInterval(this.interval);
	}
}
