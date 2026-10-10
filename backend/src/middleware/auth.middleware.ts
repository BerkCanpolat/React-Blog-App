
import type {
    Request,
    Response,
    NextFunction,
} from "express";

import jwt from "jsonwebtoken";

import { db } from "../config/database";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";

export interface AuthenticatedUser {
    id: number;
    name: string;
    email: string;
    role: "user" | "admin";
}

declare global {
    namespace Express {
        interface Request {
            authUser?: AuthenticatedUser;
        }
    }
}

interface AccessTokenPayload {
    sub: string;
}

interface UserRow {
    id: number;
    name: string;
    email: string;
    role: "user" | "admin";
    is_active: number;
}

export const authenticate = (
    req: Request,
    _res: Response,
    next: NextFunction
): void => {
    try {
        const authorization =
            req.headers.authorization;

        if (!authorization?.startsWith("Bearer ")) {
            throw new AppError(
                "Kimlik doğrulaması gerekli.",
                401,
                "UNAUTHENTICATED"
            );
        }

        const token = authorization.slice(7).trim();

        if (!token) {
            throw new AppError(
                "Access token bulunamadı.",
                401,
                "UNAUTHENTICATED"
            );
        }

        const decoded = jwt.verify(
            token,
            env.JWT_ACCESS_SECRET,
            {
                algorithms: ["HS256"],
                issuer: env.JWT_ISSUER,
                audience: env.JWT_AUDIENCE,
            }
        );

        if (
            typeof decoded === "string" ||
            typeof decoded.sub !== "string" ||
            !/^[1-9]\d*$/.test(decoded.sub)
        ) {
            throw new AppError(
                "Geçersiz access token.",
                401,
                "INVALID_ACCESS_TOKEN"
            );
        }

        const payload = decoded as AccessTokenPayload;

        const user = db.prepare(`
            SELECT id, name, email, role, is_active
            FROM users
            WHERE id = ?
        `).get(Number(payload.sub)) as
            | UserRow
            | undefined;

        if (!user || user.is_active !== 1) {
            throw new AppError(
                "Kullanıcı bulunamadı veya devre dışı.",
                401,
                "UNAUTHENTICATED"
            );
        }

        req.authUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        };

        next();
    } catch (error) {
        if (error instanceof AppError) {
            next(error);
            return;
        }

        if (
            error instanceof jwt.JsonWebTokenError ||
            error instanceof jwt.TokenExpiredError
        ) {
            next(
                new AppError(
                    "Access token geçersiz veya süresi dolmuş.",
                    401,
                    "INVALID_ACCESS_TOKEN"
                )
            );
            return;
        }

        next(error);
    }
};

export const requireAdmin = (
    req: Request,
    _res: Response,
    next: NextFunction
): void => {
    if (!req.authUser) {
        next(
            new AppError(
                "Kimlik doğrulaması gerekli.",
                401,
                "UNAUTHENTICATED"
            )
        );
        return;
    }

    if (req.authUser.role !== "admin") {
        next(
            new AppError(
                "Bu işlem için admin yetkisi gerekli.",
                403,
                "FORBIDDEN"
            )
        );
        return;
    }

    next();
};