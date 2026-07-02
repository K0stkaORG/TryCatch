import { useEffect, useState } from "react";
import { MapContainer, Pane, Polyline, TileLayer, useMap, useMapEvents } from "react-leaflet";

import { TelemetryPanel } from "@/components/active-flight/TelemetryPanel";
import { Button } from "@/components/ui/button";
import { CircularBuffer } from "@/lib/circularBuffer";
import { DivIcon } from "leaflet";
import { Crosshair } from "lucide-react";
import ReactLeafletDriftMarker from "react-leaflet-drift-marker";

interface MapProps {
	gpsPosition: {
		latlong: CircularBuffer<LatLng>;
	};
	packetHeartbeat: number;
}

type LatLng = [number, number];

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

export const Map = ({ gpsPosition, packetHeartbeat }: MapProps) => {
	const [followRocket, setFollowRocket] = useState(true);

	const currentPosition: LatLng = gpsPosition.latlong.last;

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

				<Pane
					name="l1"
					style={{ zIndex: 500 }}>
					<Polyline
						key={packetHeartbeat}
						positions={gpsPosition.latlong.buffer}
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
			</MapContainer>
		</TelemetryPanel>
	);
};
