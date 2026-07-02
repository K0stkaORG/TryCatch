import { formatAxisTime, formatShortTime } from "@/components/active-flight/telemetry-utils";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { TelemetryPanel } from "@/components/active-flight/TelemetryPanel";
import { CircularBuffer } from "@/lib/circularBuffer";
import { useMemo } from "react";

interface StatusGraphProps {
	statusData: CircularBuffer<{
		receivedAt: number;
		launchDetected: boolean;
		apogeeDetected: boolean;
		parachuteDeployed: boolean;
	}>;
	packetHeartbeat: number;
}

export const StatusGraph = ({ statusData, packetHeartbeat }: StatusGraphProps) => {
	const chartData = useMemo(
		() =>
			statusData.buffer.map((item) => ({
				receivedAt: item.receivedAt,
				launchDetected: item.launchDetected ? 1 : 0,
				apogeeDetected: item.apogeeDetected ? 1 : 0,
				parachuteDeployed: item.parachuteDeployed ? 1 : 0,
			})),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[packetHeartbeat],
	);

	return (
		<TelemetryPanel
			title="Status"
			className="h-44">
			<ResponsiveContainer>
				<LineChart
					data={chartData}
					margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
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
						tickFormatter={formatAxisTime}
						interval={0}
					/>
					<YAxis
						domain={[0, 1]}
						ticks={[0, 1]}
						tickFormatter={(value) => (value === 1 ? "On" : "Off")}
						tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
						width={40}
					/>
					<Tooltip
						labelStyle={{ color: "var(--foreground)" }}
						labelFormatter={(value) => formatShortTime(value as number)}
						formatter={(value, name) => [(value as number) ? "On" : "Off", name as string]}
						contentStyle={{
							backgroundColor: "var(--card)",
							borderColor: "var(--border)",
							borderRadius: "0.75rem",
						}}
					/>
					<Line
						type="stepAfter"
						dataKey="launchDetected"
						name="Launch"
						stroke="var(--chart-1)"
						strokeWidth={2}
						dot={false}
						isAnimationActive={false}
					/>
					<Line
						type="stepAfter"
						dataKey="apogeeDetected"
						name="Apogee"
						stroke="var(--chart-2)"
						strokeWidth={2}
						dot={false}
						isAnimationActive={false}
					/>
					<Line
						type="stepAfter"
						dataKey="parachuteDeployed"
						name="Parachute"
						stroke="var(--chart-3)"
						strokeWidth={2}
						dot={false}
						isAnimationActive={false}
					/>
				</LineChart>
			</ResponsiveContainer>
		</TelemetryPanel>
	);
};
