import { Activity, LocateFixed, MapPin, Navigation, Ruler } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { CircleMarker, MapContainer, Pane, Polyline, TileLayer, useMap } from "react-leaflet";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	approximateDeadReckoning,
	DEAD_RECKONING_GROUND_ALTITUDE_METERS,
	DeadReckoningResult,
	DeadReckoningState,
} from "@/lib/deadReckoning";

type LatLng = [number, number];

export const METERS_PER_DEGREE_LAT = 111_320;

const metersPerDegreeLongitude = (latitude: number) => 111_320 * Math.max(0.2, Math.cos((latitude * Math.PI) / 180));

const formatCoordinate = (value: number) => value.toFixed(5);

const formatSigned = (value: number, digits = 1) => `${value >= 0 ? "+" : ""}${value.toFixed(digits)}`;

const distanceMeters = (from: LatLng, to: LatLng) => {
	const meanLatitude = (from[0] + to[0]) / 2;
	const north = (to[0] - from[0]) * METERS_PER_DEGREE_LAT;
	const east = (to[1] - from[1]) * metersPerDegreeLongitude(meanLatitude);

	return Math.hypot(north, east);
};

const FitDeadReckoningBounds = ({ points }: { points: LatLng[] }) => {
	const map = useMap();

	useEffect(() => {
		if (points.length < 2) return;

		map.fitBounds(points, {
			animate: true,
			padding: [40, 40],
			maxZoom: 18,
		});
	}, [map, points]);

	return null;
};

const StatCard = ({
	icon,
	label,
	value,
	detail,
}: {
	icon: ReactNode;
	label: string;
	value: string;
	detail?: string;
}) => (
	<div className="bg-card/70 border-border/60 rounded-xl border p-3">
		<div className="text-muted-foreground mb-1 flex items-center gap-1.5 text-[10px] font-medium tracking-wide uppercase">
			{icon}
			{label}
		</div>
		<div className="text-lg leading-tight font-semibold">{value}</div>
		{detail && <div className="text-muted-foreground mt-1 text-xs">{detail}</div>}
	</div>
);

export const DeadReckoningPanel = ({ lastPacket }: { lastPacket: DeadReckoningState }) => {
	const [estimate, setEstimate] = useState<DeadReckoningResult | null>(null);
	const [open, setOpen] = useState(false);

	useEffect(() => {
		if (!open) return;

		const updateEstimate = () => setEstimate(approximateDeadReckoning(lastPacket));

		updateEstimate();

		const interval = window.setInterval(updateEstimate, 250);

		return () => window.clearInterval(interval);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [lastPacket.timestamp, open]);

	return (
		<Dialog
			open={open}
			onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button
					variant="outline"
					className="h-10 rounded-xl border xl:h-full">
					<LocateFixed className="size-4" />
					Dead reckoning
				</Button>
			</DialogTrigger>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
				<DialogHeader>
					<DialogTitle>Dead reckoning estimate</DialogTitle>
					<DialogDescription>
						Extrapolated from the last telemetry packet using velocity and estimated acceleration.
					</DialogDescription>
				</DialogHeader>

				{estimate ? (
					<div className="grid gap-4">
						<div className="h-80 overflow-hidden rounded-xl border">
							<MapContainer
								center={[estimate.position.latitude, estimate.position.longitude]}
								zoom={16}
								zoomControl={false}
								scrollWheelZoom
								className="h-full w-full">
								<FitDeadReckoningBounds
									points={[
										[lastPacket.position.latitude, lastPacket.position.longitude],
										[estimate.position.latitude, estimate.position.longitude],
									]}
								/>
								<TileLayer
									url="https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png?api_key=4576c6da-92ed-4c6c-ad5a-ddedbb4e5168"
									maxZoom={19}
								/>
								<Pane
									name="dead-reckoning-path"
									style={{ zIndex: 500 }}>
									<Polyline
										positions={[
											[lastPacket.position.latitude, lastPacket.position.longitude],
											[estimate.position.latitude, estimate.position.longitude],
										]}
										pathOptions={{ color: "#a855f7", weight: 4, opacity: 0.9, dashArray: "8 8" }}
										pane="dead-reckoning-path"
									/>
									<CircleMarker
										center={[lastPacket.position.latitude, lastPacket.position.longitude]}
										radius={8}
										pathOptions={{
											color: "#ff00a1",
											weight: 3,
											fillColor: "#ff00a1",
											fillOpacity: 0.85,
										}}
										pane="dead-reckoning-path"
									/>
									<CircleMarker
										center={[estimate.position.latitude, estimate.position.longitude]}
										radius={10}
										pathOptions={{
											color: "#a855f7",
											weight: 3,
											fillColor: "#a855f7",
											fillOpacity: 0.35,
										}}
										pane="dead-reckoning-path"
									/>
								</Pane>
							</MapContainer>
						</div>

						<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
							<StatCard
								icon={<Activity className="size-3" />}
								label="Status"
								value={estimate.landed ? "Landed" : `${(estimate.ageMs / 1000).toFixed(2)} s`}
								detail={
									estimate.landed
										? `Stopped at ${DEAD_RECKONING_GROUND_ALTITUDE_METERS.toFixed(1)} m ground`
										: `Updated ${estimate.calculatedAt.toLocaleTimeString()}`
								}
							/>
							<StatCard
								icon={<Ruler className="size-3" />}
								label="Horizontal drift"
								value={`${distanceMeters(
									[lastPacket.position.latitude, lastPacket.position.longitude],
									[estimate.position.latitude, estimate.position.longitude],
								).toFixed(1)} m`}
								detail={`${formatSigned(estimate.position.altitude - lastPacket.position.altitude)} m altitude`}
							/>
							<StatCard
								icon={<Navigation className="size-3" />}
								label="Estimated speed"
								value={
									estimate.landed
										? "0.00 m/s"
										: `${Math.hypot(
												estimate.velocity.latitude,
												estimate.velocity.longitude,
												estimate.velocity.altitude,
											).toFixed(2)} m/s`
								}
								detail={
									estimate.landed
										? "Expected touchdown"
										: `${estimate.velocity.altitude.toFixed(2)} m/s vertical`
								}
							/>
							<StatCard
								icon={<MapPin className="size-3" />}
								label="Estimated altitude"
								value={`${estimate.position.altitude.toFixed(1)} m`}
								detail={`Last ${lastPacket.position.altitude.toFixed(1)} m`}
							/>
						</div>

						<div className="grid gap-3 text-sm lg:grid-cols-2">
							<div className="bg-muted/30 rounded-xl p-3">
								<div className="mb-2 flex items-center gap-2 font-medium">
									<span className="inline-block size-3 rounded-full bg-[#ff00a1]" /> Last known
									position
								</div>
								<div className="text-muted-foreground">
									{formatCoordinate(lastPacket.position.latitude)},{" "}
									{formatCoordinate(lastPacket.position.longitude)}
								</div>
							</div>
							<div className="bg-muted/30 rounded-xl p-3">
								<div className="mb-2 flex items-center gap-2 font-medium">
									<span className="inline-block size-3 rounded-full border-2 border-[#a855f7] bg-[#a855f7]/40" />{" "}
									Estimated position
								</div>
								<div className="text-muted-foreground">
									{formatCoordinate(estimate.position.latitude)},{" "}
									{formatCoordinate(estimate.position.longitude)}
								</div>
							</div>
						</div>
					</div>
				) : (
					<div className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">
						Waiting for enough telemetry to estimate the rocket position.
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
};
