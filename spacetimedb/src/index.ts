import { schema, SenderError, t } from "spacetimedb/server";
import * as tables from "./models";

const spacetimedb = schema({ ...tables });
export default spacetimedb;

export const init = spacetimedb.init((_ctx) => {
	// Called when the module is initially published
});

export const onConnect = spacetimedb.clientConnected((_ctx) => {
	// Called every time a new client connects
	console.log("A client connected to SpacetimeDB");
});

export const onDisconnect = spacetimedb.clientDisconnected((_ctx) => {
	// Called every time a client disconnects
});

export const create_flight = spacetimedb.reducer({ name: t.string(), uuid: t.uuid() }, (ctx, { name, uuid }) => {
	const trimmed = name.trim();
	if (!trimmed) {
		throw new SenderError("Flight name is required.");
	}

	const existing = ctx.db.flights.uuid.find(uuid);
	if (existing) {
		throw new SenderError("Flight already exists.");
	}

	ctx.db.flights.insert({
		id: 0n,
		uuid,
		name: trimmed,
		startedAt: ctx.timestamp,
		duration: undefined,
	});
});
