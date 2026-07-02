import { Loader2, OctagonX } from "lucide-react";

import { DeadReckoningPanel } from "@/components/active-flight/DeadReckoningPanel";
import { ExperimentGraph } from "@/components/active-flight/ExperimentGraph";
import { Map } from "@/components/active-flight/Map";
import { PacketLossGraph } from "@/components/active-flight/PacketLossGraph";
import { PositionGraphs } from "@/components/active-flight/PositionGraphs";
import { RocketControlPanel } from "@/components/active-flight/RocketControlPanel";
import { RocketModel } from "@/components/active-flight/RocketModel";
import { StatusLights } from "@/components/active-flight/StatusLights";
import ConfirmButton from "@/components/ConfirmButton";
import ScreenTemplate from "@/components/ScreenTemplate";

import { request } from "@/lib/server";
import { usePackets } from "@/lib/socket";
import { ActiveFlightDataResponse } from "@try-catch/shared-types";
import { useCallback } from "react";
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

	const deadReckoningState = {
		position: {
			latitude: packetStreams.position.latlong.last[0],
			longitude: packetStreams.position.latlong.last[1],
			altitude: packetStreams.position.altitude.last,
		},
		velocity: {
			latitude: packetStreams.velocity.latitude.last,
			longitude: packetStreams.velocity.longitude.last,
			altitude: packetStreams.velocity.altitude.last,
			total: packetStreams.velocity.total.last,
		},
		acceleration: {
			latitude: packetStreams.acceleration.latitude.last,
			longitude: packetStreams.acceleration.longitude.last,
			altitude: packetStreams.acceleration.altitude.last,
			total: packetStreams.acceleration.total.last,
		},
		barometricAltitude: packetStreams.barometricAltitude.last,
		timestamp: packetHeartbeat,
	};

	const altitudeGPS = packetStreams.position.altitude.last;
	const altitudeBaro = packetStreams.barometricAltitude.last;
	const speedTotal = packetStreams.velocity.total.last;
	const speedVertical = packetStreams.velocity.altitude.last;
	const lastLatitude = packetStreams.position.latlong.last[0];
	const lastLongitude = packetStreams.position.latlong.last[1];
	const coordinates = `${lastLatitude.toFixed(5)}, ${lastLongitude.toFixed(5)}`;

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
					<div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto_auto_auto]">
						<div className="bg-card/60 border-border/60 rounded-xl border px-3 py-2">
							<div className="text-muted-foreground text-[10px] uppercase">Altitude (GPS/Baro)</div>
							<div className="text-lg leading-tight font-semibold">
								{/*{altitudeGPS.toFixed(1)} / {altitudeBaro.toFixed(1)} m*/}
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

						<DeadReckoningPanel lastPacket={deadReckoningState} />

						<RocketControlPanel />

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
				<RocketModel
					roll={packetStreams.orientation.roll.last}
					pitch={packetStreams.orientation.pitch.last}
					yaw={packetStreams.orientation.yaw.last}
				/>
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
