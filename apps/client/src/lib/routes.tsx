import { FullScreenLoader } from "@/screens/Loading.Screen";
import { Outlet, createBrowserRouter, data, isRouteErrorResponse, useRouteError } from "react-router";

import { RootLayout } from "@/components/RootLayout";
import NotFoundScreen from "@/screens/404.screen";
import ActiveFlightScreen from "@/screens/ActiveFlight.screen";
import FinishedFlightScreen from "@/screens/FinishedFlightDetails";
import FlightsScreen from "@/screens/Flights.screen";
import NewFlightScreen from "@/screens/NewFlight.screen";
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
		if (error.status === 404) return <NotFoundScreen />;

		return (
			<>
				<h1>
					{error.status} {error.statusText}
				</h1>
				<p>{error.data}</p>
			</>
		);
	} else if (error instanceof Error) {
		return (
			<div>
				<h1>Error</h1>
				<p>{error.message}</p>
				<p>The stack trace is:</p>
				<pre>{error.stack}</pre>
			</div>
		);
	} else {
		return <h1>Unknown Error</h1>;
	}
}

export const Routes = () => {
	const router = createBrowserRouter([
		{
			element: <RootLayout />,
			ErrorBoundary: RootErrorBoundary,
			hydrateFallbackElement: <FullScreenLoader />,
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
						{
							path: "new",
							element: <NewFlightScreen />,
						},
					],
				},
			],
		},
	]);

	return <RouterProvider router={router} />;
};
