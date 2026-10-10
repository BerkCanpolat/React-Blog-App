
import { Router } from "express";
import {
    authenticate,
    requireAdmin,
} from "../../middleware/auth.middleware";
import { getDashboard } from "./dashboard.controller";

const router = Router();

router.get(
    "/dashboard",
    authenticate,
    requireAdmin,
    getDashboard
);

export default router;