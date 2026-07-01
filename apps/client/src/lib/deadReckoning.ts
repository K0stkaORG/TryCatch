export const METERS_PER_DEGREE_LAT = 111_320;

export const metersPerDegreeLongitude = (latitude: number) =>
	111_320 * Math.max(0.2, Math.cos((latitude * Math.PI) / 180));

export type DeadReckoningState = {
	position: {
		latitude: number;
		longitude: number;
		altitude: number;
	};
	velocity: {
		latitude: number;
		longitude: number;
		altitude: number;
	};
};

export type DeadReckoningSample = {
	receivedAt: number;
	position: DeadReckoningState["position"];
	velocity: DeadReckoningState["velocity"];
	acceleration: DeadReckoningState["velocity"];
};

export type DeadReckoningInput = {
	position: DeadReckoningState["position"];
	velocity: DeadReckoningState["velocity"];
	acceleration: DeadReckoningState["velocity"];
	elapsedSeconds: number;
};

type AxisSample = {
	ageSeconds: number;
	value: number;
};

const estimateAcceleration = (samples: AxisSample[]) => {
	if (samples.length < 2) return 0;

	let totalWeight = 0;
	let meanTime = 0;
	let meanValue = 0;

	for (const sample of samples) {
		const weight = 1 / (1 + Math.abs(sample.ageSeconds));
		totalWeight += weight;
		meanTime += weight * sample.ageSeconds;
		meanValue += weight * sample.value;
	}

	if (totalWeight === 0) return 0;

	meanTime /= totalWeight;
	meanValue /= totalWeight;

	let numerator = 0;
	let denominator = 0;

	for (const sample of samples) {
		const weight = 1 / (1 + Math.abs(sample.ageSeconds));
		const timeOffset = sample.ageSeconds - meanTime;
		const valueOffset = sample.value - meanValue;

		numerator += weight * timeOffset * valueOffset;
		denominator += weight * timeOffset * timeOffset;
	}

	if (denominator === 0) return 0;

	return numerator / denominator;
};

export const computeDeadReckoning = ({ position, velocity, acceleration, elapsedSeconds }: DeadReckoningInput) => {
	const dt = Math.max(0, elapsedSeconds);

	const deltaLatMeters = velocity.latitude * dt + 0.5 * acceleration.latitude * dt * dt;
	const deltaLonMeters = velocity.longitude * dt + 0.5 * acceleration.longitude * dt * dt;
	const deltaAltMeters = velocity.altitude * dt + 0.5 * acceleration.altitude * dt * dt;

	const nextLatitude = position.latitude + deltaLatMeters / METERS_PER_DEGREE_LAT;
	const nextLongitude = position.longitude + deltaLonMeters / metersPerDegreeLongitude(position.latitude);
	const nextAltitude = position.altitude + deltaAltMeters;

	const nextVelocity = {
		latitude: velocity.latitude + acceleration.latitude * dt,
		longitude: velocity.longitude + acceleration.longitude * dt,
		altitude: velocity.altitude + acceleration.altitude * dt,
	};

	return {
		position: {
			latitude: nextLatitude,
			longitude: nextLongitude,
			altitude: nextAltitude,
		},
		velocity: nextVelocity,
	};
};

export const computeDeadReckoningFromHistory = (samples: DeadReckoningSample[], now: number) => {
	const validSamples = samples.filter((sample) => sample.receivedAt > 0).sort((a, b) => a.receivedAt - b.receivedAt);
	const lastSample = validSamples[validSamples.length - 1];

	if (!lastSample) {
		return null;
	}

	const ageSeconds = Math.max(0, (now - lastSample.receivedAt) / 1000);

	const timeSeries = validSamples.map((sample) => ({
		ageSeconds: (sample.receivedAt - lastSample.receivedAt) / 1000,
		sample,
	}));

	const acceleration = {
		latitude: estimateAcceleration(
			timeSeries.map((entry) => ({
				ageSeconds: entry.ageSeconds,
				value: entry.sample.velocity.latitude,
			})),
		),
		longitude: estimateAcceleration(
			timeSeries.map((entry) => ({
				ageSeconds: entry.ageSeconds,
				value: entry.sample.velocity.longitude,
			})),
		),
		altitude: estimateAcceleration(
			timeSeries.map((entry) => ({
				ageSeconds: entry.ageSeconds,
				value: entry.sample.velocity.altitude,
			})),
		),
	};

	const fallbackAcceleration = lastSample.acceleration;
	const resolvedAcceleration = {
		latitude:
			Number.isFinite(acceleration.latitude) && acceleration.latitude !== 0
				? acceleration.latitude
				: fallbackAcceleration.latitude,
		longitude:
			Number.isFinite(acceleration.longitude) && acceleration.longitude !== 0
				? acceleration.longitude
				: fallbackAcceleration.longitude,
		altitude:
			Number.isFinite(acceleration.altitude) && acceleration.altitude !== 0
				? acceleration.altitude
				: fallbackAcceleration.altitude,
	};

	return computeDeadReckoning({
		position: lastSample.position,
		velocity: lastSample.velocity,
		acceleration: resolvedAcceleration,
		elapsedSeconds: ageSeconds,
	});
};
