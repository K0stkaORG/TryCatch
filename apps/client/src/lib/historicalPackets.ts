import { FinishedFlightDataResponse } from "@try-catch/shared-types";

import { CircularBuffer, CoarseCircularBuffer } from "./circularBuffer";

type FlightPacket = FinishedFlightDataResponse["flightPackets"][number];
type ValidFlightPacket = FlightPacket & {
	parsedData: NonNullable<FlightPacket["parsedData"]>;
};

type PacketStreams = {
	position: {
		latlong: CircularBuffer<[number, number]>;
		altitude: CircularBuffer<number>;
	};
	velocity: {
		latitude: CircularBuffer<number>;
		longitude: CircularBuffer<number>;
		altitude: CircularBuffer<number>;
		total: CircularBuffer<number>;
	};
	acceleration: {
		latitude: CircularBuffer<number>;
		longitude: CircularBuffer<number>;
		altitude: CircularBuffer<number>;
		total: CircularBuffer<number>;
	};
	orientation: {
		roll: CircularBuffer<number>;
		pitch: CircularBuffer<number>;
		yaw: CircularBuffer<number>;
	};
	flags: {
		launchDetected: CircularBuffer<boolean>;
		apogeeDetected: CircularBuffer<boolean>;
		parachuteDeployed: CircularBuffer<boolean>;
	};
	positionGraph: CircularBuffer<{
		receivedAt: number;
		altitudeGPS: number;
		altitudeBarometric: number;
		altitudeVelocity: number;
		totalVelocity: number;
		altitudeAcceleration: number;
		totalAcceleration: number;
	}>;
	barometricAltitude: CircularBuffer<number>;
	batteryVoltage: CircularBuffer<number>;
	batteryGraph: CircularBuffer<{
		receivedAt: number;
		value: number;
	}>;
	triboelectricVoltage: CircularBuffer<{
		receivedAt: number;
		value: number;
	}>;
	statusGraph: CircularBuffer<{
		receivedAt: number;
		launchDetected: boolean;
		apogeeDetected: boolean;
		parachuteDeployed: boolean;
	}>;
	packetLoss: CircularBuffer<number>;
	deadReckoningHistory: CircularBuffer<{
		receivedAt: number;
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
	}>;
};

export const createHistoricalPacketStreams = (packets: FlightPacket[]) => {
	const validPackets: ValidFlightPacket[] = [...packets]
		.filter((packet): packet is ValidFlightPacket => packet.parsedData !== null)
		.sort((a, b) => new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime());

	const count = Math.max(validPackets.length, 1);
	const now = Date.now();

	const packetStreams: PacketStreams = {
		position: {
			latlong: new CircularBuffer<[number, number]>(count, [0, 0]),
			altitude: new CircularBuffer(count, 0),
		},
		velocity: {
			latitude: new CircularBuffer(count, 0),
			longitude: new CircularBuffer(count, 0),
			altitude: new CircularBuffer(count, 0),
			total: new CircularBuffer(count, 0),
		},
		acceleration: {
			latitude: new CircularBuffer(count, 0),
			longitude: new CircularBuffer(count, 0),
			altitude: new CircularBuffer(count, 0),
			total: new CircularBuffer(count, 0),
		},
		orientation: {
			roll: new CircularBuffer(count, 0),
			pitch: new CircularBuffer(count, 0),
			yaw: new CircularBuffer(count, 0),
		},
		flags: {
			launchDetected: new CircularBuffer(count, false),
			apogeeDetected: new CircularBuffer(count, false),
			parachuteDeployed: new CircularBuffer(count, false),
		},
		positionGraph: new CoarseCircularBuffer(
			count,
			{
				receivedAt: now,
				altitudeGPS: 0,
				altitudeBarometric: 0,
				altitudeVelocity: 0,
				totalVelocity: 0,
				altitudeAcceleration: 0,
				totalAcceleration: 0,
			},
			1,
		),
		barometricAltitude: new CircularBuffer(count, 0),
		batteryVoltage: new CircularBuffer(count, 0),
		batteryGraph: new CoarseCircularBuffer(
			count,
			{
				receivedAt: now,
				value: 0,
			},
			1,
		),
		triboelectricVoltage: new CoarseCircularBuffer(
			count,
			{
				receivedAt: now,
				value: 0,
			},
			1,
		),
		statusGraph: new CoarseCircularBuffer(
			count,
			{
				receivedAt: now,
				launchDetected: false,
				apogeeDetected: false,
				parachuteDeployed: false,
			},
			1,
		),
		packetLoss: new CircularBuffer(1, 0),
		deadReckoningHistory: new CircularBuffer(count, {
			receivedAt: 0,
			position: { latitude: 0, longitude: 0, altitude: 0 },
			velocity: { latitude: 0, longitude: 0, altitude: 0 },
			acceleration: { latitude: 0, longitude: 0, altitude: 0 },
		}),
	};

	for (const packet of validPackets) {
		const parsed = packet.parsedData;
		const receivedAt = new Date(packet.receivedAt).getTime();

		packetStreams.position.latlong.push([parsed.position.latitude, parsed.position.longitude]);
		packetStreams.position.altitude.push(parsed.position.altitude);

		packetStreams.velocity.latitude.push(parsed.velocity.latitude);
		packetStreams.velocity.longitude.push(parsed.velocity.longitude);
		packetStreams.velocity.altitude.push(parsed.velocity.altitude);
		packetStreams.velocity.total.push(parsed.velocity.total);

		packetStreams.acceleration.latitude.push(parsed.acceleration.latitude);
		packetStreams.acceleration.longitude.push(parsed.acceleration.longitude);
		packetStreams.acceleration.altitude.push(parsed.acceleration.altitude);
		packetStreams.acceleration.total.push(parsed.acceleration.total);

		packetStreams.orientation.roll.push(parsed.orientation.roll);
		packetStreams.orientation.pitch.push(parsed.orientation.pitch);
		packetStreams.orientation.yaw.push(parsed.orientation.yaw);

		packetStreams.flags.launchDetected.push(parsed.launchDetected);
		packetStreams.flags.apogeeDetected.push(parsed.apogeeDetected);
		packetStreams.flags.parachuteDeployed.push(parsed.parachuteDeployed);

		packetStreams.positionGraph.push({
			receivedAt,
			altitudeGPS: parsed.position.altitude,
			altitudeBarometric: parsed.barometricAltitude,
			altitudeVelocity: parsed.velocity.altitude,
			totalVelocity: parsed.velocity.total,
			altitudeAcceleration: parsed.acceleration.altitude,
			totalAcceleration: parsed.acceleration.total,
		});

		packetStreams.barometricAltitude.push(parsed.barometricAltitude);
		packetStreams.batteryVoltage.push(parsed.batteryVoltage);
		packetStreams.batteryGraph.push({
			receivedAt,
			value: parsed.batteryVoltage,
		});

		packetStreams.triboelectricVoltage.push({
			receivedAt,
			value: parsed.triboelectricVoltage,
		});

		packetStreams.statusGraph.push({
			receivedAt,
			launchDetected: parsed.launchDetected,
			apogeeDetected: parsed.apogeeDetected,
			parachuteDeployed: parsed.parachuteDeployed,
		});

		packetStreams.deadReckoningHistory.push({
			receivedAt,
			position: {
				latitude: parsed.position.latitude,
				longitude: parsed.position.longitude,
				altitude: parsed.position.altitude,
			},
			velocity: {
				latitude: parsed.velocity.latitude,
				longitude: parsed.velocity.longitude,
				altitude: parsed.velocity.altitude,
			},
			acceleration: {
				latitude: parsed.acceleration.latitude,
				longitude: parsed.acceleration.longitude,
				altitude: parsed.acceleration.altitude,
			},
		});
	}

	const lastPacket = validPackets[validPackets.length - 1];

	return {
		packetStreams,
		parsedPackets: validPackets,
		lastPacketReceivedAt: lastPacket ? new Date(lastPacket.receivedAt).getTime() : null,
	};
};
