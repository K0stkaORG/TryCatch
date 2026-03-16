import ConfirmButton from "@/components/ConfirmButton";
import ScreenTemplate from "@/components/ScreenTemplate";
import { request } from "@/lib/server";
import { usePackets } from "@/lib/socket";
import { ActiveFlightDataResponse } from "@try-catch/shared-types";
import { useCallback } from "react";
import { useLoaderData, useNavigate } from "react-router";

const ActiveFlightScreen = () => {
	const navigate = useNavigate();
	const flightDetails = useLoaderData<ActiveFlightDataResponse>();

	const handleStopFlight = useCallback(
		() =>
			request<void, void>({
				path: "/flights/stop",
				onSuccess: () => navigate("/"),
			}),
		[navigate],
	);

	const { connected, packets, packetLoss } = usePackets();

	return (
		<ScreenTemplate
			title="Live Flight"
			backPath="/">
			<div className="flex flex-col gap-4">
				<ConfirmButton
					onClick={handleStopFlight}
					confirmMessage="Are you sure you want to end the flight?"
					confirmButtonText="End flight"
					cancelButtonText="Cancel"
					className="gap-2"
					size="lg"
					variant="destructive">
					End flight
				</ConfirmButton>
			</div>
		</ScreenTemplate>
	);
};

export default ActiveFlightScreen;
