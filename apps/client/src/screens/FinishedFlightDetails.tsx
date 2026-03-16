import ScreenTemplate from "@/components/ScreenTemplate";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FinishedFlightDataResponse } from "@try-catch/shared-types";
import { Activity, Archive, Battery, Clock, Flag, MapPin, Signal } from "lucide-react";
import { useLoaderData } from "react-router";

const formatDuration = (durationMs: number | null) => {
	if (!durationMs) return "—";

	const totalSeconds = Math.round(durationMs / 1000);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;

	return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
};

const formatDateTime = (value: Date | string | null) => {
	if (!value) return "—";
	return new Date(value).toLocaleString();
};

const FinishedFlightScreen = () => {
	const flightDetails = useLoaderData<FinishedFlightDataResponse>();
	const packets = flightDetails.flightPackets ?? [];
	const lastPacket = packets[packets.length - 1];
	const lastSeen = lastPacket ? new Date(lastPacket.receivedAt).toLocaleTimeString() : "—";
	const batteryVoltage = lastPacket?.parsedData?.batteryVoltage;
	const altitude = lastPacket?.parsedData?.position?.altitude;

	return (
		<ScreenTemplate
			title={`Flight ${flightDetails.name}`}
			backPath="/">
			<div className="flex flex-col gap-4">
				<section className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
					<Card className="bg-card/60 border-border/60">
						<CardHeader className="flex flex-row items-start justify-between gap-4">
							<div className="space-y-2">
								<div className="text-muted-foreground flex items-center gap-2 text-sm">
									<div className="bg-primary/15 text-primary flex size-8 items-center justify-center rounded-lg">
										<Flag className="size-4" />
									</div>
									<span>Mission summary</span>
								</div>
								<h2 className="text-2xl font-semibold tracking-tight">{flightDetails.name}</h2>
								<p className="text-muted-foreground text-sm">Flight #{flightDetails.id}</p>
							</div>
							<Badge className="gap-1.5">
								<Archive className="size-3.5" />
								Archived
							</Badge>
						</CardHeader>
						<CardContent className="grid gap-3 md:grid-cols-3">
							<div className="bg-muted/30 rounded-2xl border px-4 py-3">
								<p className="text-muted-foreground text-xs tracking-[0.2em] uppercase">Start</p>
								<p className="text-sm font-semibold">{formatDateTime(flightDetails.createdAt)}</p>
							</div>
							<div className="bg-muted/30 rounded-2xl border px-4 py-3">
								<p className="text-muted-foreground text-xs tracking-[0.2em] uppercase">First packet</p>
								<p className="text-sm font-semibold">{formatDateTime(flightDetails.firstPacketAt)}</p>
							</div>
							<div className="bg-muted/30 rounded-2xl border px-4 py-3">
								<p className="text-muted-foreground text-xs tracking-[0.2em] uppercase">Duration</p>
								<p className="text-sm font-semibold">{formatDuration(flightDetails.durationMs)}</p>
							</div>
						</CardContent>
					</Card>

					<Card className="bg-card/60 border-border/60">
						<CardHeader>
							<div className="flex items-center justify-between">
								<div>
									<p className="text-muted-foreground text-sm">Telemetry snapshot</p>
									<h3 className="text-lg font-semibold">Final status</h3>
								</div>
								<div className="bg-primary/15 text-primary flex size-10 items-center justify-center rounded-xl">
									<Activity className="size-4" />
								</div>
							</div>
						</CardHeader>
						<CardContent className="space-y-3 text-sm">
							<div className="flex items-center justify-between">
								<span className="flex items-center gap-2">
									<Signal className="text-primary size-4" />
									Packets received
								</span>
								<span className="font-semibold">{packets.length}</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="flex items-center gap-2">
									<Clock className="text-primary size-4" />
									Last seen
								</span>
								<span className="font-semibold">{lastSeen}</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="flex items-center gap-2">
									<Battery className="text-primary size-4" />
									Battery voltage
								</span>
								<span className="font-semibold">
									{typeof batteryVoltage === "number" ? `${batteryVoltage.toFixed(2)} V` : "—"}
								</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="flex items-center gap-2">
									<MapPin className="text-primary size-4" />
									Altitude
								</span>
								<span className="font-semibold">
									{typeof altitude === "number" ? `${altitude.toFixed(1)} m` : "—"}
								</span>
							</div>
							<div className="bg-muted/30 text-muted-foreground rounded-xl border px-4 py-3 text-xs">
								Telemetry shown from the final received packet.
							</div>
						</CardContent>
					</Card>
				</section>

				<section className="space-y-3">
					<div>
						<h3 className="text-lg font-semibold">Recent packets</h3>
						<p className="text-muted-foreground text-sm">Latest telemetry frames for this flight.</p>
					</div>
					<Card className="bg-card/60 border-border/60">
						<CardContent className="space-y-2 p-4">
							{packets.length === 0 && (
								<div className="text-muted-foreground rounded-xl border px-4 py-3 text-sm">
									No packets were recorded for this flight.
								</div>
							)}
							{packets
								.slice(-6)
								.reverse()
								.map((packet, index) => (
									<div
										key={`${packet.receivedAt}-${index}`}
										className="flex items-center justify-between rounded-xl border px-4 py-3 text-sm">
										<div className="flex flex-col">
											<span className="font-medium">Packet #{packets.length - index}</span>
											<span className="text-muted-foreground text-xs">
												{new Date(packet.receivedAt).toLocaleTimeString()}
											</span>
										</div>
										<Badge variant={packet.parsedData ? "default" : "secondary"}>
											{packet.parsedData ? "Parsed" : "Raw"}
										</Badge>
									</div>
								))}
						</CardContent>
					</Card>
				</section>
			</div>
		</ScreenTemplate>
	);
};

export default FinishedFlightScreen;
