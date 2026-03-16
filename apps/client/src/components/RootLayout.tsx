import { Outlet } from "react-router";
import { GlobalLoader } from "./GlobalLoader";

export const RootLayout = () => {
	return (
		<main className="relative min-h-dvh w-dvw overflow-hidden">
			<GlobalLoader />
			<Outlet />
		</main>
	);
};
