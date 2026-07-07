import { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface TelemetryPanelProps {
	title: string;
	action?: ReactNode;
	children: ReactNode;
	className?: string;
	onDoubleClick?: () => void;
}

export const TelemetryPanel = ({ title, action, children, className, onDoubleClick }: TelemetryPanelProps) => {
	return (
		<div
			className="bg-card/60 border-border/60 relative grid h-full grid-rows-[auto_1fr] gap-1 rounded-xl border p-3"
			onDoubleClick={onDoubleClick}>
			<div className="flex items-center justify-between gap-3">
				<div className="text-sm font-bold tracking-tight">{title}</div>
				{action}
			</div>
			<div className={cn("h-full pt-1", className)}>{children}</div>
		</div>
	);
};
