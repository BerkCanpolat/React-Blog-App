
import type { Request, Response } from "express";
import { AppError } from "../../utils/AppError";
import { asyncHandler } from "../../utils/asyncHandler";
import {
    commentIdSchema,
    commentListQuerySchema,
    createCommentSchema,
    updateCommentSchema,
} from "./comments.schema";
import * as commentsService from "./comments.service";

export const getPostComments = asyncHandler(
    async (req: Request, res: Response) => {
        const parsed = commentListQuerySchema.safeParse(req.query);

        if (!parsed.success || !parsed.data.postId) {
            throw new AppError(
                "Geçerli bir postId parametresi gereklidir.",
                400,
                "VALIDATION_ERROR"
            );
        }

        const result = commentsService.listPostComments(
            parsed.data.postId,
            parsed.data
        );

        res.status(200).json({
            success: true,
            data: result.items,
            pagination: result.pagination,
        });
    }
);

export const getAdminComments = asyncHandler(
    async (req: Request, res: Response) => {
        const parsed = commentListQuerySchema.safeParse(req.query);

        if (!parsed.success) {
            throw new AppError(
                "Listeleme parametreleri geçersiz.",
                400,
                "VALIDATION_ERROR"
            );
        }

        const result = commentsService.listAdminComments(
            parsed.data
        );

        res.status(200).json({
            success: true,
            data: result.items,
            pagination: result.pagination,
        });
    }
);

export const createComment = asyncHandler(
    async (req: Request, res: Response) => {
        const parsed = createCommentSchema.safeParse(req.body);

        if (!parsed.success) {
            throw new AppError(
                "Yorum bilgileri geçersiz.",
                400,
                "VALIDATION_ERROR"
            );
        }

        if (!req.authUser) {
            throw new AppError(
                "Kimlik doğrulaması gerekli.",
                401,
                "UNAUTHENTICATED"
            );
        }

        const comment = commentsService.createComment(
            parsed.data.content,
            parsed.data.postId,
            req.authUser.id
        );

        res.status(201).json({
            success: true,
            data: comment,
        });
    }
);

export const updateComment = asyncHandler(
    async (req: Request, res: Response) => {
        const params = commentIdSchema.safeParse(req.params);
        const body = updateCommentSchema.safeParse(req.body);

        if (!params.success || !body.success) {
            throw new AppError(
                "Yorum bilgileri geçersiz.",
                400,
                "VALIDATION_ERROR"
            );
        }

        if (!req.authUser) {
            throw new AppError(
                "Kimlik doğrulaması gerekli.",
                401,
                "UNAUTHENTICATED"
            );
        }

        const comment = commentsService.updateComment(
            params.data.id,
            body.data.content,
            req.authUser.id,
            req.authUser.role === "admin"
        );

        res.status(200).json({
            success: true,
            data: comment,
        });
    }
);

export const deleteComment = asyncHandler(
    async (req: Request, res: Response) => {
        const parsed = commentIdSchema.safeParse(req.params);

        if (!parsed.success) {
            throw new AppError(
                "Yorum ID değeri geçersiz.",
                400,
                "VALIDATION_ERROR"
            );
        }

        if (!req.authUser) {
            throw new AppError(
                "Kimlik doğrulaması gerekli.",
                401,
                "UNAUTHENTICATED"
            );
        }

        commentsService.deleteComment(
            parsed.data.id,
            req.authUser.id,
            req.authUser.role === "admin"
        );

        res.status(200).json({
            success: true,
            message: "Yorum silindi.",
        });
    }
);