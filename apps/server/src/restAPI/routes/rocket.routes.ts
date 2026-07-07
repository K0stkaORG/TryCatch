import { RocketCommandRequest } from "@try-catch/shared-types";
import { Router } from "express";
import { ActiveFlightHandler } from "~/lib/activeFlightHandler";
import { UserRequestError } from "~/lib/errors";
import { RouteHandler } from "../middleware/validation";

const rocketRouter: Router = Router();

rocketRouter.post(
	"/command",
	RouteHandler(RocketCommandRequest, async ({ bytes }): Promise<Record<string, never>> => {
		if (!ActiveFlightHandler.isActive) throw new UserRequestError("There is no active flight");

		ActiveFlightHandler.instance.sendRocketCommand(bytes);

		return {};
	}),
);

export { rocketRouter };
