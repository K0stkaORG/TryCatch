import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ReactNode } from "react";
import { Link } from "react-router";

interface ScreenTemplateProps {
	title: ReactNode;
	backPath?: string;
	children: ReactNode;
}

const ScreenTemplate = ({ title, backPath, children }: ScreenTemplateProps) => {
	return (
		<div className="relative grid h-dvh w-dvw grid-rows-[auto_1fr]">
			<header className="border-primary relative flex items-center justify-between overflow-hidden border-b-2 py-2">
				<img
					src="/damascus.png"
					className="absolute inset-0 -z-10 object-cover opacity-10"
				/>
				<div className="flex items-center">
					{backPath && (
						<Link to={backPath}>
							<Button
								variant="ghost"
								className="text-muted-foreground group hover:text-primary flex w-20 items-center gap-0">
								<ArrowLeft className="size-4" />

								<div className="max-w-0 overflow-hidden transition-all group-hover:max-w-20">Back</div>
							</Button>
						</Link>
					)}

					<h1 className="text-2xl font-bold tracking-tight">{title}</h1>
				</div>
				<Link
					to="/"
					className="mr-4 flex items-center gap-4">
					<div className="hidden flex-col sm:flex">
						<span className="text-sm font-semibold tracking-tight">TryCatch</span>
						<span className="text-muted-foreground text-xs">Testing in Production</span>
					</div>
					<div className="ring-primary/60 flex size-11 items-center justify-center rounded-2xl bg-black ring-1">
						<img
							src="/logos/outlinePink.svg"
							alt="TryCatch"
							className="size-6"
						/>
					</div>
				</Link>
			</header>
			<div className="relative size-full overflow-auto px-6 py-4">{children}</div>
		</div>
	);
};

export default ScreenTemplate;
