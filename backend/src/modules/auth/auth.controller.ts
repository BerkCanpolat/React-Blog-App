
import type {
    Request,
    Response,
} from "express";

import { AUTH_COOKIE_NAME, getRefreshCookieOptions } from "../../config/auth";
import { env } from "../../config/env";
import { AppError } from "../../utils/AppError";
import { asyncHandler } from "../../utils/asyncHandler";

import {
    getMe,
    login,
    logout,
    refresh,
    register,
} from "./auth.service";

import {
    loginSchema,
    registerSchema,
} from "./auth.schema";

const refreshCookieMaxAge =
    env.REFRESH_TOKEN_EXPIRES_IN_DAYS *
    24 * 60 * 60 * 1000;

const setRefreshCookie = (
    res: Response,
    token: string
): void => {
    res.cookie(
        AUTH_COOKIE_NAME,
        token,
        {
            ...getRefreshCookieOptions(),
            maxAge: refreshCookieMaxAge,
        }
    );
};

const clearRefreshCookie = (
    res: Response
): void => {
    res.clearCookie(
        AUTH_COOKIE_NAME,
        getRefreshCookieOptions()
    );
};

export const registerController = asyncHandler(
    async (req, res) => {
        const parsed = registerSchema.safeParse(
            req.body
        );

        if (!parsed.success) {
            throw new AppError(
                "Kayıt bilgileri geçersiz.",
                422,
                "VALIDATION_ERROR"
            );
        }

        const user = await register(parsed.data);

        res.status(201).json({
            success: true,
            data: { user },
        });
    }
);

export const loginController = asyncHandler(
    async (req, res) => {
        const parsed = loginSchema.safeParse(
            req.body
        );

        if (!parsed.success) {
            throw new AppError(
                "Giriş bilgileri geçersiz.",
                422,
                "VALIDATION_ERROR"
            );
        }

        const result = await login(parsed.data);

        setRefreshCookie(
            res,
            result.refreshToken
        );

        res.status(200).json({
            success: true,
            data: {
                accessToken: result.accessToken,
                user: result.user,
            },
        });
    }
);

export const refreshController = asyncHandler(
    async (req, res) => {
        const refreshToken = req.cookies?.[
            AUTH_COOKIE_NAME
        ] as string | undefined;

        if (!refreshToken) {
            throw new AppError(
                "Refresh token bulunamadı.",
                401,
                "MISSING_REFRESH_TOKEN"
            );
        }

        const result = refresh(refreshToken);

        setRefreshCookie(
            res,
            result.refreshToken
        );

        res.status(200).json({
            success: true,
            data: {
                accessToken: result.accessToken,
                user: result.user,
            },
        });
    }
);

export const logoutController = asyncHandler(
    async (req, res) => {
        const refreshToken = req.cookies?.[
            AUTH_COOKIE_NAME
        ] as string | undefined;

        logout(refreshToken);

        clearRefreshCookie(res);

        res.status(200).json({
            success: true,
            message: "Başarıyla çıkış yapıldı.",
        });
    }
);

export const meController = asyncHandler(
    async (req: Request, res: Response) => {
        if (!req.authUser) {
            throw new AppError(
                "Kimlik doğrulaması gerekli.",
                401,
                "UNAUTHENTICATED"
            );
        }

        const user = getMe(req.authUser.id);

        res.status(200).json({
            success: true,
            data: { user },
        });
    }
);