import { Loader2, OctagonX } from "lucide-react";

import { ExperimentGraph } from "@/components/active-flight/ExperimentGraph";
import { Map } from "@/components/active-flight/Map";
import { PacketLossGraph } from "@/components/active-flight/PacketLossGraph";
import { PositionGraphs } from "@/components/active-flight/PositionGraphs";
import { RocketModel } from "@/components/active-flight/RocketModel";
import { StatusLights } from "@/components/active-flight/StatusLights";
import { TelemetryPanel } from "@/components/active-flight/TelemetryPanel";
import ConfirmButton from "@/components/ConfirmButton";
import ScreenTemplate from "@/components/ScreenTemplate";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { computeDeadReckoningFromHistory } from "@/lib/deadReckoning";
import { request } from "@/lib/server";
import { usePackets } from "@/lib/socket";
import { ActiveFlightDataResponse } from "@try-catch/shared-types";
import { useCallback, useEffect, useState } from "react";
import { useLoaderData } from "react-router";

const ActiveFlightScreen = () => {
	const flightDetails = useLoaderData<ActiveFlightDataResponse>();

	const handleStopFlight = useCallback(
		() =>
			request<void, void>({
				path: "/flights/stop",
			}),
		[],
	);

	const { connected, packetStreams, packetHeartbeat, packetLossHeartbeat } = usePackets(flightDetails.id);

	const altitudeGPS = packetStreams.position.altitude.last;
	const altitudeBaro = packetStreams.barometricAltitude.last;
	const speedTotal = packetStreams.velocity.total.last;
	const speedVertical = packetStreams.velocity.altitude.last;
	const lastLatitude = packetStreams.position.latlong.last[0];
	const lastLongitude = packetStreams.position.latlong.last[1];
	const coordinates = `${lastLatitude.toFixed(5)}, ${lastLongitude.toFixed(5)}`;
	const lastPacketAt = packetHeartbeat;

	const [deadReckoning, setDeadReckoning] = useState<
		| (NonNullable<ReturnType<typeof computeDeadReckoningFromHistory>> & {
				ageMs: number;
				updatedAt: number;
		  })
		| null
	>(null);

	useEffect(() => {
		const updateDeadReckoning = () => {
			if (!lastPacketAt) return;

			const ageMs = Math.max(0, Date.now() - lastPacketAt);
			const estimate = computeDeadReckoningFromHistory(packetStreams.deadReckoningHistory.buffer, Date.now());

			if (!estimate) return;

			setDeadReckoning({
				...estimate,
				ageMs,
				updatedAt: Date.now(),
			});
		};

		updateDeadReckoning();
		const interval = window.setInterval(updateDeadReckoning, 250);

		return () => window.clearInterval(interval);
	}, [lastPacketAt, packetStreams.deadReckoningHistory]);

	const deadReckoningSpeed = deadReckoning
		? Math.hypot(deadReckoning.velocity.latitude, deadReckoning.velocity.longitude, deadReckoning.velocity.altitude)
		: 0;

	return (
		<ScreenTemplate
			title={
				<div className="flex items-center gap-3">
					Flight {flightDetails.name}{" "}
					<span className="text-muted-foreground inline-flex items-center gap-2 text-sm">
						{connected ? (
							<>
								(<span className="bg-primary inline-block size-2.5 animate-pulse rounded-full" />
								live)
							</>
						) : (
							<span className="bg-muted-foreground text-muted flex animate-pulse items-center gap-1 rounded p-1">
								<Loader2 className="size-4 animate-spin" />
								Connecting to server...
							</span>
						)}
					</span>
				</div>
			}
			className="from-primary/20 to-primary/30 bg-linear-to-br via-transparent"
			backPath="/">
			<div className="relative grid min-h-full w-full gap-3 rounded-2xl p-2 xl:grid-cols-[6fr_4fr] xl:grid-rows-[1fr_1fr]">
				<div className="relative row-span-2 grid size-full grid-rows-[auto_auto_auto_auto] gap-3 xl:grid-rows-[auto_1fr_1fr_auto]">
					<div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto_auto]">
						<div className="bg-card/60 border-border/60 rounded-xl border px-3 py-2">
							<div className="text-muted-foreground text-[10px] uppercase">Altitude (GPS/Baro)</div>
							<div className="text-lg leading-tight font-semibold">
								{altitudeGPS.toFixed(1)} / {altitudeBaro.toFixed(1)} m
							</div>
						</div>
						<div className="bg-card/60 border-border/60 rounded-xl border px-3 py-2">
							<div className="text-muted-foreground text-[10px] uppercase">Speed (vertical/total)</div>
							<div className="text-lg leading-tight font-semibold">
								{speedVertical.toFixed(1)} / {speedTotal.toFixed(1)} m/s
							</div>
						</div>
						<div className="bg-card/60 border-border/60 rounded-xl border px-3 py-2">
							<div className="text-muted-foreground text-[10px] uppercase">Coordinates</div>
							<div className="text-lg leading-tight font-semibold">{coordinates}</div>
						</div>
						<Dialog>
							<DialogTrigger asChild>
								<Button
									variant="outline"
									className="h-10 rounded-xl border xl:h-full">
									Dead reckoning
								</Button>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Dead reckoning estimate</DialogTitle>
									<DialogDescription>
										Extrapolated from the last packet using constant acceleration.
									</DialogDescription>
								</DialogHeader>
								{deadReckoning ? (
									<div className="grid gap-3 text-sm">
										<div className="flex items-center justify-between">
											<span className="text-muted-foreground">Time since last packet</span>
											<span>{(deadReckoning.ageMs / 1000).toFixed(2)} s</span>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-muted-foreground">Estimated latitude</span>
											<span>{deadReckoning.position.latitude.toFixed(5)}</span>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-muted-foreground">Estimated longitude</span>
											<span>{deadReckoning.position.longitude.toFixed(5)}</span>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-muted-foreground">Estimated altitude</span>
											<span>{deadReckoning.position.altitude.toFixed(1)} m</span>
										</div>
										<div className="border-border/60 my-1 border-t" />
										<div className="flex items-center justify-between">
											<span className="text-muted-foreground">Estimated speed</span>
											<span>{deadReckoningSpeed.toFixed(2)} m/s</span>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-muted-foreground">Velocity (lat/lon/alt)</span>
											<span>
												{deadReckoning.velocity.latitude.toFixed(2)} /{" "}
												{deadReckoning.velocity.longitude.toFixed(2)} /{" "}
												{deadReckoning.velocity.altitude.toFixed(2)} m/s
											</span>
										</div>
									</div>
								) : (
									<div className="text-muted-foreground text-sm">Waiting for first packet...</div>
								)}
							</DialogContent>
						</Dialog>
						<ConfirmButton
							onClick={handleStopFlight}
							confirmMessage="Are you sure you want to end the flight? This action cannot be undone."
							confirmButtonText="End flight"
							cancelButtonText="Cancel"
							className="bg-destructive/20 border-destructive/40 hover:bg-destructive/30 h-10 gap-2 rounded-xl border xl:h-full"
							size="lg">
							<OctagonX />
							End flight
						</ConfirmButton>
					</div>

					<PositionGraphs
						chartData={packetStreams.positionGraph}
						packetHeartbeat={packetHeartbeat}
					/>

					<ExperimentGraph
						triboelectricVoltage={packetStreams.triboelectricVoltage}
						packetHeartbeat={packetHeartbeat}
					/>

					<div className="grid gap-3 xl:grid-cols-2">
						<PacketLossGraph
							packetLoss={packetStreams.packetLoss}
							packetLossHeartbeat={packetLossHeartbeat}
						/>
						<StatusLights
							launchDetected={packetStreams.flags.launchDetected.last}
							apogeeDetected={packetStreams.flags.apogeeDetected.last}
							parachuteDeployed={packetStreams.flags.parachuteDeployed.last}
							batteryVoltage={packetStreams.batteryVoltage.last}
						/>
					</div>
				</div>
				<TelemetryPanel title="Orientation">
					<div className="h-full overflow-hidden rounded-xl border">
						<RocketModel
							roll={packetStreams.orientation.roll.last}
							pitch={packetStreams.orientation.pitch.last}
							yaw={packetStreams.orientation.yaw.last}
						/>
					</div>
				</TelemetryPanel>
				<div className="min-h-80">
					<Map
						position={{
							latlong: packetStreams.position.latlong,
							altitude: packetStreams.position.altitude,
						}}
						velocity={{
							latitude: packetStreams.velocity.latitude,
							longitude: packetStreams.velocity.longitude,
						}}
						acceleration={{
							latitude: packetStreams.acceleration.latitude,
							longitude: packetStreams.acceleration.longitude,
						}}
						parachudeDeployed={packetStreams.flags.parachuteDeployed.last}
						packetHeartbeat={packetHeartbeat}
					/>
				</div>
			</div>
		</ScreenTemplate>
	);
};

export default ActiveFlightScreen;
