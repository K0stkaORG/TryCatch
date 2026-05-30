import "dotenv/config";

import chalk from "chalk";
import { z } from "zod";

const loadEnv = () => {
	try {
		return z
			.object({
				NODE_ENV: z.enum(["development", "production"]).readonly().default("development"),
				DATABASE_URL: z.string().readonly(),
				SERVER_PORT: z.coerce.number().readonly().default(3000),
				EMULATED_TELEMETRY: z.coerce.boolean().readonly().default(false),
				DEV_ESP_PATH: z.string().optional().readonly(),
			})
			.parse(process.env);
	} catch (error) {
		process.stdout.write(chalk.red.bold("Failed to parse environment variables:\n"));
		process.stdout.write(z.prettifyError(error as z.ZodError) + "\n");

		process.exit(1);
	}
};

export const ENV = loadEnv();
