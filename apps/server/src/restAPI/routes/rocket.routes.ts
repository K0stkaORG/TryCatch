import { RocketCommandRequest } from "@try-catch/shared-types";
import { Router } from "express";
import { ActiveFlightHandler } from "~/lib/activeFlightHandler";
import { UserRequestError } from "~/lib/errors";
import { logger } from "~/lib/logger";
import { RouteHandler } from "../middleware/validation";

const rocketRouter: Router = Router();

rocketRouter.post(
	"/command",
	RouteHandler(RocketCommandRequest, async ({ bytes }): Promise<Record<string, never>> => {
		if (!ActiveFlightHandler.isActive) throw new UserRequestError("There is no active flight");

		logger.info(`Sending rocket command: ${bytes.map((b) => `0x${b.toString(16).padStart(2, "0")}`).join(" ")}`);

		return {};

		ActiveFlightHandler.instance.sendRocketCommand(bytes);
	}),
);

export { rocketRouter };
