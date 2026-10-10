
import type { Request, Response } from "express";
import { z } from "zod";
import { AppError } from "../../utils/AppError";
import { asyncHandler } from "../../utils/asyncHandler";
import { recordPostView } from "./views.service";

const paramsSchema = z.object({
    id: z.coerce.number().int().positive(),
});

const bodySchema = z.object({
    visitorId: z.string().uuid(),
}).strict();

export const trackPostView = asyncHandler(
    async (req: Request, res: Response) => {
        const params = paramsSchema.safeParse(req.params);
        const body = bodySchema.safeParse(req.body);

        if (!params.success || !body.success) {
            throw new AppError(
                "Görüntülenme bilgileri geçersiz.",
                400,
                "VALIDATION_ERROR"
            );
        }

        const result = recordPostView(
            params.data.id,
            body.data.visitorId
        );

        res.status(200).json({
            success: true,
            data: result,
        });
    }
);