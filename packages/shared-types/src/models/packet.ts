export const RocketFSMStates = {
	"00": "Before Launch",
	"01": "Armed",
	"02": "Flight",
	"03": "Apogee Reached",
	"04": "Chute Deployed",
} as const;

export type RocketFSMState = keyof typeof RocketFSMStates;

export type ValidPacket = {
	id: number;
	flightId: number;
	rawBytes: string;
	parsedData: {
		timestampMs: number;
		packetId: number;
		raw: {
			fsmState: string;
			accelX: number;
			accelY: number;
			accelZ: number;
			gyroX: number;
			gyroY: number;
			gyroZ: number;
			kfAltitudeAgl: number;
			triboVoltageRaw: number;
			batteryVoltageRaw: number;
			gpsLatOffset: number;
			gpsLonOffset: number;
			kfVerticalVelocity: number;
			ky024Analog: number;
		};

		position: {
			latitude: number;
			longitude: number;
		};
		velocity: {
			altitude: number;
		};
		acceleration: {
			latitude: number;
			longitude: number;
			altitude: number;
			total: number;
		};

		orientation: {
			roll: number;
			pitch: number;
			yaw: number;
		};
		angularVelocity: {
			roll: number;
			pitch: number;
			yaw: number;
		};

		barometricAltitude: number;

		batteryVoltage: number;

		triboelectricVoltage: number;

		fsmState: RocketFSMState;
	};
	receivedAt: Date;
};

export type Packet = Omit<ValidPacket, "parsedData"> & {
	parsedData: ValidPacket["parsedData"] | null;
};
