import { ValidPacket } from "@try-catch/shared-types";

export const DEAD_RECKONING_GROUND_ALTITUDE_METERS = 403;
const MAX_DESCENT_SPEED_MPS = 5;

export type DeadReckoningState = Pick<
	ValidPacket["parsedData"],
	"position" | "velocity" | "acceleration" | "barometricAltitude"
> & {
	timestamp: number;
};

export type DeadReckoningResult = Omit<DeadReckoningState, "timestamp"> & {
	calculatedAt: Date;
	landed: boolean;
	ageMs: number;
};

export const approximateDeadReckoning = (lastKnown: DeadReckoningState): DeadReckoningResult => {
	return {
		...lastKnown,
		landed: false,
		ageMs: Date.now() - lastKnown.timestamp + MAX_DESCENT_SPEED_MPS * 0,
		calculatedAt: new Date(),
	};
};
