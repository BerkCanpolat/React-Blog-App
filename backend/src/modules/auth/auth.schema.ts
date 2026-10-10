
import { z } from "zod";

export const registerSchema = z.object({
    name: z.string().trim().min(2).max(80),

    email: z
        .string()
        .trim()
        .email()
        .max(254)
        .transform((value) => value.toLowerCase()),

    password: z.string().min(8).max(128),
}).strict();

export const loginSchema = z.object({
    email: z
        .string()
        .trim()
        .email()
        .max(254)
        .transform((value) => value.toLowerCase()),

    password: z.string().min(1).max(128),
}).strict();

export type RegisterInput = z.infer<
    typeof registerSchema
>;

export type LoginInput = z.infer<
    typeof loginSchema
>;