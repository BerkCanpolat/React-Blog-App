
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

import type {
    ErrorRequestHandler,
    RequestHandler,
} from "express";

import { env } from "./config/env";
import { AppError } from "./utils/AppError";
import authRoutes from "./modules/auth/auth.routes";
import categoriesRoutes from "./modules/categories/categories.routes";
import tagsRoutes from "./modules/tags/tags.routes";
import postsRoutes from "./modules/posts/posts.routes";
import commentsRoutes from "./modules/comments/comments.routes";
import dashboardRoutes from "./modules/admin/dashboard.routes";

export const app = express();

app.disable("x-powered-by");

if (env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}

app.use(helmet());

app.use(
    cors({
        origin: env.FRONTEND_URL,
        credentials: true,
        methods: [
            "GET",
            "POST",
            "PATCH",
            "PUT",
            "DELETE",
            "OPTIONS",
        ],
        allowedHeaders: [
            "Content-Type",
            "Authorization",
        ],
    })
);

app.use(
    express.json({
        limit: "1mb",
    })
);

app.use(
    express.urlencoded({
        extended: false,
        limit: "50kb",
    })
);

app.use(cookieParser());

app.use(
    rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 300,
        standardHeaders: "draft-8",
        legacyHeaders: false,
    })
);

app.get("/health", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "Game Blog API is running.",
    });
});

app.use("/api/auth", authRoutes);

app.use("/api/categories", categoriesRoutes);
app.use("/api/tags", tagsRoutes);
app.use("/api/posts", postsRoutes);
app.use("/api/comments", commentsRoutes);
app.use("/api/admin", dashboardRoutes);

const notFoundHandler: RequestHandler = (
    _req,
    _res,
    next
) => {
    next(
        new AppError(
            "Endpoint bulunamadı.",
            404,
            "ROUTE_NOT_FOUND"
        )
    );
};

app.use(notFoundHandler);

const errorHandler: ErrorRequestHandler = (
    error: unknown,
    _req,
    res,
    _next
) => {
    if (error instanceof AppError) {
        res.status(error.statusCode).json({
            success: false,
            error: {
                code: error.code,
                message: error.message,
            },
        });

        return;
    }

    console.error("Unhandled server error:", error);

    res.status(500).json({
        success: false,
        error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "Beklenmeyen bir sunucu hatası oluştu.",
        },
    });
};

app.use(errorHandler);