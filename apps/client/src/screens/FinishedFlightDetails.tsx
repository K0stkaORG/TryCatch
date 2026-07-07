import { BatteryGraph } from "@/components/active-flight/BatteryGraph";
import { ExperimentGraph } from "@/components/active-flight/ExperimentGraph";
import { Map } from "@/components/active-flight/Map";
import { PositionGraphs } from "@/components/active-flight/PositionGraphs";
import { PressureGraph } from "@/components/active-flight/PressureGraph";
import { StatusGraph } from "@/components/active-flight/StatusGraph";
import { TelemetryPanel } from "@/components/active-flight/TelemetryPanel";
import ScreenTemplate from "@/components/ScreenTemplate";
import { createHistoricalPacketStreams } from "@/lib/historicalPackets";
import { FinishedFlightDataResponse } from "@try-catch/shared-types";
import { Archive } from "lucide-react";
import { useMemo } from "react";
import { useLoaderData } from "react-router";

const formatDuration = (durationMs: number | null) => {
	if (!durationMs) return "—";

	const totalSeconds = Math.round(durationMs / 1000);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;

	return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
};

const formatDateTime = (value: Date | string | number | null) => {
	if (!value) return "—";
	return new Date(value).toLocaleString();
};

const FinishedFlightScreen = () => {
	const flightDetails = useLoaderData<FinishedFlightDataResponse>();

	const { packetStreams, parsedPackets, firstPacketReceivedAt, lastPacketReceivedAt } = useMemo(
		() => createHistoricalPacketStreams(flightDetails.flightPackets ?? []),
		[flightDetails.flightPackets],
	);

	const hasData = parsedPackets.length > 0;

	const packetHeartbeat = lastPacketReceivedAt ?? 0;

	return (
		<ScreenTemplate
			title={
				<div className="flex items-center gap-3">
					Flight {flightDetails.name}{" "}
					<span className="text-muted-foreground inline-flex items-center gap-2 text-sm">
						<Archive className="size-4" />
						Archived
					</span>
				</div>
			}
			className="from-muted/30 to-muted/50 bg-linear-to-br via-transparent"
			backPath="/">
			<div className="relative grid min-h-full w-full gap-3 rounded-2xl p-2 xl:grid-cols-[6fr_4fr] xl:grid-rows-[1fr_1fr]">
				<div className="relative row-span-2 grid size-full grid-rows-[auto_auto_auto_auto] gap-3 xl:grid-rows-[auto_1fr_1fr_auto]">
					<TelemetryPanel title="Flight summary">
						<div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_1fr_1fr]">
							<div className="bg-muted/30 rounded-xl border px-3 py-2">
								<div className="text-muted-foreground text-[10px] uppercase">Created</div>
								<div className="text-sm font-semibold">{formatDateTime(flightDetails.createdAt)}</div>
							</div>
							<div className="bg-muted/30 rounded-xl border px-3 py-2">
								<div className="text-muted-foreground text-[10px] uppercase">First packet</div>
								<div className="text-sm font-semibold">{formatDateTime(firstPacketReceivedAt)}</div>
							</div>
							<div className="bg-muted/30 rounded-xl border px-3 py-2">
								<div className="text-muted-foreground text-[10px] uppercase">Last packet</div>
								<div className="text-sm font-semibold">{formatDateTime(lastPacketReceivedAt)}</div>
							</div>
							<div className="bg-muted/30 rounded-xl border px-3 py-2">
								<div className="text-muted-foreground text-[10px] uppercase">Duration</div>
								<div className="text-sm font-semibold">
									{formatDuration((lastPacketReceivedAt ?? 0) - (firstPacketReceivedAt ?? 0))}
								</div>
							</div>
							<div className="bg-muted/30 rounded-xl border px-3 py-2">
								<div className="text-muted-foreground text-[10px] uppercase">Packets</div>
								<div className="text-sm font-semibold">{parsedPackets.length}</div>
							</div>
						</div>
					</TelemetryPanel>

					{hasData ? (
						<PositionGraphs
							chartData={packetStreams.positionGraph}
							packetHeartbeat={packetHeartbeat}
							isArchived
							flightStart={firstPacketReceivedAt ?? 0}
						/>
					) : (
						<TelemetryPanel
							title="Altitude / Velocity / Acceleration"
							className="h-44 xl:h-full">
							<div className="text-muted-foreground flex h-full items-center justify-center rounded-xl border border-dashed text-sm">
								No telemetry data available.
							</div>
						</TelemetryPanel>
					)}

					<div className="grid gap-3 xl:grid-cols-2">
						{hasData ? (
							<ExperimentGraph
								triboelectricVoltage={packetStreams.triboelectricVoltage}
								packetHeartbeat={packetHeartbeat}
								isArchived
								flightStart={firstPacketReceivedAt ?? 0}
							/>
						) : (
							<TelemetryPanel
								title="Triboelectric Voltage"
								className="h-44 xl:h-full">
								<div className="text-muted-foreground flex h-full items-center justify-center rounded-xl border border-dashed text-sm">
									No telemetry data available.
								</div>
							</TelemetryPanel>
						)}
						{hasData ? (
							<PressureGraph
								pressureHpaGraph={packetStreams.pressureHpaGraph}
								packetHeartbeat={packetHeartbeat}
								isArchived
								flightStart={firstPacketReceivedAt ?? 0}
							/>
						) : (
							<TelemetryPanel
								title="Pressure"
								className="h-44 xl:h-full">
								<div className="text-muted-foreground flex h-full items-center justify-center rounded-xl border border-dashed text-sm">
									No telemetry data available.
								</div>
							</TelemetryPanel>
						)}
					</div>

					<div className="grid gap-3 xl:grid-cols-2">
						{hasData ? (
							<StatusGraph
								statusData={packetStreams.fsmState}
								packetHeartbeat={packetHeartbeat}
								flightStart={firstPacketReceivedAt ?? 0}
							/>
						) : (
							<TelemetryPanel
								title="Status"
								className="h-44 xl:h-full">
								<div className="text-muted-foreground flex h-full items-center justify-center rounded-xl border border-dashed text-sm">
									No status data available.
								</div>
							</TelemetryPanel>
						)}

						{hasData ? (
							<BatteryGraph
								batteryData={packetStreams.batteryGraph}
								hallSensorData={packetStreams.hallSensorGraph}
								packetHeartbeat={packetHeartbeat}
								flightStart={firstPacketReceivedAt ?? 0}
							/>
						) : (
							<TelemetryPanel
								title="Battery"
								className="h-44 xl:h-full">
								<div className="text-muted-foreground flex h-full items-center justify-center rounded-xl border border-dashed text-sm">
									No battery data available.
								</div>
							</TelemetryPanel>
						)}
					</div>
				</div>

				<div className="row-span-2 min-h-80">
					{hasData ? (
						<Map
							gpsPosition={{
								latlong: packetStreams.gpsPosition.latlong,
							}}
							packetHeartbeat={packetHeartbeat}
						/>
					) : (
						<TelemetryPanel title="Map">
							<div className="text-muted-foreground flex h-full items-center justify-center rounded-xl border border-dashed text-sm">
								No position data available.
							</div>
						</TelemetryPanel>
					)}
				</div>
			</div>
		</ScreenTemplate>
	);
};

export default FinishedFlightScreen;
