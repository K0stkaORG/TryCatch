import { Packet, RocketFSMState } from "@try-catch/shared-types";

const PACKET_LENGTH_BYTES = 29;

// // REAL
// const BASE_LATITUDE = 49.7983333333;
// const BASE_LONGITUDE = 16.6866666667;

// DEBUG
const BASE_LATITUDE = 49.161;
const BASE_LONGITUDE = 16.56133;

const GPS_OFFSET_SCALE_DEGREES = 1e-5;
const ACCEL_G_PER_LSB = 1 / 16384.0;
const GYRO_DPS_PER_LSB = 1 / 16.4;
const G = 9.80665;
const BATTERY_VOLT_PER_LSB = 0.02;
const TRIBO_VOLT_PER_LSB = 0.001;

const toDegrees = (radians: number) => (radians * 180) / Math.PI;

export const decodePacket = (data: Buffer): Packet["parsedData"] => {
	if (data.length !== PACKET_LENGTH_BYTES) return null;

	let offset = 0;
	const timestampMs = data.readUInt16LE(offset);
	offset += 2;
	const packetId = data.readUInt8(offset);
	offset += 1;
	const fsmState = data.readUInt8(offset).toString(16).padStart(2, "0").toUpperCase();
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

	// New spec layout mapped to original keys
	const kfAltitudeAgl = data.readInt16LE(offset);
	offset += 2;
	const triboVoltageRaw = data.readUInt16LE(offset);
	offset += 2;
	const batteryVoltageRaw = data.readUInt8(offset);
	offset += 1;

	const gpsLatOffset = data.readInt16LE(offset);
	offset += 2;
	const gpsLonOffset = data.readInt16LE(offset);
	offset += 2;
	const kfVerticalVelocity = data.readInt16LE(offset);
	offset += 2;
	const ky024Analog = data.readUInt16LE(offset);
	offset += 2;

	// Physical Unit Conversions
	const latitude = BASE_LATITUDE + gpsLatOffset * GPS_OFFSET_SCALE_DEGREES;
	const longitude = BASE_LONGITUDE + gpsLonOffset * GPS_OFFSET_SCALE_DEGREES;

	const accelLatitude = accelX * ACCEL_G_PER_LSB * G;
	const accelLongitude = accelY * ACCEL_G_PER_LSB * G;
	const accelAltitude = accelZ * ACCEL_G_PER_LSB * G;

	// --- Gravity Compensation Logic ---
	// Calculate instantaneous pitch and roll from the accelerometer vector
	const rollRad = Math.atan2(accelLongitude, accelAltitude);
	const pitchRad = Math.atan2(-accelLatitude, Math.hypot(accelLongitude, accelAltitude));

	// Project the gravity vector components into the rocket's current frame
	const gravityX = -Math.sin(pitchRad) * G;
	const gravityY = Math.sin(rollRad) * Math.cos(pitchRad) * G;
	const gravityZ = Math.cos(rollRad) * Math.cos(pitchRad) * G;

	// Subtract gravity from measured acceleration to isolate true linear acceleration
	const linearAccelX = accelLatitude - gravityX;
	const linearAccelY = accelLongitude - gravityY;
	const linearAccelZ = accelAltitude - gravityZ;
	// ----------------------------------

	const angularVelocityRoll = gyroX * GYRO_DPS_PER_LSB;
	const angularVelocityPitch = gyroY * GYRO_DPS_PER_LSB;
	const angularVelocityYaw = gyroZ * GYRO_DPS_PER_LSB;

	const batteryVoltage = batteryVoltageRaw * BATTERY_VOLT_PER_LSB;
	const triboelectricVoltage = triboVoltageRaw * TRIBO_VOLT_PER_LSB;

	return {
		timestampMs,
		packetId,
		raw: {
			fsmState,
			accelX,
			accelY,
			accelZ,
			gyroX,
			gyroY,
			gyroZ,
			kfAltitudeAgl,
			triboVoltageRaw,
			batteryVoltageRaw,
			gpsLatOffset,
			gpsLonOffset,
			kfVerticalVelocity,
			ky024Analog,
		},
		position: {
			latitude,
			longitude,
		},
		velocity: {
			altitude: kfVerticalVelocity,
		},
		acceleration: {
			latitude: linearAccelX,
			longitude: linearAccelY,
			altitude: linearAccelZ,
			total: Math.hypot(linearAccelX, linearAccelY, linearAccelZ),
		},
		orientation: {
			roll: toDegrees(rollRad),
			pitch: toDegrees(pitchRad),
			yaw: 0, // Yaw cannot be derived solely from acceleration
		},
		angularVelocity: {
			roll: angularVelocityRoll,
			pitch: angularVelocityPitch,
			yaw: angularVelocityYaw,
		},
		barometricAltitude: kfAltitudeAgl,
		batteryVoltage,
		triboelectricVoltage,
		fsmState: fsmState as RocketFSMState,
	};
};
