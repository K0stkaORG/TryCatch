interface BatteryIndicatorProps {
	batteryVoltage?: number;
	maxBatteryVoltage: number;
}

export const BatteryIndicator = ({ batteryVoltage, maxBatteryVoltage }: BatteryIndicatorProps) => {
	const safeVoltage = typeof batteryVoltage === "number" ? batteryVoltage : 0;
	const chargePercent = Math.max(0, Math.min(100, (safeVoltage / maxBatteryVoltage) * 100));
	const chargeLabel = chargePercent >= 70 ? "Healthy" : chargePercent >= 30 ? "Medium" : "Low";
	const fillClassName = chargePercent >= 70 ? "bg-primary" : chargePercent >= 30 ? "bg-orange-400" : "bg-destructive";

	return (
		<div className="bg-card/60 border-border/60 flex h-full flex-col justify-between rounded-xl border p-3">
			<div className="flex items-start justify-between gap-3">
				<h3 className="text-sm font-semibold tracking-tight">Battery</h3>
				<div className="bg-muted/40 rounded-lg border px-2 py-1 text-right">
					<p className="text-[10px] uppercase">State</p>
					<p className="text-sm font-semibold">{chargeLabel}</p>
				</div>
			</div>

			<div className="flex items-center gap-3">
				<div className="relative w-full">
					<div className="border-foreground/40 bg-muted/40 h-12 w-full rounded-md border p-1">
						<div className="bg-background h-full w-full rounded-lg border border-transparent p-0.5">
							<div
								className={`h-full rounded-[2px] ${fillClassName} transition-[width] duration-300`}
								style={{ width: `${chargePercent.toFixed(1)}%` }}
							/>
						</div>
					</div>
					<div className="border-foreground/40 bg-muted/40 absolute top-1/2 -right-2 h-6 w-2 -translate-y-1/2 rounded-r border" />
				</div>
			</div>

			<div className="text-muted-foreground flex items-end justify-between text-xs">
				<span className="text-base font-semibold text-white">{safeVoltage.toFixed(2)} V</span>
				<span>{chargePercent.toFixed(1)}%</span>
			</div>
		</div>
	);
};
