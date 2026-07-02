/* eslint-disable react-hooks/purity */
import {
	ClientToServerEvents,
	Flight,
	RocketFSMState,
	ServerToClientEvents,
	ValidPacket,
} from "@try-catch/shared-types";
import { useEffect, useState } from "react";
import { Socket, io } from "socket.io-client";

import { useNavigate } from "react-router";
import { toast } from "sonner";
import { CircularBuffer, CoarseCircularBuffer } from "./circularBuffer";

export const PACKET_BUFFER_SIZE = 80;
export const PACKET_LOSS_BUFFER_SIZE = 10;

const isDevelopment = import.meta.env.DEV;

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(isDevelopment ? "http://localhost:3000" : "/", {
	autoConnect: false,
});

export const usePackets = (flightId: Flight["id"]) => {
	const navigate = useNavigate();

	const [connected, setConnected] = useState(socket.connected);

	const [packetHeartbeat, setPacketHeartbeat] = useState(0);
	const [packetLossHeartbeat, setPacketLossHeartbeat] = useState(0);

	const [packetStreams] = useState({
		gpsPosition: {
			latlong: new CircularBuffer<[number, number]>(PACKET_BUFFER_SIZE, [0, 0]),
		},
		velocity: {
			altitude: new CircularBuffer(1, 0),
		},
		acceleration: {
			latitude: new CircularBuffer(1, 0),
			longitude: new CircularBuffer(1, 0),
			altitude: new CircularBuffer(1, 0),
			total: new CircularBuffer(1, 0),
		},
		orientation: {
			roll: new CircularBuffer(1, 0),
			pitch: new CircularBuffer(1, 0),
			yaw: new CircularBuffer(1, 0),
		},
		fsmState: new CircularBuffer<RocketFSMState>(1, "00"),
		positionGraph: new CoarseCircularBuffer<{
			receivedAt: number;
			altitudeBarometric: number;
			altitudeVelocity: number;
			altitudeAcceleration: number;
			totalAcceleration: number;
		}>(
			PACKET_BUFFER_SIZE,
			{
				receivedAt: Date.now(),
				altitudeBarometric: 0,
				altitudeVelocity: 0,
				altitudeAcceleration: 0,
				totalAcceleration: 0,
			},
			2,
		),
		barometricAltitude: new CircularBuffer(1, 0),
		batteryVoltage: new CircularBuffer(1, 0),
		triboelectricVoltage: new CoarseCircularBuffer<{
			receivedAt: number;
			value: number;
		}>(
			PACKET_BUFFER_SIZE,
			{
				receivedAt: Date.now(),
				value: 0,
			},
			1,
		),
		packetLoss: new CircularBuffer(PACKET_LOSS_BUFFER_SIZE, 0),
	});

	const handlePacket = (packet: Pick<ValidPacket, "receivedAt" | "parsedData">) => {
		const receivedAt = new Date(packet.receivedAt).getTime();

		packetStreams.gpsPosition.latlong.push([
			packet.parsedData.position.latitude,
			packet.parsedData.position.longitude,
		]);

		packetStreams.velocity.altitude.push(packet.parsedData.velocity.altitude);

		packetStreams.acceleration.latitude.push(packet.parsedData.acceleration.latitude);
		packetStreams.acceleration.longitude.push(packet.parsedData.acceleration.longitude);
		packetStreams.acceleration.altitude.push(packet.parsedData.acceleration.altitude);
		packetStreams.acceleration.total.push(packet.parsedData.acceleration.total);

		packetStreams.orientation.roll.push(packet.parsedData.orientation.roll);
		packetStreams.orientation.pitch.push(packet.parsedData.orientation.pitch);
		packetStreams.orientation.yaw.push(packet.parsedData.orientation.yaw);

		packetStreams.fsmState.push(packet.parsedData.fsmState);

		packetStreams.positionGraph.push({
			receivedAt,
			altitudeBarometric: packet.parsedData.barometricAltitude,
			altitudeVelocity: packet.parsedData.velocity.altitude,
			altitudeAcceleration: packet.parsedData.acceleration.altitude,
			totalAcceleration: packet.parsedData.acceleration.total,
		});

		packetStreams.barometricAltitude.push(packet.parsedData.barometricAltitude);

		packetStreams.batteryVoltage.push(packet.parsedData.batteryVoltage);

		packetStreams.triboelectricVoltage.push({
			receivedAt,
			value: packet.parsedData.triboelectricVoltage,
		});

		setPacketHeartbeat(Date.now());
	};

	useEffect(() => {
		socket.connect();

		socket.on("connect", () => setConnected(true));
		socket.on("disconnect", () => setConnected(false));

		socket.on("initialSync", ({ packets }) => packets.forEach(handlePacket));

		socket.on("packet", ({ packet }) => handlePacket(packet));

		socket.on("packetLoss", ({ percentLoss }) => {
			packetStreams.packetLoss.push(percentLoss);

			setPacketLossHeartbeat(Date.now());
		});

		socket.on("flightEnded", () => {
			toast.warning("The flight has ended.");

			setTimeout(() => navigate(`/flight/${flightId}`), 50);
		});

		return () => {
			socket.off("connect");
			socket.off("disconnect");

			socket.off("initialSync");

			socket.off("packet");
			socket.off("packetLoss");
			socket.off("flightEnded");

			setConnected(false);

			socket.disconnect();
		};
	}, [flightId, navigate, handlePacket]);

	return {
		connected,
		packetStreams,
		packetHeartbeat,
		packetLossHeartbeat,
	};
};
