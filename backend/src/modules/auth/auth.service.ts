
import {
    createHash,
    randomBytes,
} from "node:crypto";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { db } from "../../config/database";
import { env } from "../../config/env";
import { AppError } from "../../utils/AppError";

import type {
    LoginInput,
    RegisterInput,
} from "./auth.schema";

type UserRole = "user" | "admin";

interface UserRow {
    id: number;
    name: string;
    email: string;
    password_hash: string;
    role: UserRole;
    is_active: number;
    created_at: string;
}

interface PublicUser {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    createdAt: string;
}

interface RefreshSessionRow {
    id: number;
    user_id: number;
    token_hash: string;
    expires_at: string;
    revoked_at: string | null;
}

interface AuthResult {
    accessToken: string;
    refreshToken: string;
    user: PublicUser;
}

const hashRefreshToken = (token: string): string => {
    return createHash("sha256")
        .update(token)
        .digest("hex");
};

const createRefreshToken = (): string => {
    return randomBytes(48).toString("base64url");
};

const toPublicUser = (
    user: UserRow
): PublicUser => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.created_at,
});

const findUserById = (
    id: number
): UserRow | undefined => {
    return db.prepare(`
        SELECT
            id,
            name,
            email,
            password_hash,
            role,
            is_active,
            created_at
        FROM users
        WHERE id = ?
    `).get(id) as UserRow | undefined;
};

const createAccessToken = (
    user: UserRow
): string => {
    return jwt.sign(
        {},
        env.JWT_ACCESS_SECRET,
        {
            algorithm: "HS256",
            subject: String(user.id),
            issuer: env.JWT_ISSUER,
            audience: env.JWT_AUDIENCE,
            expiresIn:
                env.ACCESS_TOKEN_EXPIRES_IN as jwt.SignOptions["expiresIn"],
        }
    );
};

const createRefreshSession = (
    userId: number
): string => {
    const refreshToken = createRefreshToken();

    const expiresAt = new Date(
        Date.now() +
        env.REFRESH_TOKEN_EXPIRES_IN_DAYS *
            24 * 60 * 60 * 1000
    ).toISOString();

    db.prepare(`
        INSERT INTO refresh_sessions (
            user_id,
            token_hash,
            expires_at
        )
        VALUES (?, ?, ?)
    `).run(
        userId,
        hashRefreshToken(refreshToken),
        expiresAt
    );

    return refreshToken;
};

const createAuthResult = (
    user: UserRow
): AuthResult => {
    return {
        accessToken: createAccessToken(user),
        refreshToken: createRefreshSession(user.id),
        user: toPublicUser(user),
    };
};

export const register = async (
    input: RegisterInput
): Promise<PublicUser> => {
    const passwordHash = await bcrypt.hash(
        input.password,
        12
    );

    try {
        const result = db.prepare(`
            INSERT INTO users (
                name,
                email,
                password_hash,
                role
            )
            VALUES (?, ?, ?, 'user')
        `).run(
            input.name,
            input.email,
            passwordHash
        );

        const user = findUserById(
            Number(result.lastInsertRowid)
        );

        if (!user) {
            throw new AppError(
                "Kullanıcı oluşturulamadı.",
                500,
                "USER_CREATION_FAILED"
            );
        }

        return toPublicUser(user);
    } catch (error) {
        if (
            error instanceof Error &&
            "code" in error &&
            error.code === "SQLITE_CONSTRAINT_UNIQUE"
        ) {
            throw new AppError(
                "Bu e-posta adresi zaten kayıtlı.",
                409,
                "EMAIL_ALREADY_EXISTS"
            );
        }

        throw error;
    }
};

export const login = async (
    input: LoginInput
): Promise<AuthResult> => {
    const user = db.prepare(`
        SELECT
            id,
            name,
            email,
            password_hash,
            role,
            is_active,
            created_at
        FROM users
        WHERE email = ?
    `).get(input.email) as UserRow | undefined;

    if (!user) {
        throw new AppError(
            "E-posta veya şifre hatalı.",
            401,
            "INVALID_CREDENTIALS"
        );
    }

    const passwordMatches = await bcrypt.compare(
        input.password,
        user.password_hash
    );

    if (
        !passwordMatches ||
        user.is_active !== 1
    ) {
        throw new AppError(
            "E-posta veya şifre hatalı.",
            401,
            "INVALID_CREDENTIALS"
        );
    }

    return createAuthResult(user);
};

export const refresh = (
    rawRefreshToken: string
): AuthResult => {
    const tokenHash = hashRefreshToken(
        rawRefreshToken
    );

    const session = db.prepare(`
        SELECT
            id,
            user_id,
            token_hash,
            expires_at,
            revoked_at
        FROM refresh_sessions
        WHERE token_hash = ?
    `).get(tokenHash) as
        | RefreshSessionRow
        | undefined;

    if (!session) {
        throw new AppError(
            "Refresh token geçersiz.",
            401,
            "INVALID_REFRESH_TOKEN"
        );
    }

    if (session.revoked_at) {
        db.prepare(`
            UPDATE refresh_sessions
            SET revoked_at = COALESCE(
                revoked_at,
                CURRENT_TIMESTAMP
            )
            WHERE user_id = ?
        `).run(session.user_id);

        throw new AppError(
            "Refresh token daha önce kullanılmış veya iptal edilmiş.",
            401,
            "REFRESH_TOKEN_REVOKED"
        );
    }

    if (
        new Date(session.expires_at).getTime() <=
        Date.now()
    ) {
        db.prepare(`
            UPDATE refresh_sessions
            SET revoked_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(session.id);

        throw new AppError(
            "Oturumun süresi dolmuş. Tekrar giriş yap.",
            401,
            "REFRESH_TOKEN_EXPIRED"
        );
    }

    const user = findUserById(session.user_id);

    if (!user || user.is_active !== 1) {
        db.prepare(`
            UPDATE refresh_sessions
            SET revoked_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
        `).run(session.user_id);

        throw new AppError(
            "Kullanıcı bulunamadı veya devre dışı.",
            401,
            "UNAUTHENTICATED"
        );
    }

    const newRefreshToken = createRefreshToken();

    const newExpiresAt = new Date(
        Date.now() +
        env.REFRESH_TOKEN_EXPIRES_IN_DAYS *
            24 * 60 * 60 * 1000
    ).toISOString();

    const rotateSession = db.transaction(() => {
        const updateResult = db.prepare(`
            UPDATE refresh_sessions
            SET revoked_at = CURRENT_TIMESTAMP
            WHERE id = ?
              AND revoked_at IS NULL
        `).run(session.id);

        if (updateResult.changes !== 1) {
            throw new AppError(
                "Oturum yenilenemedi.",
                401,
                "REFRESH_TOKEN_REVOKED"
            );
        }

        db.prepare(`
            INSERT INTO refresh_sessions (
                user_id,
                token_hash,
                expires_at
            )
            VALUES (?, ?, ?)
        `).run(
            user.id,
            hashRefreshToken(newRefreshToken),
            newExpiresAt
        );
    });

    rotateSession();

    return {
        accessToken: createAccessToken(user),
        refreshToken: newRefreshToken,
        user: toPublicUser(user),
    };
};

export const logout = (
    rawRefreshToken?: string
): void => {
    if (!rawRefreshToken) {
        return;
    }

    db.prepare(`
        UPDATE refresh_sessions
        SET revoked_at = CURRENT_TIMESTAMP
        WHERE token_hash = ?
          AND revoked_at IS NULL
    `).run(hashRefreshToken(rawRefreshToken));
};

export const getMe = (
    userId: number
): PublicUser => {
    const user = findUserById(userId);

    if (!user || user.is_active !== 1) {
        throw new AppError(
            "Kullanıcı bulunamadı.",
            404,
            "USER_NOT_FOUND"
        );
    }

    return toPublicUser(user);
};