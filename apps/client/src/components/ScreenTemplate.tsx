import { Button } from "@/components/ui/button";
import { Activity, ArrowLeft, Home } from "lucide-react";
import { Link, NavLink } from "react-router";

interface ScreenTemplateProps {
	title: string;
	backPath?: string;
	children: React.ReactNode;
	scrollable?: boolean;
}

const ScreenTemplate = ({ title, backPath, children, scrollable = true }: ScreenTemplateProps) => {
	const navItems = [
		{ to: "/", label: "Dashboard", icon: Home },
		{ to: "/flight/active", label: "Live Flight", icon: Activity },
	];

	return (
		<div className="bg-background text-foreground min-h-dvh w-full overflow-x-hidden">
			<div className="flex min-h-dvh flex-col">
				<header className="bg-background/80 sticky top-0 z-30 border-b backdrop-blur">
					<div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-3 px-3 md:px-4">
						<Link
							to="/"
							className="flex items-center gap-3">
							<div className="ring-primary/60 flex size-11 items-center justify-center rounded-2xl bg-black ring-1">
								<img
									src="/logos/outline.svg"
									alt="TryCatch"
									className="size-6"
									style={{
										filter: "invert(18%) sepia(91%) saturate(4472%) hue-rotate(311deg) brightness(104%) contrast(105%)",
									}}
								/>
							</div>
							<div className="hidden flex-col sm:flex">
								<span className="text-sm font-semibold tracking-tight">TryCatch</span>
								<span className="text-muted-foreground text-xs">Testing in Production</span>
							</div>
						</Link>

						<nav className="ml-2 hidden items-center gap-2 sm:flex">
							{navItems.map(({ to, label, icon: Icon }) => (
								<NavLink
									key={to}
									to={to}
									className={({ isActive }) =>
										`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition ${
											isActive
												? "bg-primary/15 text-primary ring-primary/30 ring-1"
												: "text-muted-foreground hover:text-foreground hover:bg-muted/40"
										}`
									}>
									<Icon className="size-3.5" />
									<span>{label}</span>
								</NavLink>
							))}
						</nav>

						<div className="ml-auto flex items-center" />
					</div>

					<div className="border-t sm:hidden">
						<nav className="mx-auto flex w-full max-w-7xl items-center gap-2 px-3 py-1.5">
							{navItems.map(({ to, label, icon: Icon }) => (
								<NavLink
									key={to}
									to={to}
									className={({ isActive }) =>
										`flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-medium transition ${
											isActive
												? "bg-primary/15 text-primary ring-primary/30 ring-1"
												: "text-muted-foreground hover:text-foreground hover:bg-muted/40"
										}`
									}>
									<Icon className="size-3.5" />
									<span>{label}</span>
								</NavLink>
							))}
						</nav>
					</div>
				</header>

				<div
					className={`flex min-h-0 w-full flex-1 flex-col overflow-x-hidden ${
						scrollable ? "overflow-y-auto [scrollbar-gutter:stable]" : "overflow-hidden"
					}`}>
					<div
						className={`mx-auto flex w-full max-w-7xl flex-1 flex-col ${
							scrollable ? "min-h-full" : "h-full"
						}`}>
						{backPath && (
							<div className="px-3 pt-3 md:px-4 md:pt-4">
								<Button
									variant="ghost"
									asChild
									className="text-muted-foreground hover:text-primary gap-2 px-2 pl-0 hover:bg-transparent">
									<Link to={backPath}>
										<ArrowLeft className="size-4" />
										Back
									</Link>
								</Button>
							</div>
						)}

						<div className="animate-in fade-in zoom-in-95 flex flex-1 flex-col px-3 pt-4 pb-4 duration-500 md:px-4">
							<div className="mb-4">
								<h1 className="text-xl font-semibold tracking-tight md:text-2xl">{title}</h1>
							</div>
							{children}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ScreenTemplate;
