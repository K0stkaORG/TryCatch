import { Link, useLoaderData } from "react-router";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { FlightsListResponse } from "@try-catch/shared-types";
import { ArrowRight, Github, Rocket, Scroll } from "lucide-react";
import { ReactNode } from "react";

const FlightsCard = ({ children, className }: { children?: ReactNode; className?: string }) => {
	return <Card className={cn("relative h-full w-full", className)}>{children}</Card>;
};

const FlightsScreen = () => {
	const { activeFlight, archivedFlights } = useLoaderData<FlightsListResponse>();

	return (
		<div className="from-primary/20 to-primary/30 relative flex h-dvh w-dvw items-center justify-center bg-linear-to-br via-transparent">
			<img
				src="/damascus.png"
				className="absolute inset-0 object-cover"
			/>
			<div className="relative grid h-9/10 w-9/10 grid-cols-2 grid-rows-[auto_1fr] gap-4">
				<FlightsCard>
					<CardHeader>
						<CardTitle className="text-primary flex items-center justify-between gap-6 text-4xl">
							{"{TryCatch}"}
							<img
								src="/logos/outlinePink.svg"
								className="size-16"
							/>
						</CardTitle>
						<CardDescription className="mt-2">
							Ground station for model rockets developed by Testing in Production team for Czech Rocket
							Challenge 2026.
						</CardDescription>
					</CardHeader>

					<CardContent>
						<a
							href="https://github.com/K0stkaORG/TryCatch"
							target="_blank"
							className="text-primary/80 inline-flex items-center gap-2 underline decoration-dashed transition-all hover:decoration-0">
							<Github /> Source code
						</a>
					</CardContent>
				</FlightsCard>
				<FlightsCard className="row-start-2 flex items-center justify-center">
					{activeFlight ? (
						<>
							<pre>{JSON.stringify(activeFlight, null, 2)}</pre>
							<Link to="/flight/active">Open</Link>
						</>
					) : (
						<>
							There is no ongoint flight
							<Link to="/flight/new">
								<Button className="flex items-center gap-2">
									<Rocket />
									Start one
								</Button>
							</Link>
						</>
					)}
				</FlightsCard>
				<FlightsCard className="row-span-2">
					<CardHeader className="text-muted-foreground bg-card/70 sticky top-0 -mb-4 text-xl backdrop-blur">
						<CardTitle className="flex items-center gap-3">
							<Scroll />
							Archived flights
						</CardTitle>
					</CardHeader>
					<CardContent className="flex h-full flex-col gap-4 overflow-auto">
						{archivedFlights.map((flight) => (
							<div
								key={flight.id}
								className="flex items-center justify-between rounded-md border p-4">
								<div>
									<h3 className="text-lg font-semibold">{flight.name}</h3>
									<p className="text-muted-foreground text-sm">
										{new Date(flight.createdAt).toLocaleString()}
									</p>
								</div>
								<Link
									to={`/flight/${flight.id}`}
									className="text-primary/80 flex items-center gap-1 underline decoration-dashed transition-all hover:decoration-0">
									View details
									<ArrowRight className="size-4" />
								</Link>
							</div>
						))}
						{archivedFlights.length === 0 && (
							<p className="text-muted-foreground/50 mt-4 text-center">No archived flights yet...</p>
						)}
					</CardContent>
				</FlightsCard>
			</div>
		</div>
	);
};

export default FlightsScreen;
