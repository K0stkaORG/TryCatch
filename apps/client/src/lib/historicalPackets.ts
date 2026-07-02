import { FinishedFlightDataResponse, RocketFSMState } from "@try-catch/shared-types";

import { CircularBuffer } from "./circularBuffer";

type FlightPacket = FinishedFlightDataResponse["flightPackets"][number];
type ValidFlightPacket = FlightPacket & {
	parsedData: NonNullable<FlightPacket["parsedData"]>;
};

type PacketStreams = {
	gpsPosition: {
		latlong: CircularBuffer<[number, number]>;
	};
	velocity: {
		altitude: CircularBuffer<number>;
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
	fsmState: CircularBuffer<{
		receivedAt: number;
		fsmState: RocketFSMState;
	}>;
	positionGraph: CircularBuffer<{
		receivedAt: number;
		altitudeBarometric: number;
		altitudeVelocity: number;
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
};

export const createHistoricalPacketStreams = (packets: FlightPacket[]) => {
	const validPackets: ValidFlightPacket[] = [...packets]
		.filter((packet): packet is ValidFlightPacket => packet.parsedData !== null)
		.sort((a, b) => new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime());

	const count = Math.max(validPackets.length, 1);
	const now = Date.now();

	const packetStreams: PacketStreams = {
		gpsPosition: {
			latlong: new CircularBuffer<[number, number]>(count, [0, 0]),
		},
		velocity: {
			altitude: new CircularBuffer(count, 0),
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
		fsmState: new CircularBuffer(count, { receivedAt: now, fsmState: "00" }),
		positionGraph: new CircularBuffer(count, {
			receivedAt: now,
			altitudeBarometric: 0,
			altitudeVelocity: 0,
			altitudeAcceleration: 0,
			totalAcceleration: 0,
		}),
		barometricAltitude: new CircularBuffer(count, 0),
		batteryVoltage: new CircularBuffer(count, 0),
		batteryGraph: new CircularBuffer(count, {
			receivedAt: now,
			value: 0,
		}),
		triboelectricVoltage: new CircularBuffer(count, {
			receivedAt: now,
			value: 0,
		}),
	};

	for (const packet of validPackets) {
		const parsed = packet.parsedData;
		const receivedAt = new Date(packet.receivedAt).getTime();

		packetStreams.gpsPosition.latlong.push([parsed.position.latitude, parsed.position.longitude]);

		packetStreams.velocity.altitude.push(parsed.velocity.altitude);

		packetStreams.acceleration.latitude.push(parsed.acceleration.latitude);
		packetStreams.acceleration.longitude.push(parsed.acceleration.longitude);
		packetStreams.acceleration.altitude.push(parsed.acceleration.altitude);
		packetStreams.acceleration.total.push(parsed.acceleration.total);

		packetStreams.orientation.roll.push(parsed.orientation.roll);
		packetStreams.orientation.pitch.push(parsed.orientation.pitch);
		packetStreams.orientation.yaw.push(parsed.orientation.yaw);

		packetStreams.positionGraph.push({
			receivedAt,
			altitudeBarometric: parsed.barometricAltitude,
			altitudeVelocity: parsed.velocity.altitude,
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

		packetStreams.fsmState.push({
			receivedAt,
			fsmState: parsed.fsmState,
		});
	}

	const lastPacket = validPackets[validPackets.length - 1];

	return {
		packetStreams,
		parsedPackets: validPackets,
		firstPacketReceivedAt: validPackets.length > 0 ? new Date(validPackets[0].receivedAt).getTime() : null,
		lastPacketReceivedAt: lastPacket ? new Date(lastPacket.receivedAt).getTime() : null,
	};
};
