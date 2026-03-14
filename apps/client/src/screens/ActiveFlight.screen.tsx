import ConfirmButton from "@/components/ConfirmButton";
import ScreenTemplate from "@/components/ScreenTemplate";
import { request } from "@/lib/server";
import { usePackets } from "@/lib/socket";
import { useCallback } from "react";
import { useNavigate } from "react-router";

const ActiveFlightScreen = () => {
	const navigate = useNavigate();

	const handleStopFlight = useCallback(
		() =>
			request<void, void>({
				path: "/flights/stop",
				onSuccess: () => navigate("/"),
			}),
		[navigate],
	);

	const packets = usePackets();

	return (
		<ScreenTemplate
			title={`Flight`}
			backPath="/">
			<div>
				<p>Packets received: {packets.length}</p>
				<ConfirmButton
					onClick={handleStopFlight}
					confirmMessage="Are you sure you want to end the flight?"
					confirmButtonText="End flight"
					cancelButtonText="Cancel">
					End flight
				</ConfirmButton>
			</div>
		</ScreenTemplate>
	);
};

export default ActiveFlightScreen;
