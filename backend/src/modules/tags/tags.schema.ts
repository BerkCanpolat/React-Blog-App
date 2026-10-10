
import { z } from "zod";

export const tagInputSchema = z.object({
    name: z.string().trim().min(2).max(40),
}).strict();

export const tagIdSchema = z.object({
    id: z.coerce.number().int().positive(),
});