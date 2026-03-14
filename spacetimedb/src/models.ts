import { t, table } from "spacetimedb/server";

export const flights = table(
	{
		public: true,
	},
	{
		id: t.u64().primaryKey().autoInc(),
		uuid: t.uuid().unique(),
		name: t.string(),
		startedAt: t.timestamp(),
		duration: t.timeDuration().optional(),
	},
);

const packet = t.object("packet", {
	rawData: t.byteArray(),
	gps: t
		.object("gps", {
			latitude: t.f64(),
			longitude: t.f64(),
			altitude: t.f64(),
		})
		.optional(),
	velocity: t
		.object("velocity", {
			x: t.f64(),
			y: t.f64(),
			z: t.f64(),
			total: t.f64(),
		})
		.optional(),
	acceleration: t
		.object("acceleration", {
			x: t.f64(),
			y: t.f64(),
			z: t.f64(),
			total: t.f64(),
		})
		.optional(),
	orientation: t
		.object("orientation", {
			roll: t.f64(),
			pitch: t.f64(),
			yaw: t.f64(),
		})
		.optional(),
	angularVelocity: t
		.object("angularVelocity", {
			x: t.f64(),
			y: t.f64(),
			z: t.f64(),
			total: t.f64(),
		})
		.optional(),
	barometer: t.f64().optional(),
	battaryVoltage: t.f64().optional(),
	triboelectricVoltage: t.f64().optional(),
	launchDetected: t.bool().optional(),
	apogeeDetected: t.bool().optional(),
	parachuteDeployed: t.bool().optional(),
});

export const packets = table(
	{
		public: true,
	},
	{
		id: t.u64().primaryKey().autoInc(),
		flightId: t.u64().index("btree"),
		timestamp: t.timestamp(),
		data: packet,
	},
);

export const packetLossBuckets = table(
	{
		public: true,
	},
	{
		id: t.u64().primaryKey().autoInc(),
		flightId: t.u64().index("btree"),
		startTime: t.timestamp().index("btree"),
		capturedPackets: t.u16(),
		lostPackets: t.u16(),
		percentageLoss: t.u16(),
	},
);
