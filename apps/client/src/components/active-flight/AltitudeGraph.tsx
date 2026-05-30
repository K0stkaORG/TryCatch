import { formatAxisTime, formatShortTime, getSparseTimeTicks } from "@/components/active-flight/telemetry-utils";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { TelemetryPanel } from "@/components/active-flight/TelemetryPanel";
import { CircularBuffer } from "@/lib/circularBuffer";
import { useMemo } from "react";

interface AltitudeGraphProps {
	receivedAt: CircularBuffer<number>;
	altitudeGPS: CircularBuffer<number>;
	altitudeBarometric: CircularBuffer<number>;
	packetHeartbeat: number;
}

export const AltitudeGraph = ({ receivedAt, altitudeGPS, altitudeBarometric, packetHeartbeat }: AltitudeGraphProps) => {
	// eslint-disable-next-line react-hooks/preserve-manual-memoization, react-hooks/exhaustive-deps
	const chartData = useMemo(
		() =>
			altitudeGPS.buffer.map((gps, index) => ({
				receivedAt: receivedAt.buffer[index] ?? 0,
				positionAltitude: gps,
				barometricAltitude: altitudeBarometric.buffer[index] ?? 0,
			})),
		[packetHeartbeat],
	);

	const timeTicks = useMemo(
		() =>
			getSparseTimeTicks(
				chartData.map((point) => point.receivedAt),
				4,
			),
		[chartData],
	);

	return (
		<TelemetryPanel
			title="Altitude"
			action={
				<div className="text-muted-foreground flex items-center gap-3 text-xs">
					<div className="flex items-center gap-1.5">
						<span className="inline-block h-2 w-2 rounded-full bg-[var(--chart-1)]" />
						<span>GPS</span>
					</div>
					<div className="flex items-center gap-1.5">
						<span className="inline-block h-2 w-2 rounded-full bg-[var(--chart-2)]" />
						<span>Barometric</span>
					</div>
				</div>
			}
			className="h-50">
			<ResponsiveContainer>
				<LineChart
					data={chartData}
					margin={{ top: 4, right: 8, left: 2, bottom: 0 }}>
					<CartesianGrid
						strokeDasharray="3 3"
						stroke="var(--border)"
						opacity={0.4}
					/>
					<XAxis
						dataKey="receivedAt"
						type="number"
						scale="time"
						domain={["dataMin", "dataMax"]}
						ticks={timeTicks}
						tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
						tickMargin={8}
						tickFormatter={formatAxisTime}
						interval={0}
					/>
					<YAxis
						tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
						unit=" m"
						width={58}
						tickMargin={6}
					/>
					<Tooltip
						labelStyle={{ color: "var(--foreground)" }}
						labelFormatter={(value) => formatShortTime(value as number)}
						contentStyle={{
							backgroundColor: "var(--card)",
							borderColor: "var(--border)",
							borderRadius: "0.75rem",
						}}
					/>
					<Line
						type="monotone"
						dataKey="positionAltitude"
						name="GPS"
						stroke="var(--chart-1)"
						strokeWidth={2.2}
						dot={false}
						isAnimationActive={false}
					/>
					<Line
						type="monotone"
						dataKey="barometricAltitude"
						name="Barometric"
						stroke="var(--chart-2)"
						strokeWidth={2}
						dot={false}
						isAnimationActive={false}
					/>
				</LineChart>
			</ResponsiveContainer>
		</TelemetryPanel>
	);
};
