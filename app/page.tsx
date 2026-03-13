import { Button } from "@/components/ui/button";
import { fetchPeople } from "../lib/spacetimedb-server";
import { PersonList } from "./PersonList";

export default async function Home() {
	// Fetch initial data on the server
	let initialPeople: Awaited<ReturnType<typeof fetchPeople>> = [];

	try {
		initialPeople = await fetchPeople();
	} catch (error) {
		// If server-side fetch fails, the client will still work
		// This can happen if the database is not yet published
		console.error("Failed to fetch initial data:", error);
	}

	return (
		<main className="min-h-screen bg-red-400 p-4">
			<h1>SpacetimeDB Next.js App</h1>
			<Button>Test</Button>
			<PersonList initialPeople={initialPeople} />
		</main>
	);
}
