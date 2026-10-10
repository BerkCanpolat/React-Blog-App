
import { z } from "zod";

export const categoryInputSchema = z.object({
    name: z.string().trim().min(2).max(50),
}).strict();

export const categoryIdSchema = z.object({
    id: z.coerce.number().int().positive(),
});