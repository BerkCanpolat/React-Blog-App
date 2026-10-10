
import { Router } from "express";
import {
    authenticate,
    requireAdmin,
} from "../../middleware/auth.middleware";
import {
    createComment,
    deleteComment,
    getAdminComments,
    getPostComments,
    updateComment,
} from "./comments.controller";

const router = Router();

router.get("/", getPostComments);
router.get("/admin", authenticate, requireAdmin, getAdminComments);
router.post("/", authenticate, createComment);
router.patch("/:id", authenticate, updateComment);
router.delete("/:id", authenticate, deleteComment);

export default router;