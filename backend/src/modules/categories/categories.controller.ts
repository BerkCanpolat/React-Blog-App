
import type { Request, Response } from "express";

import { AppError } from "../../utils/AppError";
import { asyncHandler } from "../../utils/asyncHandler";

import {
    categoryIdSchema,
    categoryInputSchema,
} from "./categories.schema";

import {
    createCategory,
    deleteCategory,
    getCategoryBySlug,
    listCategories,
    updateCategory,
} from "./categories.service";

export const listCategoriesController = asyncHandler(
    async (_req, res: Response) => {
        res.status(200).json({
            success: true,
            data: {
                categories: listCategories(),
            },
        });
    }
);

export const getCategoryController = asyncHandler(
    async (req: Request, res: Response) => {
        const category = getCategoryBySlug(
            req.params.slug as string
        );

        res.status(200).json({
            success: true,
            data: { category },
        });
    }
);

export const createCategoryController = asyncHandler(
    async (req: Request, res: Response) => {
        const parsed = categoryInputSchema.safeParse(
            req.body
        );

        if (!parsed.success) {
            throw new AppError(
                "Kategori bilgileri geçersiz.",
                422,
                "VALIDATION_ERROR"
            );
        }

        const category = createCategory(
            parsed.data.name
        );

        res.status(201).json({
            success: true,
            data: { category },
        });
    }
);

export const updateCategoryController = asyncHandler(
    async (req: Request, res: Response) => {
        const parsedId = categoryIdSchema.safeParse({
            id: req.params.id,
        });

        const parsedBody = categoryInputSchema.safeParse(
            req.body
        );

        if (!parsedId.success || !parsedBody.success) {
            throw new AppError(
                "Kategori bilgileri geçersiz.",
                422,
                "VALIDATION_ERROR"
            );
        }

        const category = updateCategory(
            parsedId.data.id,
            parsedBody.data.name
        );

        res.status(200).json({
            success: true,
            data: { category },
        });
    }
);

export const deleteCategoryController = asyncHandler(
    async (req: Request, res: Response) => {
        const parsed = categoryIdSchema.safeParse({
            id: req.params.id,
        });

        if (!parsed.success) {
            throw new AppError(
                "Kategori ID geçersiz.",
                422,
                "VALIDATION_ERROR"
            );
        }

        deleteCategory(parsed.data.id);

        res.status(200).json({
            success: true,
            message: "Kategori silindi.",
        });
    }
);