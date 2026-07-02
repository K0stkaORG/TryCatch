import { Cpu, RadioTower, ShieldAlert, SlidersHorizontal } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { request } from "@/lib/server";
import type { RocketCommandRequest } from "@try-catch/shared-types";

type RocketCommand = {
	label: string;
	description: string;
	bytes: [number, number, number, number];
	variant?: "default" | "destructive" | "outline" | "secondary";
};

type RocketCommandCategory = {
	title: string;
	icon: ReactNode;
	commands: RocketCommand[];
};

const formatBytes = (bytes: RocketCommand["bytes"]) =>
	bytes.map((byte) => `0x${byte.toString(16).padStart(2, "0")}`).join(" ");

const commandCategories: RocketCommandCategory[] = [
	{
		title: "Servos",
		icon: <SlidersHorizontal className="size-4" />,
		commands: [
			{
				label: "Deploy servo",
				description: "Send the deploy-servo command.",
				bytes: [0x47, 0x43, 0xaa, 0x00],
			},
			{
				label: "Reset servo",
				description: "Return the servo to its reset position.",
				bytes: [0x47, 0x43, 0xaa, 0x01],
				variant: "secondary",
			},
		],
	},
	{
		title: "Recovery",
		icon: <ShieldAlert className="size-4" />,
		commands: [
			{
				label: "Deploy drogue",
				description: "Trigger drogue deployment.",
				bytes: [0x47, 0x43, 0xab, 0x00],
				variant: "destructive",
			},
			{
				label: "Deploy main",
				description: "Trigger main parachute deployment.",
				bytes: [0x47, 0x43, 0xab, 0x01],
				variant: "destructive",
			},
		],
	},
	{
		title: "Radio",
		icon: <RadioTower className="size-4" />,
		commands: [
			{
				label: "Ping rocket",
				description: "Request an immediate command acknowledgement.",
				bytes: [0x47, 0x43, 0xac, 0x00],
				variant: "outline",
			},
			{
				label: "Request status",
				description: "Ask the rocket to send a status update.",
				bytes: [0x47, 0x43, 0xac, 0x01],
				variant: "outline",
			},
		],
	},
	{
		title: "System",
		icon: <Cpu className="size-4" />,
		commands: [
			{
				label: "Reset flight computer",
				description: "Request a flight-computer reset.",
				bytes: [0x47, 0x43, 0xad, 0x00],
				variant: "destructive",
			},
			{
				label: "Clear command latch",
				description: "Clear latched command state on the rocket.",
				bytes: [0x47, 0x43, 0xad, 0x01],
				variant: "secondary",
			},
		],
	},
];

const sendRocketCommand = (bytes: RocketCommand["bytes"]) => {
	void request<RocketCommandRequest, void>({
		path: "/rocket/command",
		data: { bytes },
		showPendingToast: false,
	});
};

const CONFIRM_TIMEOUT_MS = 3000;

const tooltipVariantClassName = (variant: RocketCommand["variant"] = "default") => {
	switch (variant) {
		case "destructive":
			return "bg-destructive text-white [&_svg]:bg-destructive [&_svg]:fill-destructive";
		case "outline":
			return "bg-background text-foreground border shadow-md [&_svg]:bg-background [&_svg]:fill-background";
		case "secondary":
			return "bg-secondary text-secondary-foreground [&_svg]:bg-secondary [&_svg]:fill-secondary";
		case "default":
		default:
			return undefined;
	}
};

export const RocketControlPanel = () => {
	const [pendingCommandKey, setPendingCommandKey] = useState<string | null>(null);

	useEffect(() => {
		if (!pendingCommandKey) return;

		const timeout = window.setTimeout(() => setPendingCommandKey(null), CONFIRM_TIMEOUT_MS);

		return () => window.clearTimeout(timeout);
	}, [pendingCommandKey]);

	const handleCommandClick = (commandKey: string, bytes: RocketCommand["bytes"]) => {
		if (pendingCommandKey !== commandKey) {
			setPendingCommandKey(commandKey);
			return;
		}

		sendRocketCommand(bytes);
		setPendingCommandKey(null);
	};

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button
					className="h-10 rounded-xl border xl:h-full"
					variant="secondary">
					<SlidersHorizontal className="size-4" />
					Controls
				</Button>
			</DialogTrigger>
			<DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-6xl overflow-x-hidden overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Rocket control panel</DialogTitle>
					<DialogDescription />
				</DialogHeader>

				<div className="grid auto-rows-min grid-cols-[repeat(auto-fit,minmax(14rem,1fr))] gap-3">
					{commandCategories.map((category) => (
						<section
							key={category.title}
							className="bg-card/70 border-border/60 min-w-0 rounded-xl border p-3">
							<div className="mb-2 flex items-center gap-2">
								<div className="bg-primary/10 text-primary rounded-md p-1.5">{category.icon}</div>
								<h3 className="text-sm leading-tight font-semibold">{category.title}</h3>
							</div>

							<div className="grid grid-cols-[repeat(auto-fit,minmax(6.5rem,1fr))] gap-1.5">
								{category.commands.map((command) => {
									const commandKey = `${category.title}-${command.label}`;
									const isPending = pendingCommandKey === commandKey;
									const buttonVariant = isPending ? "destructive" : (command.variant ?? "default");

									return (
										<Tooltip key={commandKey}>
											<TooltipTrigger asChild>
												<Button
													variant={buttonVariant}
													className="h-auto min-h-14 min-w-0 flex-col items-start justify-center gap-1.5 overflow-hidden rounded-lg px-2.5 py-2 text-left whitespace-normal shadow-sm"
													onClick={() => handleCommandClick(commandKey, command.bytes)}>
													<span className="line-clamp-2 w-full text-sm leading-tight font-semibold wrap-break-word">
														{isPending ? "Click again" : command.label}
													</span>
													<code className="w-full text-[10px] leading-none font-medium opacity-80">
														{isPending ? "Confirm send" : formatBytes(command.bytes)}
													</code>
												</Button>
											</TooltipTrigger>
											<TooltipContent className={tooltipVariantClassName(buttonVariant)}>
												<div className="font-medium">
													{isPending ? "Click again to send" : command.description}
												</div>
												<code className="mt-1 block opacity-80">
													{formatBytes(command.bytes)}
												</code>
											</TooltipContent>
										</Tooltip>
									);
								})}
							</div>
						</section>
					))}
				</div>
			</DialogContent>
		</Dialog>
	);
};
