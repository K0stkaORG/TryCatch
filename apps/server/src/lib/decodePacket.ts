import { Packet } from "@try-catch/shared-types";

const PACKET_LENGTH_BYTES = 29;
const SEA_LEVEL_PRESSURE_PA = 101_720;
const BASE_LATITUDE = 49.7983333333;
const BASE_LONGITUDE = 16.6866666667;
const GPS_OFFSET_SCALE_DEGREES = 1e-5;
const ACCEL_G_PER_LSB = 1 / 4096;
const GYRO_DPS_PER_LSB = 1 / 131;
const G = 9.80665;
const BATTERY_VOLT_PER_LSB = 0.02;
const TRIBO_VOLT_PER_LSB = 0.001;

const metersPerDegreeLatitude = 111_320;
const metersPerDegreeLongitude = (latitude: number) => 111_320 * Math.max(0.2, Math.cos((latitude * Math.PI) / 180));
const ORIENTATION_FILTER_ALPHA = 0.98;

const toDegrees = (radians: number) => (radians * 180) / Math.PI;

let lastTimestampMs: number | null = null;
let lastPosition: {
	latitude: number;
	longitude: number;
	altitude: number;
} | null = null;
let orientationEstimate: {
	roll: number;
	pitch: number;
	yaw: number;
} | null = null;

export const decodePacket = (data: Buffer): Packet["parsedData"] => {
	if (data.length !== PACKET_LENGTH_BYTES) return null;

	let offset = 0;
	const timestampMs = data.readUInt16LE(offset);
	offset += 2;
	const packetId = data.readUInt8(offset);
	offset += 1;
	const stateFlags = data.readUInt8(offset);
	offset += 1;

	const accelX = data.readInt16LE(offset);
	offset += 2;
	const accelY = data.readInt16LE(offset);
	offset += 2;
	const accelZ = data.readInt16LE(offset);
	offset += 2;
	const gyroX = data.readInt16LE(offset);
	offset += 2;
	const gyroY = data.readInt16LE(offset);
	offset += 2;
	const gyroZ = data.readInt16LE(offset);
	offset += 2;

	const pressureScaled = data.readUInt16LE(offset);
	offset += 2;
	const triboVoltageRaw = data.readUInt16LE(offset);
	offset += 2;
	const batteryVoltageRaw = data.readUInt8(offset);
	offset += 1;

	const gpsLatOffset = data.readInt16LE(offset);
	offset += 2;
	const gpsLonOffset = data.readInt16LE(offset);
	offset += 2;
	const gpsAltMeters = data.readInt16LE(offset);
	offset += 2;
	const ky024Analog = data.readUInt16LE(offset);
	offset += 2;

	const latitude = BASE_LATITUDE + gpsLatOffset * GPS_OFFSET_SCALE_DEGREES;
	const longitude = BASE_LONGITUDE + gpsLonOffset * GPS_OFFSET_SCALE_DEGREES;
	const altitude = gpsAltMeters;

	const accelLatitude = accelX * ACCEL_G_PER_LSB * G;
	const accelLongitude = accelY * ACCEL_G_PER_LSB * G;
	const accelAltitude = accelZ * ACCEL_G_PER_LSB * G;

	const accelRoll = Math.atan2(accelLongitude, accelAltitude);
	const accelPitch = Math.atan2(-accelLatitude, Math.hypot(accelLongitude, accelAltitude));

	const deltaMs = lastTimestampMs === null ? 0 : (timestampMs - lastTimestampMs + 65_536) % 65_536;
	const deltaSeconds = deltaMs / 1000;

	const gyroRollRate = (gyroX * GYRO_DPS_PER_LSB * Math.PI) / 180;
	const gyroPitchRate = (gyroY * GYRO_DPS_PER_LSB * Math.PI) / 180;
	const gyroYawRate = (gyroZ * GYRO_DPS_PER_LSB * Math.PI) / 180;

	if (!orientationEstimate) {
		orientationEstimate = {
			roll: accelRoll,
			pitch: accelPitch,
			yaw: 0,
		};
	} else if (deltaSeconds > 0) {
		const rollFromGyro = orientationEstimate.roll + gyroRollRate * deltaSeconds;
		const pitchFromGyro = orientationEstimate.pitch + gyroPitchRate * deltaSeconds;
		const yawFromGyro = orientationEstimate.yaw + gyroYawRate * deltaSeconds;

		orientationEstimate = {
			roll: ORIENTATION_FILTER_ALPHA * rollFromGyro + (1 - ORIENTATION_FILTER_ALPHA) * accelRoll,
			pitch: ORIENTATION_FILTER_ALPHA * pitchFromGyro + (1 - ORIENTATION_FILTER_ALPHA) * accelPitch,
			yaw: yawFromGyro,
		};
	}

	const gravityX = -Math.sin(orientationEstimate.roll) * G;
	const gravityY = Math.sin(orientationEstimate.roll) * Math.cos(orientationEstimate.pitch) * G;
	const gravityZ = Math.cos(orientationEstimate.roll) * Math.cos(orientationEstimate.pitch) * G;

	const linearAccelLatitude = accelLatitude - gravityX;
	const linearAccelLongitude = accelLongitude - gravityY;
	const linearAccelAltitude = accelAltitude - gravityZ;
	const accelerationTotal = Math.hypot(linearAccelLatitude, linearAccelLongitude, linearAccelAltitude);

	const angularVelocityRoll = gyroX * GYRO_DPS_PER_LSB;
	const angularVelocityPitch = gyroY * GYRO_DPS_PER_LSB;
	const angularVelocityYaw = gyroZ * GYRO_DPS_PER_LSB;

	const roll = toDegrees(orientationEstimate.roll);
	const pitch = toDegrees(orientationEstimate.pitch);
	const yaw = ((toDegrees(orientationEstimate.yaw) % 360) + 360) % 360;

	const pressurePa = pressureScaled * 2;
	const barmetricAltitude = pressurePa > 0 ? 44330 * (1 - Math.pow(pressurePa / SEA_LEVEL_PRESSURE_PA, 0.1903)) : 0;

	const batteryVoltage = batteryVoltageRaw * BATTERY_VOLT_PER_LSB;
	const triboelectricVoltage = triboVoltageRaw * TRIBO_VOLT_PER_LSB;

	let velocityLatitude = 0;
	let velocityLongitude = 0;
	let velocityAltitude = 0;

	if (lastTimestampMs !== null && lastPosition && deltaSeconds > 0) {
		const deltaLatMeters = (latitude - lastPosition.latitude) * metersPerDegreeLatitude;
		const deltaLonMeters = (longitude - lastPosition.longitude) * metersPerDegreeLongitude(latitude);

		velocityLatitude = deltaLatMeters / deltaSeconds;
		velocityLongitude = deltaLonMeters / deltaSeconds;
		velocityAltitude = (altitude - lastPosition.altitude) / deltaSeconds;
	}

	lastTimestampMs = timestampMs;
	lastPosition = { latitude, longitude, altitude };

	const velocityTotal = Math.hypot(velocityLatitude, velocityLongitude, velocityAltitude);

	return {
		timestampMs,
		packetId,
		raw: {
			stateFlags,
			accelX,
			accelY,
			accelZ,
			gyroX,
			gyroY,
			gyroZ,
			pressureScaled,
			triboVoltageRaw,
			batteryVoltageRaw,
			gpsLatOffset,
			gpsLonOffset,
			gpsAltMeters,
			ky024Analog,
		},
		position: {
			latitude,
			longitude,
			altitude,
		},
		velocity: {
			latitude: velocityLatitude,
			longitude: velocityLongitude,
			altitude: velocityAltitude,
			total: velocityTotal,
		},
		acceleration: {
			latitude: linearAccelLatitude,
			longitude: linearAccelLongitude,
			altitude: linearAccelAltitude,
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
		barmetricAltitude,
		batteryVoltage,
		triboelectricVoltage,
		launchDetected: (stateFlags & 0b0000_0001) !== 0,
		apogeeDetected: (stateFlags & 0b0000_0010) !== 0,
		parachuteDeployed: (stateFlags & 0b0000_0100) !== 0,
	};
};
