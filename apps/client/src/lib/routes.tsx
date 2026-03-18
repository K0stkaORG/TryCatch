import { Outlet, createBrowserRouter, data, isRouteErrorResponse, useRouteError } from "react-router";

import { RootLayout } from "@/components/RootLayout";
import ActiveFlightScreen from "@/screens/ActiveFlight.screen";
import ErrorScreen from "@/screens/Error.screen";
import FinishedFlightScreen from "@/screens/FinishedFlightDetails";
import FlightsScreen from "@/screens/Flights.screen";
import {
	ActiveFlightDataResponse,
	FinishedFlightDataRequest,
	FinishedFlightDataResponse,
	FlightsListResponse,
} from "@try-catch/shared-types";
import { RouterProvider } from "react-router/dom";
import { request } from "./server";

function RootErrorBoundary() {
	const error = useRouteError();

	if (isRouteErrorResponse(error)) {
		if (error.status === 404)
			return (
				<ErrorScreen
					title="Signal lost (404)"
					backAndHomeButtons
				/>
			);

		return (
			<ErrorScreen
				title={`${error.status} ${error.statusText}`}
				details={<pre>{JSON.stringify(error.data, null, 2)}</pre>}
			/>
		);
	} else if (error instanceof Error)
		return (
			<ErrorScreen
				title="An unexpected error occurred"
				details={
					<div>
						<p>{error.message}</p>
						<pre>{error.stack}</pre>
					</div>
				}
			/>
		);
	else return <ErrorScreen title="An unknown error occurred" />;
}

export const Routes = () => {
	const router = createBrowserRouter([
		{
			element: <RootLayout />,
			ErrorBoundary: RootErrorBoundary,
			hydrateFallbackElement: (
				<ErrorScreen
					title="Loading..."
					loader
				/>
			),
			children: [
				{
					path: "/",
					loader: async () => {
						const response = await request<void, FlightsListResponse>({
							method: "GET",
							path: "/flights/list",
							showPendingToast: false,
						});

						if (response.result === "success") return response.data;

						throw data(response.error);
					},
					element: <FlightsScreen />,
				},
				{
					path: "/flight",
					element: <Outlet />,
					children: [
						{
							path: "active",
							loader: async () => {
								const response = await request<void, ActiveFlightDataResponse>({
									method: "GET",
									path: "/flights/active",
									showPendingToast: false,
								});

								if (response.result === "success") return response.data;

								throw data(null, { status: 404 });
							},
							element: <ActiveFlightScreen />,
						},
						{
							path: ":flightId",
							loader: async ({ params }) => {
								const response = await request<FinishedFlightDataRequest, FinishedFlightDataResponse>({
									path: "/flights/details",
									data: {
										flightId: Number(params.flightId),
									},
									showPendingToast: false,
								});

								if (response.result === "success") return response.data;

								throw data(null, { status: 404 });
							},
							element: <FinishedFlightScreen />,
						},
					],
				},
			],
		},
	]);

	return <RouterProvider router={router} />;
};
