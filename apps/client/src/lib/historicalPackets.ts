import { FinishedFlightDataResponse, RocketFSMState } from "@try-catch/shared-types";

import { CircularBuffer } from "./circularBuffer";

type FlightPacket = FinishedFlightDataResponse["flightPackets"][number];
type ValidFlightPacket = FlightPacket & {
	parsedData: NonNullable<FlightPacket["parsedData"]>;
};

export const createHistoricalPacketStreams = (packets: FlightPacket[]) => {
	const validPackets: ValidFlightPacket[] = [...packets]
		.filter((packet): packet is ValidFlightPacket => packet.parsedData !== null)
		.sort((a, b) => new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime());

	const count = Math.max(validPackets.length, 1);
	const now = Date.now();

	const packetStreams = {
		gpsPosition: {
			latlong: new CircularBuffer<[number, number]>(count, [0, 0]),
		},
		fsmState: new CircularBuffer<{
			receivedAt: number;
			fsmState: RocketFSMState;
		}>(count, { receivedAt: now, fsmState: "00" }),
		positionGraph: new CircularBuffer(count, {
			receivedAt: now,
			altitudeBarometric: 0,
			altitudeVelocity: 0,
			altitudeAcceleration: 0,
			totalAcceleration: 0,
		}),
		pressureHpaGraph: new CircularBuffer(count, {
			receivedAt: now,
			value: 0,
		}),
		batteryGraph: new CircularBuffer(count, {
			receivedAt: now,
			value: 0,
		}),
		hallSensorGraph: new CircularBuffer(count, {
			receivedAt: now,
			value: 0,
		}),
		triboelectricVoltage: new CircularBuffer(count, {
			receivedAt: now,
			value: 0,
		}),
	} as const;

	for (const packet of validPackets) {
		const parsed = packet.parsedData;
		const receivedAt = new Date(packet.receivedAt).getTime();

		packetStreams.gpsPosition.latlong.push([parsed.position.latitude, parsed.position.longitude]);

		packetStreams.positionGraph.push({
			receivedAt,
			altitudeBarometric: parsed.barometricAltitude,
			altitudeVelocity: parsed.velocity.altitude,
			altitudeAcceleration: parsed.acceleration.altitude,
			totalAcceleration: parsed.acceleration.total,
		});

		packetStreams.pressureHpaGraph.push({
			receivedAt,
			value: parsed.pressureHpa,
		});

		packetStreams.batteryGraph.push({
			receivedAt,
			value: parsed.batteryVoltage,
		});

		packetStreams.hallSensorGraph.push({
			receivedAt,
			value: parsed.hallSensor,
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
