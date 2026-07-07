import { RocketFSMState, RocketFSMStates } from "@try-catch/shared-types";
import { BatteryCharging, Brain, Magnet, Weight } from "lucide-react";
import { useState } from "react";
import { TelemetryPanel } from "./TelemetryPanel";

interface StatusDisplay {
	fsmState: RocketFSMState;
	batteryVoltage: number;
	pressureHpa: number;
	hallEffect: number;
}

const VOLTAGE = {
	MAX: 4.2,
	WARN: 3.7,
	LOW: 3.2,
};

export const StatusDisplay = ({ fsmState, batteryVoltage, pressureHpa, hallEffect }: StatusDisplay) => {
	const [mode, setMode] = useState<"pressure" | "hallEffect">("pressure");

	const batteryFillClassName =
		batteryVoltage >= VOLTAGE.WARN
			? "bg-emerald-300"
			: batteryVoltage >= VOLTAGE.LOW
				? "bg-yellow-300"
				: "bg-red-300";

	const batteryPercentage = Math.max((batteryVoltage / VOLTAGE.MAX) * 100, 100);

	const fsmStateName = RocketFSMStates[fsmState] ?? null;

	const handleModeToggle = () => {
		setMode((prevMode) => (prevMode === "pressure" ? "hallEffect" : "pressure"));
	};

	return (
		<TelemetryPanel
			title="Status"
			className="grid gap-2 xl:grid-cols-3">
			<div className="bg-card/70 border-border/60 rounded-xl border p-3">
				<div className="text-muted-foreground mb-1 flex items-center gap-1.5 text-[10px] font-medium tracking-wide uppercase">
					<Brain className="text-muted-foreground size-5" />
					FSM State
				</div>
				<div className="text-lg leading-tight font-semibold">
					<code>0x{fsmState}</code>
				</div>
				{fsmState ? (
					<div className="text-muted-foreground mt-1 text-xs">({fsmStateName})</div>
				) : (
					<div className="mt-1 text-xs text-red-700">Unknown state!</div>
				)}
			</div>

			<div className="bg-card/70 border-border/60 grid grid-cols-[1fr_auto] items-center gap-2 rounded-xl border p-3">
				<div>
					<div className="text-muted-foreground mb-1 flex items-center gap-1.5 text-[10px] font-medium tracking-wide uppercase">
						<BatteryCharging className="text-muted-foreground size-5" />
						Battery
					</div>
					<div className="text-lg leading-tight font-semibold">
						<code>{batteryVoltage.toFixed(2)}V</code>
					</div>
				</div>
				<div className="relative aspect-3/4 h-full">
					<div className="h-full overflow-hidden rounded-md border-2 border-white">
						<div
							className={`w-full ${batteryFillClassName} rounded-[2px] transition-[height] duration-300`}
							style={{ height: `${batteryPercentage.toFixed(0)}%` }}
						/>
					</div>
					<div className="absolute -top-0.75 left-1/2 h-1.25 w-2.5 -translate-x-1/2 rounded-t border-2 border-b-0 border-white" />
				</div>
			</div>

			<div
				className="bg-card/70 border-border/60 rounded-xl border p-3"
				onDoubleClick={handleModeToggle}>
				{mode === "pressure" ? (
					<>
						<div className="text-muted-foreground mb-1 flex items-center gap-1.5 text-[10px] font-medium tracking-wide uppercase">
							<Weight className="text-muted-foreground size-5" />
							Pressure
						</div>
						<div className="text-lg leading-tight font-semibold">
							<code>{pressureHpa} hPa</code>
						</div>
					</>
				) : (
					<>
						<div className="text-muted-foreground mb-1 flex items-center gap-1.5 text-[10px] font-medium tracking-wide uppercase">
							<Magnet className="text-muted-foreground size-5" />
							Hall effect
						</div>
						<div className="text-lg leading-tight font-semibold">
							<code>{hallEffect}</code>
						</div>
					</>
				)}
			</div>
		</TelemetryPanel>
	);
};
