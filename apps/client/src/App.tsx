import { Toaster } from "./components/ui/sonner";
import { Routes } from "./lib/routes";

function App() {
	return (
		<>
			<Routes />
			<Toaster
				richColors
				closeButton
				position="top-right"
			/>
		</>
	);
}

export default App;
