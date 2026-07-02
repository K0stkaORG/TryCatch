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
	groundAltitude?: number;
};

export type DeadReckoningOptions = {
	groundAltitude?: number;
};

type AxisKey = keyof DeadReckoningState["velocity"];

type AxisSample = {
	ageSeconds: number;
	value: number;
};

const RECENT_HISTORY_SECONDS = 3;
const MEASURED_ACCELERATION_WEIGHT = 0.65;
const DEFAULT_GROUND_ALTITUDE = 0;

const isFiniteVector = (vector: DeadReckoningState["velocity"]) =>
	Number.isFinite(vector.latitude) && Number.isFinite(vector.longitude) && Number.isFinite(vector.altitude);

const isFinitePosition = (position: DeadReckoningState["position"]) =>
	Number.isFinite(position.latitude) &&
	Number.isFinite(position.longitude) &&
	Number.isFinite(position.altitude) &&
	Math.abs(position.latitude) <= 90 &&
	Math.abs(position.longitude) <= 180;

const recencyWeight = (ageSeconds: number) => 1 / (1 + Math.max(0, Math.abs(ageSeconds)));

const weightedAverage = (samples: AxisSample[], fallback: number) => {
	let totalWeight = 0;
	let total = 0;

	for (const sample of samples) {
		if (!Number.isFinite(sample.value)) continue;

		const weight = recencyWeight(sample.ageSeconds);
		totalWeight += weight;
		total += weight * sample.value;
	}

	return totalWeight > 0 ? total / totalWeight : fallback;
};

const estimateSlope = (samples: AxisSample[]) => {
	const finiteSamples = samples.filter((sample) => Number.isFinite(sample.value));
	if (finiteSamples.length < 2) return null;

	let totalWeight = 0;
	let meanTime = 0;
	let meanValue = 0;

	for (const sample of finiteSamples) {
		const weight = recencyWeight(sample.ageSeconds);
		totalWeight += weight;
		meanTime += weight * sample.ageSeconds;
		meanValue += weight * sample.value;
	}

	if (totalWeight === 0) return null;

	meanTime /= totalWeight;
	meanValue /= totalWeight;

	let numerator = 0;
	let denominator = 0;

	for (const sample of finiteSamples) {
		const weight = recencyWeight(sample.ageSeconds);
		const timeOffset = sample.ageSeconds - meanTime;
		const valueOffset = sample.value - meanValue;

		numerator += weight * timeOffset * valueOffset;
		denominator += weight * timeOffset * timeOffset;
	}

	return denominator > 0 ? numerator / denominator : null;
};

const axisSeries = (
	timeSeries: { ageSeconds: number; sample: DeadReckoningSample }[],
	field: "velocity" | "acceleration",
	axis: AxisKey,
) =>
	timeSeries.map((entry) => ({
		ageSeconds: entry.ageSeconds,
		value: entry.sample[field][axis],
	}));

const resolveAcceleration = (
	timeSeries: { ageSeconds: number; sample: DeadReckoningSample }[],
	lastSample: DeadReckoningSample,
	axis: AxisKey,
) => {
	const measuredAcceleration = weightedAverage(
		axisSeries(timeSeries, "acceleration", axis),
		lastSample.acceleration[axis],
	);
	const velocityTrendAcceleration = estimateSlope(axisSeries(timeSeries, "velocity", axis));

	if (velocityTrendAcceleration === null) return measuredAcceleration;

	return (
		measuredAcceleration * MEASURED_ACCELERATION_WEIGHT +
		velocityTrendAcceleration * (1 - MEASURED_ACCELERATION_WEIGHT)
	);
};

const resolveVelocity = (
	timeSeries: { ageSeconds: number; sample: DeadReckoningSample }[],
	lastSample: DeadReckoningSample,
	axis: AxisKey,
) => weightedAverage(axisSeries(timeSeries, "velocity", axis), lastSample.velocity[axis]);

const findGroundImpactTime = (
	altitude: number,
	verticalVelocity: number,
	verticalAcceleration: number,
	elapsedSeconds: number,
	groundAltitude: number,
) => {
	if (altitude <= groundAltitude) {
		return verticalVelocity <= 0 && verticalAcceleration <= 0 ? 0 : null;
	}

	const altitudeAboveGround = altitude - groundAltitude;
	const predictedAltitude =
		altitude + verticalVelocity * elapsedSeconds + 0.5 * verticalAcceleration * elapsedSeconds * elapsedSeconds;

	if (predictedAltitude > groundAltitude) return null;

	if (Math.abs(verticalAcceleration) < 1e-6) {
		if (verticalVelocity >= 0) return null;

		const impactTime = altitudeAboveGround / -verticalVelocity;
		return impactTime >= 0 && impactTime <= elapsedSeconds ? impactTime : null;
	}

	const a = 0.5 * verticalAcceleration;
	const b = verticalVelocity;
	const c = altitudeAboveGround;
	const discriminant = b * b - 4 * a * c;

	if (discriminant < 0) return null;

	const sqrtDiscriminant = Math.sqrt(discriminant);
	const roots = [(-b - sqrtDiscriminant) / (2 * a), (-b + sqrtDiscriminant) / (2 * a)]
		.filter((root) => root >= 0 && root <= elapsedSeconds)
		.sort((left, right) => left - right);

	return roots[0] ?? null;
};

export const computeDeadReckoning = ({
	position,
	velocity,
	acceleration,
	elapsedSeconds,
	groundAltitude = DEFAULT_GROUND_ALTITUDE,
}: DeadReckoningInput) => {
	const requestedDt = Math.max(0, elapsedSeconds);
	const resolvedGroundAltitude = Number.isFinite(groundAltitude) ? groundAltitude : DEFAULT_GROUND_ALTITUDE;
	const impactTime = findGroundImpactTime(
		position.altitude,
		velocity.altitude,
		acceleration.altitude,
		requestedDt,
		resolvedGroundAltitude,
	);
	const dt = impactTime ?? requestedDt;
	const landed = impactTime !== null;

	const deltaLatMeters = velocity.latitude * dt + 0.5 * acceleration.latitude * dt * dt;
	const deltaLonMeters = velocity.longitude * dt + 0.5 * acceleration.longitude * dt * dt;
	const deltaAltMeters = velocity.altitude * dt + 0.5 * acceleration.altitude * dt * dt;

	const nextLatitude = position.latitude + deltaLatMeters / METERS_PER_DEGREE_LAT;
	const meanLatitude = (position.latitude + nextLatitude) / 2;
	const nextLongitude = position.longitude + deltaLonMeters / metersPerDegreeLongitude(meanLatitude);
	const nextAltitude = landed ? resolvedGroundAltitude : position.altitude + deltaAltMeters;

	const nextVelocity = landed
		? {
				latitude: 0,
				longitude: 0,
				altitude: 0,
			}
		: {
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
		acceleration: landed
			? {
					latitude: 0,
					longitude: 0,
					altitude: 0,
				}
			: acceleration,
		landed,
		groundAltitude: resolvedGroundAltitude,
	};
};

export const computeDeadReckoningFromHistory = (
	samples: DeadReckoningSample[],
	now: number,
	options: DeadReckoningOptions = {},
) => {
	const validSamples = samples
		.filter(
			(sample) =>
				sample.receivedAt > 0 &&
				isFinitePosition(sample.position) &&
				isFiniteVector(sample.velocity) &&
				isFiniteVector(sample.acceleration),
		)
		.sort((a, b) => a.receivedAt - b.receivedAt);
	const lastSample = validSamples[validSamples.length - 1];

	if (!lastSample) {
		return null;
	}

	const ageSeconds = Math.max(0, (now - lastSample.receivedAt) / 1000);

	const timeSeries = validSamples
		.map((sample) => ({
			ageSeconds: (sample.receivedAt - lastSample.receivedAt) / 1000,
			sample,
		}))
		.filter((entry) => Math.abs(entry.ageSeconds) <= RECENT_HISTORY_SECONDS);

	const resolvedVelocity = {
		latitude: resolveVelocity(timeSeries, lastSample, "latitude"),
		longitude: resolveVelocity(timeSeries, lastSample, "longitude"),
		altitude: resolveVelocity(timeSeries, lastSample, "altitude"),
	};

	const resolvedAcceleration = {
		latitude: resolveAcceleration(timeSeries, lastSample, "latitude"),
		longitude: resolveAcceleration(timeSeries, lastSample, "longitude"),
		altitude: resolveAcceleration(timeSeries, lastSample, "altitude"),
	};

	const estimate = computeDeadReckoning({
		position: lastSample.position,
		velocity: resolvedVelocity,
		acceleration: resolvedAcceleration,
		elapsedSeconds: ageSeconds,
		groundAltitude: options.groundAltitude,
	});

	return {
		...estimate,
		acceleration: estimate.acceleration,
		lastKnown: lastSample,
		ageSeconds,
	};
};
