
import { Router } from "express";

import {
    authenticate,
    requireAdmin,
} from "../../middleware/auth.middleware";

import {
    createTagController,
    deleteTagController,
    getTagController,
    listTagsController,
    updateTagController,
} from "./tags.controller";

const router = Router();

router.get("/", listTagsController);
router.get("/slug/:slug", getTagController);

router.post(
    "/",
    authenticate,
    requireAdmin,
    createTagController
);

router.patch(
    "/:id",
    authenticate,
    requireAdmin,
    updateTagController
);

router.delete(
    "/:id",
    authenticate,
    requireAdmin,
    deleteTagController
);

export default router;