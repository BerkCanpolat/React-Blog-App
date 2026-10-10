
import { z } from "zod";

export const createCommentSchema = z.object({
    content: z.string().trim().min(2).max(3000),
    postId: z.number().int().positive(),
}).strict();

export const updateCommentSchema = z.object({
    content: z.string().trim().min(2).max(3000),
}).strict();

export const commentIdSchema = z.object({
    id: z.coerce.number().int().positive(),
});

export const commentListQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    postId: z.coerce.number().int().positive().optional(),
});