import ConfirmButton from "@/components/ConfirmButton";
import ScreenTemplate from "@/components/ScreenTemplate";
import { request } from "@/lib/server";
import { usePackets } from "@/lib/socket";
import { Canvas } from "@react-three/fiber";
import { ActiveFlightDataResponse } from "@try-catch/shared-types";
import { useCallback, useMemo } from "react";
import { useLoaderData } from "react-router";
import {
	Area,
	AreaChart,
	CartesianGrid,
	Legend,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

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
			color: "#6ba4ff",
			metalness: 0.2,
			roughness: 0.4,
		}),
		[],
	);

	const noseMaterial = useMemo(
		() => ({
			color: "#9aa7b2",
			metalness: 0.2,
			roughness: 0.35,
		}),
		[],
	);

	const finMaterial = useMemo(
		() => ({
			color: "#415a77",
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
				<boxGeometry args={[0.12, 0.6, 0.6]} />
				<meshStandardMaterial {...finMaterial} />
			</mesh>

			<mesh position={[0.5, -1.2, 0]}>
				<boxGeometry args={[0.12, 0.6, 0.6]} />
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
	const latestPacket = packets[packets.length - 1];
	const latestParsed = latestPacket?.parsedData ?? null;

	const chartData = useMemo(
		() =>
			packets.map((packet, index) => {
				const parsed = packet.parsedData;
				return {
					index: index + 1,
					time: new Date(packet.receivedAt).toLocaleTimeString(),
					altitude: parsed?.position.altitude ?? null,
					velocity: parsed?.velocity.total ?? null,
					acceleration: parsed?.acceleration.total ?? null,
					battery: parsed?.batteryVoltage ?? null,
					roll: parsed?.orientation.roll ?? null,
					pitch: parsed?.orientation.pitch ?? null,
					yaw: parsed?.orientation.yaw ?? null,
				};
			}),
		[packets],
	);

	return (
		<ScreenTemplate
			title={
				<div className="flex items-center gap-4">
					Flight {flightDetails.name}{" "}
					<span className="text-muted-foreground inline-flex items-center gap-1 text-sm">
						(<span className="bg-primary inline-block size-3 animate-pulse rounded-full" />
						live)
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
					<div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
						<span>Connected: {connected ? "Yes" : "No"}</span>
						<span>•</span>
						<span>Total packets: {packets.length}</span>
						<span>•</span>
						<span>Loss: {packetLoss}%</span>
					</div>
				</div>

				<div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
					<div className="flex flex-col gap-4">
						<div className="rounded border p-4">
							<div className="text-sm font-semibold">Altitude</div>
							<p className="text-muted-foreground text-xs">GPS altitude over time.</p>
							<div className="mt-4 h-56">
								<ResponsiveContainer
									width="100%"
									height="100%">
									<AreaChart data={chartData}>
										<CartesianGrid strokeDasharray="4 4" />
										<XAxis
											dataKey="index"
											tick={{ fontSize: 10 }}
										/>
										<YAxis tick={{ fontSize: 10 }} />
										<Tooltip />
										<Area
											type="monotone"
											dataKey="altitude"
											stroke="#2563eb"
											fill="#93c5fd"
										/>
									</AreaChart>
								</ResponsiveContainer>
							</div>
						</div>

						<div className="rounded border p-4">
							<div className="text-sm font-semibold">Velocity & Acceleration</div>
							<p className="text-muted-foreground text-xs">Total magnitude telemetry.</p>
							<div className="mt-4 h-56">
								<ResponsiveContainer
									width="100%"
									height="100%">
									<LineChart data={chartData}>
										<CartesianGrid strokeDasharray="4 4" />
										<XAxis
											dataKey="index"
											tick={{ fontSize: 10 }}
										/>
										<YAxis tick={{ fontSize: 10 }} />
										<Tooltip />
										<Legend />
										<Line
											type="monotone"
											dataKey="velocity"
											stroke="#10b981"
											dot={false}
										/>
										<Line
											type="monotone"
											dataKey="acceleration"
											stroke="#f97316"
											dot={false}
										/>
									</LineChart>
								</ResponsiveContainer>
							</div>
						</div>

						<div className="rounded border p-4">
							<div className="text-sm font-semibold">Battery Voltage</div>
							<p className="text-muted-foreground text-xs">Live power readings.</p>
							<div className="mt-4 h-40">
								<ResponsiveContainer
									width="100%"
									height="100%">
									<LineChart data={chartData}>
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
								</ResponsiveContainer>
							</div>
						</div>
					</div>

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
										roll={latestParsed?.orientation.roll}
										pitch={latestParsed?.orientation.pitch}
										yaw={latestParsed?.orientation.yaw}
									/>
								</Canvas>
							</div>
							<div className="text-muted-foreground mt-3 grid grid-cols-3 gap-2 text-xs">
								<div>
									<p className="tracking-[0.2em] uppercase">Roll</p>
									<p className="text-sm font-semibold">{latestParsed?.orientation.roll ?? "—"}°</p>
								</div>
								<div>
									<p className="tracking-[0.2em] uppercase">Pitch</p>
									<p className="text-sm font-semibold">{latestParsed?.orientation.pitch ?? "—"}°</p>
								</div>
								<div>
									<p className="tracking-[0.2em] uppercase">Yaw</p>
									<p className="text-sm font-semibold">{latestParsed?.orientation.yaw ?? "—"}°</p>
								</div>
							</div>
						</div>

						<div className="rounded border p-4">
							<div className="text-sm font-semibold">Latest Telemetry</div>
							<p className="text-muted-foreground text-xs">Snapshot from the newest packet.</p>
							<div className="mt-4 grid gap-3 text-sm">
								<div className="flex items-center justify-between">
									<span className="text-muted-foreground">Altitude</span>
									<span className="font-semibold">{latestParsed?.position.altitude ?? "—"} m</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-muted-foreground">Velocity</span>
									<span className="font-semibold">{latestParsed?.velocity.total ?? "—"} m/s</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-muted-foreground">Acceleration</span>
									<span className="font-semibold">
										{latestParsed?.acceleration.total ?? "—"} m/s²
									</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-muted-foreground">Battery</span>
									<span className="font-semibold">{latestParsed?.batteryVoltage ?? "—"} V</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-muted-foreground">Status</span>
									<span className="font-semibold">
										{latestParsed?.parachuteDeployed ? "Parachute deployed" : "In flight"}
									</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-muted-foreground">Last packet</span>
									<span className="font-semibold">
										{latestPacket ? new Date(latestPacket.receivedAt).toLocaleTimeString() : "—"}
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				{packets.length === 0 && (
					<div className="text-muted-foreground rounded border border-dashed p-4 text-sm">
						No packets received yet. Charts and orientation will update once telemetry arrives.
					</div>
				)}
			</div>
		</ScreenTemplate>
	);
};

export default ActiveFlightScreen;
