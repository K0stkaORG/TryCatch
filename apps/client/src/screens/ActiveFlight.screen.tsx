import ConfirmButton from "@/components/ConfirmButton";
import ScreenTemplate from "@/components/ScreenTemplate";
import { request } from "@/lib/server";
import { usePackets } from "@/lib/socket";
import { Canvas } from "@react-three/fiber";
import { ActiveFlightDataResponse } from "@try-catch/shared-types";
import { Loader2 } from "lucide-react";
import { useCallback, useMemo } from "react";
import { useLoaderData } from "react-router";
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";
type RocketModelProps = {
	roll?: number | null;
	pitch?: number | null;
	yaw?: number | null;
};

const toRad = (value: number) => (value * Math.PI) / 180;

const RocketModel = ({ roll, pitch, yaw }: RocketModelProps) => {
	const rotation = useMemo<[number, number, number]>(
		() => [toRad(pitch ?? 0), toRad(yaw ?? 0), toRad(roll ?? 0)],
		[roll, pitch, yaw],
	);

	const bodyMaterial = useMemo(
		() => ({
			color: "#ff00a1",
			metalness: 0.2,
			roughness: 0.4,
		}),
		[],
	);

	const noseMaterial = useMemo(
		() => ({
			color: "#000000",
			metalness: 0.2,
			roughness: 0.35,
		}),
		[],
	);

	const finMaterial = useMemo(
		() => ({
			color: "#000000",
			metalness: 0.1,
			roughness: 0.5,
		}),
		[],
	);

	return (
		<group rotation={rotation}>
			<mesh>
				<cylinderGeometry args={[0.45, 0.45, 2.8, 24, 1, false]} />
				<meshStandardMaterial {...bodyMaterial} />
			</mesh>

			<mesh position={[0, 1.9, 0]}>
				<coneGeometry args={[0.5, 1, 24]} />
				<meshStandardMaterial {...noseMaterial} />
			</mesh>

			<mesh position={[-0.5, -1.2, 0]}>
				<boxGeometry args={[0.6, 0.6, 0.1]} />
				<meshStandardMaterial {...finMaterial} />
			</mesh>

			<mesh position={[0.5, -1.2, 0]}>
				<boxGeometry args={[0.6, 0.6, 0.1]} />
				<meshStandardMaterial {...finMaterial} />
			</mesh>
		</group>
	);
};

const ActiveFlightScreen = () => {
	const flightDetails = useLoaderData<ActiveFlightDataResponse>();

	const handleStopFlight = useCallback(
		() =>
			request<void, void>({
				path: "/flights/stop",
			}),
		[],
	);

	const { connected, packets, packetLoss } = usePackets(flightDetails.id);
	const latestPacket = packets[packets.length - 1] ?? null;

	// const chartData = useMemo(
	// 	() =>
	// 		packets.map((packet, index) => {
	// 			const parsed = packet.parsedData;
	// 			return {
	// 				index: index + 1,
	// 				time: new Date(packet.receivedAt).toLocaleTimeString(),
	// 				altitude: parsed?.position.altitude ?? null,
	// 				velocity: parsed?.velocity.total ?? null,
	// 				acceleration: parsed?.acceleration.total ?? null,
	// 				battery: parsed?.batteryVoltage ?? null,
	// 				roll: parsed?.orientation.roll ?? null,
	// 				pitch: parsed?.orientation.pitch ?? null,
	// 				yaw: parsed?.orientation.yaw ?? null,
	// 			};
	// 		}),
	// 	[packets],
	// );

	return (
		<ScreenTemplate
			title={
				<div className="flex items-center gap-4">
					Flight {flightDetails.name}{" "}
					<span className="text-muted-foreground inline-flex items-center gap-1 text-sm">
						{connected ? (
							<>
								(<span className="bg-primary inline-block size-3 animate-pulse rounded-full" />
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
			backPath="/">
			<div className="flex flex-col gap-4">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<ConfirmButton
						onClick={handleStopFlight}
						confirmMessage="Are you sure you want to end the flight?"
						confirmButtonText="End flight"
						cancelButtonText="Cancel"
						className="gap-2"
						size="lg"
						variant="destructive">
						End flight
					</ConfirmButton>
				</div>
				<div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
					<LineChart
						data={packetLoss.map((loss, index) => ({ index: index + 1, loss }))}
						width={600}
						height={300}>
						<CartesianGrid strokeDasharray="4 4" />
						<XAxis
							dataKey="index"
							tick={{ fontSize: 10 }}
						/>
						<YAxis tick={{ fontSize: 10 }} />
						<Tooltip />
						<Line
							type="monotone"
							dataKey="battery"
							stroke="#a855f7"
							dot={false}
						/>
					</LineChart>

					<div className="flex flex-col gap-4">
						<div className="rounded border p-4">
							<div className="text-sm font-semibold">Rocket Orientation</div>
							<p className="text-muted-foreground text-xs">3D attitude visualization.</p>
							<div className="mt-4 h-64 w-full overflow-hidden rounded bg-gradient-to-br from-slate-50 to-slate-100">
								<Canvas
									camera={{ fov: 50, position: [0, 0.8, 6] }}
									dpr={[1, 2]}>
									<ambientLight intensity={0.7} />
									<directionalLight
										intensity={0.8}
										position={[4, 6, 8]}
									/>
									<RocketModel
										roll={latestPacket?.parsedData.orientation.roll}
										pitch={latestPacket?.parsedData.orientation.pitch}
										yaw={latestPacket?.parsedData.orientation.yaw}
									/>
								</Canvas>
							</div>
							<div className="text-muted-foreground mt-3 grid grid-cols-3 gap-2 text-xs">
								<div>
									<p className="tracking-[0.2em] uppercase">Roll</p>
									<p className="text-sm font-semibold">
										{latestPacket?.parsedData.orientation.roll ?? "—"}°
									</p>
								</div>
								<div>
									<p className="tracking-[0.2em] uppercase">Pitch</p>
									<p className="text-sm font-semibold">
										{latestPacket?.parsedData.orientation.pitch ?? "—"}°
									</p>
								</div>
								<div>
									<p className="tracking-[0.2em] uppercase">Yaw</p>
									<p className="text-sm font-semibold">
										{latestPacket?.parsedData.orientation.yaw ?? "—"}°
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</ScreenTemplate>
	);
};

export default ActiveFlightScreen;
