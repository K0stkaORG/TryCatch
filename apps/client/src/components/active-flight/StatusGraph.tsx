import { formatAxisTime, formatShortTime } from "@/components/active-flight/telemetry-utils";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { TelemetryPanel } from "@/components/active-flight/TelemetryPanel";
import { CircularBuffer } from "@/lib/circularBuffer";
import { RocketFSMState, RocketFSMStates } from "@try-catch/shared-types";
import { useMemo } from "react";

interface StatusGraphProps {
	statusData: CircularBuffer<{
		receivedAt: number;
		fsmState: RocketFSMState;
	}>;
	packetHeartbeat: number;
}

export const StatusGraph = ({ statusData, packetHeartbeat }: StatusGraphProps) => {
	const chartData = useMemo(
		() =>
			statusData.buffer.map((item) => ({
				receivedAt: item.receivedAt,
				fsmState: item.fsmState,
			})),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[packetHeartbeat],
	);

	return (
		<TelemetryPanel
			title="FSM State"
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
						type="category"
						domain={["dataMin", "dataMax"]}
						tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
						tickMargin={8}
						ticks={Object.keys(RocketFSMStates)}
					/>
					<Tooltip
						labelStyle={{ color: "var(--foreground)" }}
						labelFormatter={(value) => formatShortTime(value as number)}
						formatter={(value) => [
							RocketFSMStates[value?.toString() as RocketFSMState] ?? "Unknown state",
							"FSM State",
						]}
						contentStyle={{
							backgroundColor: "var(--card)",
							borderColor: "var(--border)",
							borderRadius: "0.75rem",
						}}
					/>
					<Line
						type="stepAfter"
						dataKey="fsmState" // Now successfully tracks the parsed numeric array
						name="FSM State"
						stroke="var(--chart-1)"
						strokeWidth={2}
						dot={false}
						isAnimationActive={false}
					/>
				</LineChart>
			</ResponsiveContainer>
		</TelemetryPanel>
	);
};
