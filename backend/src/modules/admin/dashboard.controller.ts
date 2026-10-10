
import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { getDashboardStats } from "./dashboard.service";

export const getDashboard = asyncHandler(
    async (_req: Request, res: Response) => {
        const dashboard = getDashboardStats();

        res.status(200).json({
            success: true,
            data: dashboard,
        });
    }
);