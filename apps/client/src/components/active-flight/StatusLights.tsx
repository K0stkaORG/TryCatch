import { Mountain, Rocket, Umbrella } from "lucide-react";
import { TelemetryPanel } from "./TelemetryPanel";

interface StatusLightsProps {
	launchDetected: boolean;
	apogeeDetected: boolean;
	parachuteDeployed: boolean;
	batteryVoltage: number;
}

const VOLTAGE = {
	MAX: 4.2,
	WARN: 3.7,
	LOW: 3.2,
};

export const StatusLights = ({
	launchDetected,
	apogeeDetected,
	parachuteDeployed,
	batteryVoltage,
}: StatusLightsProps) => {
	const batteryFillClassName =
		batteryVoltage >= VOLTAGE.WARN
			? "bg-emerald-300"
			: batteryVoltage >= VOLTAGE.LOW
				? "bg-yellow-300"
				: "bg-red-300";

	const batteryPercentage = Math.max((batteryVoltage / VOLTAGE.MAX) * 100, 100);

	const lights = [
		{ key: "launch", value: launchDetected, title: "Launch", Icon: Rocket },
		{ key: "apogee", value: apogeeDetected, title: "Apogee", Icon: Mountain },
		{ key: "parachute", value: parachuteDeployed, title: "Parachute", Icon: Umbrella },
	];

	return (
		<TelemetryPanel
			title="Status"
			className="flex flex-col gap-4">
			<div className="grid grid-cols-3 gap-2">
				{lights.map((light) => {
					return (
						<div
							key={light.key}
							className={`bg-muted/30 flex items-center justify-center rounded-lg border px-2 py-2 ${
								light.value ? "text-emerald-300" : "text-muted-foreground"
							} `}>
							<div className="flex items-center gap-2">
								<light.Icon className="size-4" />
								{light.title}
							</div>
						</div>
					);
				})}
			</div>

			<div className="flex items-center gap-2">
				<div className="relative h-4 w-full">
					<div className="h-full overflow-hidden rounded-md border-2 border-white">
						<div
							className={`h-full ${batteryFillClassName} rounded-[2px] transition-[width] duration-300`}
							style={{ width: `${batteryPercentage.toFixed(0)}%` }}
						/>
					</div>
					<div className="absolute top-1/2 -right-0.75 h-2.5 w-1.25 -translate-y-1/2 rounded-r border-2 border-l-0 border-white" />
				</div>
				<span className="text-muted-foreground w-11 text-right text-xs">{batteryVoltage.toFixed(2)}V</span>
			</div>
		</TelemetryPanel>
	);
};
