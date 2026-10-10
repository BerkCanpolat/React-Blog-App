
import { z } from "zod";

const tagIdsSchema = z
    .array(z.number().int().positive())
    .max(20)
    .default([])
    .refine(
        (ids) => new Set(ids).size === ids.length,
        "Etiketler tekrar edemez."
    );

export const createPostSchema = z.object({
    title: z.string().trim().min(3).max(180),
    excerpt: z.string().trim().min(10).max(300),
    content: z.string().trim().min(20).max(100000),
    coverImageUrl: z.union([
        z.url(),
        z.literal(""),
        z.null(),
    ]).optional().transform((value) => value || null),
    status: z.enum(["draft", "published"]).default("draft"),
    isFeatured: z.boolean().default(false),
    categoryId: z.number().int().positive(),
    tagIds: tagIdsSchema,
}).strict();

export const updatePostSchema = createPostSchema.partial();

export const postIdSchema = z.object({
    id: z.coerce.number().int().positive(),
});

export const postSlugSchema = z.object({
    slug: z.string().trim().min(1).max(220),
});

export const publicPostQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    search: z.string().trim().max(100).optional(),
    category: z.string().trim().max(60).optional(),
    tag: z.string().trim().max(60).optional(),
    sort: z.enum([
        "newest",
        "oldest",
        "popular",
    ]).default("newest"),
});

export const adminPostQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    search: z.string().trim().max(100).optional(),
    status: z.enum(["draft", "published"]).optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;