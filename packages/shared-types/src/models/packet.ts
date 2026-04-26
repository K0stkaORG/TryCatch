export type ValidPacket = {
	id: number;
	flightId: number;
	rawBytes: string;
	parsedData: {
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

		barmetricAltitude: number;

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
