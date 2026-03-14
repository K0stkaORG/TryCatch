import { useLoaderData } from "react-router";

import ScreenTemplate from "@/components/ScreenTemplate";
import { FlightsListResponse } from "@try-catch/shared-types";

const FlightsScreen = () => {
	const { activeFlight, archivedFlights } = useLoaderData<FlightsListResponse>();

	return (
		<ScreenTemplate title="Flights">
			<div>
				<h2 className="text-lg font-semibold">Active Flight</h2>
				{activeFlight ? (
					<div className="bg-card rounded-lg p-4 shadow">
						<h3 className="text-md font-medium">{activeFlight.name}</h3>
						<p className="text-muted-foreground text-sm">ID: {activeFlight.id}</p>
					</div>
				) : (
					<p className="text-muted-foreground text-sm">No active flight</p>
				)}

				<h2 className="mt-6 text-lg font-semibold">Archived Flights</h2>
				{archivedFlights.length > 0 ? (
					archivedFlights.map((flight) => (
						<div
							key={flight.id}
							className="bg-card mb-4 rounded-lg p-4 shadow">
							<h3 className="text-md font-medium">{flight.name}</h3>
							<p className="text-muted-foreground text-sm">ID: {flight.id}</p>
						</div>
					))
				) : (
					<p className="text-muted-foreground text-sm">No archived flights</p>
				)}
			</div>
		</ScreenTemplate>
	);
};

export default FlightsScreen;
