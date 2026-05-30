import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

import { CircularBuffer } from "@/lib/circularBuffer";
import { useMemo } from "react";
import { TelemetryPanel } from "./TelemetryPanel";

interface PacketLossGraphProps {
	packetLoss: CircularBuffer<number>;
	packetLossHeartbeat: number;
}

export const PacketLossGraph = ({ packetLoss, packetLossHeartbeat }: PacketLossGraphProps) => {
	const current = packetLoss.last;
	const average = packetLoss.buffer.reduce((sum, value) => sum + value, 0) / packetLoss.capacity;

	// eslint-disable-next-line react-hooks/preserve-manual-memoization, react-hooks/exhaustive-deps
	const graphData = useMemo(() => packetLoss.buffer.map((value, index) => ({ value, index })), [packetLossHeartbeat]);

	return (
		<TelemetryPanel title="Packet loss">
			<div className="relative grid size-full grid-rows-[auto_auto] gap-2">
				<div className="min-h-16">
					<ResponsiveContainer>
						<AreaChart
							data={graphData}
							margin={{
								top: 2,
								right: 0,
								bottom: 2,
								left: -15,
							}}>
							<defs>
								<linearGradient
									id="gradient"
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
							<XAxis
								dataKey="index"
								hide={true}
							/>
							<YAxis
								domain={[0, 100]}
								unit="%"
							/>
							<Area
								type="monotone"
								dataKey="value"
								stroke="var(--chart-1)"
								fill="url(#gradient)"
								strokeWidth={2}
								dot={false}
								isAnimationActive={false}
							/>
						</AreaChart>
					</ResponsiveContainer>
				</div>
				<div className="text-muted-foreground text-center font-mono text-sm whitespace-pre">
					Current: {current.toFixed(2).padStart(6, " ")}% | Average: {average.toFixed(2).padStart(6, " ")}%
				</div>
			</div>
		</TelemetryPanel>
	);
};
