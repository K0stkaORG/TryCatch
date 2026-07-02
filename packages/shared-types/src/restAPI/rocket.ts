import z from "zod";

export const RocketCommandRequest = z.object({
	bytes: z.array(z.number().int().min(0).max(255)).length(4),
});

export type RocketCommandRequest = z.infer<typeof RocketCommandRequest>;
