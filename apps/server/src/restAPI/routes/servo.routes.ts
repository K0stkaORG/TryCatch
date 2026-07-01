import { ServoCommandRequest } from "@try-catch/shared-types";
import { Router } from "express";
import { ActiveFlightHandler } from "~/lib/activeFlightHandler";
import { UserRequestError } from "~/lib/errors";
import { RouteHandler } from "../middleware/validation";

const servoRouter: Router = Router();

servoRouter.post(
	"/command",
	RouteHandler(ServoCommandRequest, async ({ bytes }): Promise<Record<string, never>> => {
		if (!ActiveFlightHandler.isActive) throw new UserRequestError("There is no active flight");

		ActiveFlightHandler.instance.sendServoCommand(bytes);

		return {};
	}),
);

export { servoRouter };
