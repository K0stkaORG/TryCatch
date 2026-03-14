export type Packet = {
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
		};
		acceleration: {
			latitude: number;
			longitude: number;
			altitude: number;
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
	} | null;
	receivedAt: Date;
};
