import z from "zod";

const STOW_BYTES = [0x47, 0x43, 0x55, 0x00] as const;
const DEPLOY_BYTES = [0x47, 0x43, 0xaa, 0x00] as const;

export const ServoCommandRequest = z
	.object({
		bytes: z.array(z.number().int().min(0).max(255)).length(4),
	})
	.refine(({ bytes }) => {
		const isStow = bytes.every((byte, index) => byte === STOW_BYTES[index]);
		const isDeploy = bytes.every((byte, index) => byte === DEPLOY_BYTES[index]);
		return isStow || isDeploy;
	}, "Invalid servo command bytes");

export type ServoCommandRequest = z.infer<typeof ServoCommandRequest>;
