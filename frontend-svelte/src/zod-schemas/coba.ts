import * as z from "zod";

export const Player = z.object({
	name: z.string(),
	xp: z.number()
});

export const Asemik = z.object({
	mulyono: z.string()
});
