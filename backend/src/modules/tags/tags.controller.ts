
import type { Request, Response } from "express";

import { AppError } from "../../utils/AppError";
import { asyncHandler } from "../../utils/asyncHandler";

import {
    tagIdSchema,
    tagInputSchema,
} from "./tags.schema";

import {
    createTag,
    deleteTag,
    getTagBySlug,
    listTags,
    updateTag,
} from "./tags.service";

export const listTagsController = asyncHandler(
    async (_req, res: Response) => {
        res.status(200).json({
            success: true,
            data: {
                tags: listTags(),
            },
        });
    }
);

export const getTagController = asyncHandler(
    async (req: Request, res: Response) => {
        const tag = getTagBySlug(
            req.params.slug as string
        );

        res.status(200).json({
            success: true,
            data: { tag },
        });
    }
);

export const createTagController = asyncHandler(
    async (req: Request, res: Response) => {
        const parsed = tagInputSchema.safeParse(
            req.body
        );

        if (!parsed.success) {
            throw new AppError(
                "Etiket bilgileri geçersiz.",
                422,
                "VALIDATION_ERROR"
            );
        }

        const tag = createTag(parsed.data.name);

        res.status(201).json({
            success: true,
            data: { tag },
        });
    }
);

export const updateTagController = asyncHandler(
    async (req: Request, res: Response) => {
        const parsedId = tagIdSchema.safeParse({
            id: req.params.id,
        });

        const parsedBody = tagInputSchema.safeParse(
            req.body
        );

        if (!parsedId.success || !parsedBody.success) {
            throw new AppError(
                "Etiket bilgileri geçersiz.",
                422,
                "VALIDATION_ERROR"
            );
        }

        const tag = updateTag(
            parsedId.data.id,
            parsedBody.data.name
        );

        res.status(200).json({
            success: true,
            data: { tag },
        });
    }
);

export const deleteTagController = asyncHandler(
    async (req: Request, res: Response) => {
        const parsed = tagIdSchema.safeParse({
            id: req.params.id,
        });

        if (!parsed.success) {
            throw new AppError(
                "Etiket ID geçersiz.",
                422,
                "VALIDATION_ERROR"
            );
        }

        deleteTag(parsed.data.id);

        res.status(200).json({
            success: true,
            message: "Etiket silindi.",
        });
    }
);