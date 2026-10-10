
import { Router } from "express";
import { authenticate, requireAdmin } from "../../middleware/auth.middleware";
import {
    createPost,
    deletePost,
    getAdminPost,
    getAdminPosts,
    getPublicPost,
    getPublicPosts,
    updatePost,
} from "./posts.controller";
import { trackPostView } from "./views.controller";

const router = Router();

router.get("/", getPublicPosts);

// Admin route'ları /:slug rotasından önce tanımlanmalı.
router.get("/admin", authenticate, requireAdmin, getAdminPosts);
router.get("/admin/:id", authenticate, requireAdmin, getAdminPost);
router.post("/", authenticate, requireAdmin, createPost);
router.patch("/:id", authenticate, requireAdmin, updatePost);
router.delete("/:id", authenticate, requireAdmin, deletePost);

router.post("/:id/view", trackPostView);

router.get("/:slug", getPublicPost);

export default router;