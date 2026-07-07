import { formatArchivedAxisTime, formatShortTime } from "@/components/active-flight/telemetry-utils";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { TelemetryPanel } from "@/components/active-flight/TelemetryPanel";
import { CircularBuffer } from "@/lib/circularBuffer";
import { useMemo } from "react";

interface PressureGraphProps {
	pressureHpaGraph: CircularBuffer<{
		receivedAt: number;
		value: number;
	}>;
	packetHeartbeat: number;
	isArchived?: boolean;
	flightStart?: number;
}

const formatCompact = (value: number) => {
	if (!Number.isFinite(value)) return "";
	const abs = Math.abs(value);

	if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
	if (abs >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
	if (abs >= 100) return value.toFixed(0);
	if (abs >= 10) return value.toFixed(1);
	return value.toFixed(2);
};

export const PressureGraph = ({ pressureHpaGraph, packetHeartbeat, isArchived, flightStart }: PressureGraphProps) => {
	const chartData = useMemo(
		() => [...pressureHpaGraph.buffer],
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[packetHeartbeat],
	);

	return (
		<TelemetryPanel
			title="Pressure"
			className="h-44 xl:h-full">
			<ResponsiveContainer>
				<AreaChart
					data={chartData}
					syncId={isArchived ? "telemetry" : undefined}
					margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
					<defs>
						<linearGradient
							id="pressureGradient"
							x1="0"
							y1="0"
							x2="0"
							y2="1">
							<stop
								offset="5%"
								stopColor="var(--chart-1)"
								stopOpacity={0.5}
							/>
							<stop
								offset="95%"
								stopColor="var(--chart-1)"
								stopOpacity={0.05}
							/>
						</linearGradient>
					</defs>
					<CartesianGrid
						strokeDasharray="3 3"
						stroke="var(--border)"
						opacity={0.4}
					/>
					<XAxis
						dataKey="receivedAt"
						type="number"
						domain={["dataMin", "dataMax"]}
						tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
						tickMargin={8}
						tickFormatter={formatArchivedAxisTime(flightStart ?? Date.now())}
						interval={0}
					/>
					<YAxis
						tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
						width={66}
						tickMargin={6}
						tickFormatter={formatCompact}
						unit=" V"
					/>
					<Tooltip
						labelStyle={{ color: "var(--foreground)" }}
						labelFormatter={(value) => formatShortTime(value as number)}
						formatter={(value) => (value as number).toFixed(2) + " Hpa"}
						contentStyle={{
							backgroundColor: "var(--card)",
							borderColor: "var(--border)",
							borderRadius: "0.75rem",
						}}
					/>
					<Area
						type="monotone"
						dataKey="value"
						stroke="var(--chart-1)"
						fill="url(#pressureGradient)"
						strokeWidth={2}
						dot={false}
						isAnimationActive={false}
					/>
				</AreaChart>
			</ResponsiveContainer>
		</TelemetryPanel>
	);
};
