import ScreenTemplate from "@/components/ScreenTemplate";
import { FinishedFlightDataResponse } from "@try-catch/shared-types";
import { useLoaderData } from "react-router";

const FinishedFlightScreen = () => {
	const flightDetails = useLoaderData<FinishedFlightDataResponse>();

	return (
		<ScreenTemplate
			title={`Flight #${flightDetails.name}`}
			backPath="/">
			<pre>{JSON.stringify(flightDetails, null, 2)}</pre>
		</ScreenTemplate>
	);
};

export default FinishedFlightScreen;
