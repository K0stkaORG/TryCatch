import { formatAxisTime, formatShortTime } from "@/components/active-flight/telemetry-utils";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { TelemetryPanel } from "@/components/active-flight/TelemetryPanel";
import { CircularBuffer } from "@/lib/circularBuffer";
import { useMemo } from "react";

interface PositionGraphsProps {
	chartData: CircularBuffer<{
		receivedAt: number;
		altitudeBarometric: number;
		altitudeVelocity: number;
		altitudeAcceleration: number;
		totalAcceleration: number;
	}>;
	packetHeartbeat: number;
}

const formatTick = (value: number) => {
	if (!Number.isFinite(value)) return "";
	if (Math.abs(value) >= 100) return value.toFixed(0);
	if (Math.abs(value) >= 10) return value.toFixed(1);
	return value.toFixed(2);
};

export const PositionGraphs = ({ chartData, packetHeartbeat }: PositionGraphsProps) => {
	// eslint-disable-next-line react-hooks/preserve-manual-memoization, react-hooks/exhaustive-deps
	const chartDataBuffer = useMemo(() => [...chartData.buffer], [packetHeartbeat]);

	return (
		<div className="grid h-full gap-3 xl:grid-cols-3">
			<TelemetryPanel
				title="Altitude"
				className="h-44 xl:h-full">
				<ResponsiveContainer>
					<LineChart
						data={chartDataBuffer}
						margin={{ top: 0, right: 9, left: 0, bottom: 0 }}>
						<CartesianGrid
							strokeDasharray="3 3"
							stroke="var(--border)"
							opacity={0.4}
						/>
						<XAxis
							dataKey="receivedAt"
							type="number"
							domain={["dataMin", "dataMax"]}
							tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
							tickFormatter={formatAxisTime}
							interval={0}
						/>
						<YAxis
							tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
							width={56}
							tickMargin={6}
							tickFormatter={formatTick}
							unit=" m"
						/>
						<Tooltip
							labelStyle={{ color: "var(--foreground)" }}
							labelFormatter={(value) => formatShortTime(value as number)}
							formatter={(value) => (value as number).toFixed(2) + "m"}
							contentStyle={{
								backgroundColor: "var(--card)",
								borderColor: "var(--border)",
								borderRadius: "0.75rem",
							}}
						/>
						<Line
							type="monotone"
							dataKey="altitudeBarometric"
							stroke="var(--chart-2)"
							name="Baro"
							strokeWidth={2}
							dot={false}
							isAnimationActive={false}
						/>
					</LineChart>
				</ResponsiveContainer>
			</TelemetryPanel>

			<TelemetryPanel
				title="Velocity"
				className="h-44 xl:h-full">
				<ResponsiveContainer>
					<LineChart
						data={chartDataBuffer}
						margin={{ top: 0, right: 9, left: 0, bottom: 0 }}>
						<CartesianGrid
							strokeDasharray="3 3"
							stroke="var(--border)"
							opacity={0.4}
						/>
						<XAxis
							dataKey="receivedAt"
							domain={["dataMin", "dataMax"]}
							type="number"
							tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
							tickFormatter={formatAxisTime}
							interval={0}
						/>
						<YAxis
							tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
							width={56}
							tickMargin={6}
							tickFormatter={formatTick}
						/>
						<Tooltip
							labelStyle={{ color: "var(--foreground)" }}
							labelFormatter={(value) => formatShortTime(value as number)}
							formatter={(value) => (value as number).toFixed(2) + " m/s"}
							contentStyle={{
								backgroundColor: "var(--card)",
								borderColor: "var(--border)",
								borderRadius: "0.75rem",
							}}
						/>
						<Line
							type="monotone"
							dataKey="altitudeVelocity"
							name="Altitude"
							stroke="var(--chart-1)"
							strokeWidth={2.3}
							dot={false}
							isAnimationActive={false}
						/>
					</LineChart>
				</ResponsiveContainer>
			</TelemetryPanel>

			<TelemetryPanel
				title="Acceleration"
				className="h-44 xl:h-full">
				<ResponsiveContainer>
					<LineChart
						data={chartDataBuffer}
						margin={{ top: 4, right: 6, left: 2, bottom: 0 }}>
						<CartesianGrid
							strokeDasharray="3 3"
							stroke="var(--border)"
							opacity={0.4}
						/>
						<XAxis
							dataKey="receivedAt"
							type="number"
							domain={["dataMin", "dataMax"]}
							tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
							tickFormatter={formatAxisTime}
							interval={0}
						/>
						<YAxis
							tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
							width={56}
							tickMargin={6}
							tickFormatter={formatTick}
						/>
						<Tooltip
							labelStyle={{ color: "var(--foreground)" }}
							labelFormatter={(value) => formatShortTime(value as number)}
							formatter={(value) => (value as number).toFixed(2) + " m/s²"}
							contentStyle={{
								backgroundColor: "var(--card)",
								borderColor: "var(--border)",
								borderRadius: "0.75rem",
							}}
						/>
						<Line
							type="monotone"
							dataKey="altitudeAcceleration"
							name="Altitude"
							stroke="var(--chart-1)"
							strokeWidth={2.3}
							dot={false}
							isAnimationActive={false}
						/>
						<Line
							type="monotone"
							dataKey="totalAcceleration"
							name="Total"
							stroke="var(--chart-2)"
							strokeWidth={1.5}
							dot={false}
							isAnimationActive={false}
						/>
					</LineChart>
				</ResponsiveContainer>
			</TelemetryPanel>
		</div>
	);
};
