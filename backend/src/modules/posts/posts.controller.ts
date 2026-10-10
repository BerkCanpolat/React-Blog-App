
import type { Request, Response } from "express";
import { AppError } from "../../utils/AppError";
import { asyncHandler } from "../../utils/asyncHandler";
import {
    adminPostQuerySchema,
    createPostSchema,
    postIdSchema,
    postSlugSchema,
    publicPostQuerySchema,
    updatePostSchema,
} from "./posts.schema";
import * as postsService from "./posts.service";

export const getPublicPosts = asyncHandler(
    async (req: Request, res: Response) => {
        const parsed = publicPostQuerySchema.safeParse(req.query);

        if (!parsed.success) {
            throw new AppError(
                "Listeleme parametreleri geçersiz.",
                400,
                "VALIDATION_ERROR"
            );
        }

        const result = postsService.listPublicPosts(parsed.data);

        res.status(200).json({
            success: true,
            data: result.items,
            pagination: result.pagination,
        });
    }
);

export const getPublicPost = asyncHandler(
    async (req: Request, res: Response) => {
        const parsed = postSlugSchema.safeParse(req.params);

        if (!parsed.success) {
            throw new AppError(
                "Yazı adresi geçersiz.",
                400,
                "VALIDATION_ERROR"
            );
        }

        const post = postsService.getPublicPostBySlug(
            parsed.data.slug
        );

        res.status(200).json({
            success: true,
            data: post,
        });
    }
);

export const getAdminPosts = asyncHandler(
    async (req: Request, res: Response) => {
        const parsed = adminPostQuerySchema.safeParse(req.query);

        if (!parsed.success) {
            throw new AppError(
                "Listeleme parametreleri geçersiz.",
                400,
                "VALIDATION_ERROR"
            );
        }

        const result = postsService.listAdminPosts(parsed.data);

        res.status(200).json({
            success: true,
            data: result.items,
            pagination: result.pagination,
        });
    }
);

export const getAdminPost = asyncHandler(
    async (req: Request, res: Response) => {
        const parsed = postIdSchema.safeParse(req.params);

        if (!parsed.success) {
            throw new AppError(
                "Yazı ID değeri geçersiz.",
                400,
                "VALIDATION_ERROR"
            );
        }

        const post = postsService.getAdminPostById(
            parsed.data.id
        );

        res.status(200).json({
            success: true,
            data: post,
        });
    }
);

export const createPost = asyncHandler(
    async (req: Request, res: Response) => {
        const parsed = createPostSchema.safeParse(req.body);

        if (!parsed.success) {
            throw new AppError(
                "Gönderilen yazı bilgileri geçersiz.",
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

        const post = postsService.createPost(
            parsed.data,
            req.authUser.id
        );

        res.status(201).json({
            success: true,
            data: post,
        });
    }
);

export const updatePost = asyncHandler(
    async (req: Request, res: Response) => {
        const params = postIdSchema.safeParse(req.params);
        const body = updatePostSchema.safeParse(req.body);

        if (!params.success || !body.success) {
            throw new AppError(
                "Yazı bilgileri geçersiz.",
                400,
                "VALIDATION_ERROR"
            );
        }

        if (Object.keys(body.data).length === 0) {
            throw new AppError(
                "Güncellenecek en az bir alan gönderilmelidir.",
                400,
                "EMPTY_UPDATE"
            );
        }

        const post = postsService.updatePost(
            params.data.id,
            body.data
        );

        res.status(200).json({
            success: true,
            data: post,
        });
    }
);

export const deletePost = asyncHandler(
    async (req: Request, res: Response) => {
        const parsed = postIdSchema.safeParse(req.params);

        if (!parsed.success) {
            throw new AppError(
                "Yazı ID değeri geçersiz.",
                400,
                "VALIDATION_ERROR"
            );
        }

        postsService.deletePost(parsed.data.id);

        res.status(200).json({
            success: true,
            message: "Blog yazısı silindi.",
        });
    }
);