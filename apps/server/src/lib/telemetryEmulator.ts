import { ValidPacket } from "@try-catch/shared-types";
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

export class TelemetryEmulator {
	private startedAt: Date;
	private packetLossChance: number;

	private lastPacketAt: Date;
	private lastPacket: ValidPacket["parsedData"];

	private interval: NodeJS.Timeout;

	public constructor(
		private readonly expectedPacketsPerSecond: number,
		private readonly onPacketCallback: (packet: ValidPacket["parsedData"]) => void,
	) {
		this.startedAt = new Date();
		this.packetLossChance = 0.03 + Math.random() * 0.1;

		this.lastPacketAt = new Date();
		this.lastPacket = {
			position: {
				latitude: BASE_LATITUDE + (Math.random() - 0.5) * 0.0005,
				longitude: BASE_LONGITUDE + (Math.random() - 0.5) * 0.0005,
				altitude: 0,
			},
			velocity: {
				latitude: 0,
				longitude: 0,
				altitude: 0,
				total: 0,
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
			barmetricAltitude: 0,
			batteryVoltage: 4.2,
			triboelectricVoltage: 0,
			launchDetected: false,
			apogeeDetected: false,
			parachuteDeployed: false,
		};

		this.interval = setInterval(() => {
			const packet = this.packet;

			if (packet) this.onPacketCallback(packet);
		}, 1000 / this.expectedPacketsPerSecond);

		logger.info(
			`TelemetryEmulator initialized with packet loss chance: ${(this.packetLossChance * 100).toFixed(2)}%`,
		);
	}

	public get packet(): ValidPacket["parsedData"] | null {
		if (this.isPacketLost) return null;

		const now = new Date();
		const elapsedMs = now.getTime() - this.startedAt.getTime();
		const dtSeconds = (now.getTime() - this.lastPacketAt.getTime()) / 1000;

		if (elapsedMs > FLIGHT_DURATION_SECONDS * 1000) {
			this.startedAt = now;
			this.lastPacketAt = now;
			this.lastPacket = {
				position: {
					latitude: BASE_LATITUDE + (Math.random() - 0.5) * 0.0005,
					longitude: BASE_LONGITUDE + (Math.random() - 0.5) * 0.0005,
					altitude: 0,
				},
				velocity: {
					latitude: 0,
					longitude: 0,
					altitude: 0,
					total: 0,
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
				barmetricAltitude: 0,
				batteryVoltage: 4.2,
				triboelectricVoltage: 0,
				launchDetected: false,
				apogeeDetected: false,
				parachuteDeployed: false,
			};
			return this.lastPacket;
		}

		const t = elapsedMs / 1000;

		const safeDt = clamp(dtSeconds, 0.02, 0.5);

		let altitude = this.lastPacket.position.altitude;
		let verticalVelocity = this.lastPacket.velocity.altitude;
		let verticalAcceleration = this.lastPacket.acceleration.altitude;
		let velocityLatitude = this.lastPacket.velocity.latitude;
		let velocityLongitude = this.lastPacket.velocity.longitude;
		let accelerationLatitude = this.lastPacket.acceleration.latitude;
		let accelerationLongitude = this.lastPacket.acceleration.longitude;
		let latitude = this.lastPacket.position.latitude;
		let longitude = this.lastPacket.position.longitude;

		let launchDetected = this.lastPacket.launchDetected;
		let apogeeDetected = this.lastPacket.apogeeDetected;
		let parachuteDeployed = this.lastPacket.parachuteDeployed;

		// Simulate a simplified launch profile with ascent, ballistic descent, and parachute drift.
		if (t > 0 && t <= FLIGHT_DURATION_SECONDS) {
			if (!launchDetected) {
				launchDetected = true;
				verticalVelocity = (4 * FLIGHT_APOGEE_METERS) / FLIGHT_DURATION_SECONDS;
			}

			verticalAcceleration = (-8 * FLIGHT_APOGEE_METERS) / (FLIGHT_DURATION_SECONDS * FLIGHT_DURATION_SECONDS);
			const windHeading = t * 0.11;
			const windBase = parachuteDeployed ? 10 : 4;
			const windGust = 1.7 * Math.sin(t * 0.2);
			const driftSpeed = windBase + windGust;

			velocityLatitude = driftSpeed * Math.cos(windHeading);
			velocityLongitude = driftSpeed * Math.sin(windHeading);

			accelerationLatitude = (velocityLatitude - this.lastPacket.velocity.latitude) / safeDt;
			accelerationLongitude = (velocityLongitude - this.lastPacket.velocity.longitude) / safeDt;

			verticalVelocity += verticalAcceleration * safeDt;
			altitude += verticalVelocity * safeDt;

			latitude += metersToLatitudeDelta(velocityLatitude * safeDt);
			longitude += metersToLongitudeDelta(velocityLongitude * safeDt, latitude);

			if (verticalVelocity <= 0 && !apogeeDetected) {
				apogeeDetected = true;
				parachuteDeployed = true;
			}

			if (parachuteDeployed) {
				verticalVelocity = Math.max(verticalVelocity, -7.5);
				verticalAcceleration = Math.max(verticalAcceleration, -2.5);
			}

			altitude += (Math.random() - 0.5) * safeDt * 0.8;
		} else if (t > FLIGHT_DURATION_SECONDS) {
			altitude = 0;
			verticalVelocity = 0;
			verticalAcceleration = 0;
			velocityLatitude = 0;
			velocityLongitude = 0;
			accelerationLatitude = 0;
			accelerationLongitude = 0;
		}

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
			triboelectricFromMotion + triboelectricFromDrift + triboelectricNoise + (parachuteDeployed ? 0.18 : 0),
		);

		const barometricAltitude = Math.max(0, altitude + (Math.random() - 0.5) * 2.2);
		const batteryVoltage = clamp(
			4.2 - (t / FLIGHT_DURATION_SECONDS) * 0.75 + (Math.random() - 0.5) * 0.03,
			3.45,
			4.2,
		);
		const velocityTotal = Math.hypot(velocityLatitude, velocityLongitude, verticalVelocity);
		const accelerationTotal = Math.hypot(accelerationLatitude, accelerationLongitude, verticalAcceleration);

		const currentPacket: ValidPacket["parsedData"] = {
			...this.lastPacket,
			position: {
				latitude,
				longitude,
				altitude: Math.max(0, altitude),
			},
			velocity: {
				latitude: velocityLatitude,
				longitude: velocityLongitude,
				altitude: verticalVelocity,
				total: velocityTotal,
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
				yaw,
			},
			angularVelocity: {
				roll: angularVelocityRoll,
				pitch: angularVelocityPitch,
				yaw: angularVelocityYaw,
			},
			barmetricAltitude: barometricAltitude,
			batteryVoltage,
			triboelectricVoltage,
			launchDetected,
			apogeeDetected,
			parachuteDeployed,
		};

		this.lastPacket = currentPacket;
		this.lastPacketAt = now;

		return currentPacket;
	}

	private get isPacketLost() {
		return Math.random() < this.packetLossChance;
	}

	public stop() {
		logger.info("Stopping TelemetryEmulator...");
		clearInterval(this.interval);
	}
}
