import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
    NODE_ENV: z.enum([
        "development",
        "test",
        "production",
    ]),

    PORT: z.coerce.number().int().positive(),

    FRONTEND_URL: z.url(),

    DATABASE_PATH: z.string().min(1),

    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),

    JWT_ISSUER: z.string().min(1),
    JWT_AUDIENCE: z.string().min(1),

    ACCESS_TOKEN_EXPIRES_IN: z.string().min(1),

    REFRESH_TOKEN_EXPIRES_IN_DAYS:
        z.coerce.number().int().positive(),

    ADMIN_EMAIL: z.email(),
    ADMIN_PASSWORD: z.string().min(12),
    ADMIN_NAME: z.string().min(2),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
    console.error(
        "Environment configuration is invalid:"
    );

    console.error(parsedEnv.error.format());

    process.exit(1);
}

export const env = parsedEnv.data;