
export const AUTH_COOKIE_NAME = "game_blog_refresh";

export const getRefreshCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: (
        process.env.NODE_ENV === "production"
            ? "none"
            : "lax"
    ) as "none" | "lax",
    path: "/api/auth",
});