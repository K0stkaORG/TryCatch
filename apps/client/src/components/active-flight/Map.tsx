import { useEffect, useState } from "react";
import { Circle, MapContainer, Pane, Polyline, TileLayer, useMap, useMapEvents } from "react-leaflet";

import { TelemetryPanel } from "@/components/active-flight/TelemetryPanel";
import { Button } from "@/components/ui/button";
import { CircularBuffer } from "@/lib/circularBuffer";
import { DivIcon } from "leaflet";
import { Crosshair } from "lucide-react";
import ReactLeafletDriftMarker from "react-leaflet-drift-marker";

const ACCELERATION_VECTOR_SCALE = 5;

interface MapProps {
	position: {
		latlong: CircularBuffer<LatLng>;
		altitude: CircularBuffer<number>;
	};
	velocity: {
		latitude: CircularBuffer<number>;
		longitude: CircularBuffer<number>;
	};
	acceleration: {
		latitude: CircularBuffer<number>;
		longitude: CircularBuffer<number>;
	};
	parachudeDeployed: boolean;
	packetHeartbeat: number;
	variant?: "active" | "archive";
}

type LatLng = [number, number];

const addMetersToLatLng = (latlng: LatLng, metersNorth: number, metersEast: number): LatLng => {
	const earthRadius = 6378137; // in meters
	const deltaLat = metersNorth / earthRadius;
	const deltaLng = metersEast / (earthRadius * Math.cos((latlng[0] * Math.PI) / 180));
	return [latlng[0] + (deltaLat * 180) / Math.PI, latlng[1] + (deltaLng * 180) / Math.PI];
};

const FollowRocketController = ({
	followRocket,
	currentPosition,
	onUserPan,
}: {
	followRocket: boolean;
	currentPosition: LatLng;
	onUserPan: () => void;
}) => {
	const map = useMap();

	useMapEvents({
		dragstart: onUserPan,
	});

	useEffect(() => {
		if (!followRocket) return;

		map.panTo(currentPosition, { animate: false });
	}, [currentPosition, followRocket, map]);

	return null;
};

export const Map = ({
	position,
	velocity,
	acceleration,
	parachudeDeployed,
	packetHeartbeat,
	variant = "active",
}: MapProps) => {
	const isArchive = variant === "archive";
	const [followRocket, setFollowRocket] = useState(true);

	const currentPosition: LatLng = position.latlong.last;

	const velocityVector: LatLng[] = [
		currentPosition,
		addMetersToLatLng(currentPosition, velocity.latitude.last, velocity.longitude.last),
	];

	const accelerationVector: LatLng[] = [
		currentPosition,
		addMetersToLatLng(
			currentPosition,
			acceleration.latitude.last * ACCELERATION_VECTOR_SCALE,
			acceleration.longitude.last * ACCELERATION_VECTOR_SCALE,
		),
	];

	const toggleFollowRocket = () => {
		setFollowRocket((prev) => !prev);
	};

	return (
		<TelemetryPanel
			title="Map"
			action={
				<Button
					size="sm"
					className="gap-1.5 px-2 text-xs"
					onClick={toggleFollowRocket}
					variant={followRocket ? "default" : "outline"}>
					<Crosshair className="size-3" />
					Follow rocket
				</Button>
			}>
			<MapContainer
				center={currentPosition}
				zoom={15}
				zoomControl={false}
				scrollWheelZoom
				className="h-full w-full overflow-hidden rounded-2xl border">
				<FollowRocketController
					followRocket={followRocket}
					currentPosition={currentPosition}
					onUserPan={() => setFollowRocket(false)}
				/>

				<TileLayer
					url="https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png?api_key=4576c6da-92ed-4c6c-ad5a-ddedbb4e5168"
					maxZoom={19}
				/>

				{!isArchive && (
					<Pane
						name="l0"
						style={{ zIndex: 400 }}>
						{parachudeDeployed && (
							<Circle
								center={currentPosition}
								radius={position.altitude.last}
								pathOptions={{
									color: "#3b82f6",
									weight: 2,
									fillColor: "#3b82f6",
									fillOpacity: 0.2,
									dashArray: "10 10",
									dashOffset: "0",
								}}
								pane="l0"
							/>
						)}
					</Pane>
				)}

				<Pane
					name="l1"
					style={{ zIndex: 500 }}>
					<Polyline
						key={packetHeartbeat}
						positions={position.latlong.buffer}
						pathOptions={{ color: "#ff00a1", weight: 3, opacity: 0.5 }}
						pane="l1"
					/>
					<ReactLeafletDriftMarker
						position={currentPosition}
						duration={100}
						icon={
							new DivIcon({
								html: `<div class="size-4 rounded-full bg-[#ff00a1] border-2 border-black"></div>`,
								className: "",
							})
						}
						pane="l1"
					/>
				</Pane>

				{!isArchive && (
					<Pane
						name="l2"
						style={{ zIndex: 600 }}>
						<Polyline
							positions={velocityVector}
							pathOptions={{ color: "#5eead4", weight: 3, opacity: 1 }}
							pane="l2"
						/>

						<Polyline
							positions={accelerationVector}
							pathOptions={{ color: "#f59e0b", weight: 3, opacity: 1 }}
							pane="l2"
						/>
					</Pane>
				)}
			</MapContainer>

			{!isArchive && (
				<div
					className="bg-background/85 border-border absolute right-5 bottom-5 rounded-sm border px-1.5 py-1 text-xs backdrop-blur"
					style={{ zIndex: 1000 }}>
					<div className="mb-1 flex items-center gap-1.5">
						<span className="inline-block size-3 rounded-full bg-[#5eead4]" /> velocity
					</div>
					<div className="mb-1 flex items-center gap-1.5">
						<span className="inline-block size-3 rounded-full bg-[#f59e0b]" /> acceleration
					</div>
					<div className="flex items-center gap-1.5">
						<span className="inline-block size-3 rounded-full border-2 border-dashed border-[#3b82f6] bg-[#3b82f6]/20" />{" "}
						landing zone
					</div>
				</div>
			)}
		</TelemetryPanel>
	);
};
