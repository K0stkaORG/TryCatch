export type ValidPacket = {
	id: number;
	flightId: number;
	rawBytes: string;
	parsedData: {
		timestampMs: number;
		packetId: number;
		raw: {
			stateFlags: number;
			accelX: number;
			accelY: number;
			accelZ: number;
			gyroX: number;
			gyroY: number;
			gyroZ: number;
			pressureScaled: number;
			triboVoltageRaw: number;
			batteryVoltageRaw: number;
			gpsLatOffset: number;
			gpsLonOffset: number;
			gpsAltMeters: number;
			ky024Analog: number;
		};

		position: {
			latitude: number;
			longitude: number;
			altitude: number;
		};
		velocity: {
			latitude: number;
			longitude: number;
			altitude: number;
			total: number;
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

		launchDetected: boolean;
		apogeeDetected: boolean;
		parachuteDeployed: boolean;
	};
	receivedAt: Date;
};

export type Packet = Omit<ValidPacket, "parsedData"> & {
	parsedData: ValidPacket["parsedData"] | null;
};
