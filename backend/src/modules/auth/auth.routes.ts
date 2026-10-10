
import { Router } from "express";
import rateLimit from "express-rate-limit";

import { authenticate } from "../../middleware/auth.middleware";

import {
    loginController,
    logoutController,
    meController,
    refreshController,
    registerController,
} from "./auth.controller";

const router = Router();

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-8",
    legacyHeaders: false,
});

const refreshLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: "draft-8",
    legacyHeaders: false,
});

router.post(
    "/register",
    registerLimiter,
    registerController
);

router.post(
    "/login",
    loginLimiter,
    loginController
);

router.post(
    "/refresh",
    refreshLimiter,
    refreshController
);

router.post(
    "/logout",
    logoutController
);

router.get(
    "/me",
    authenticate,
    meController
);

export default router;