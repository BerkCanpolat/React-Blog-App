
import { Router } from "express";

import {
    authenticate,
    requireAdmin,
} from "../../middleware/auth.middleware";

import {
    createCategoryController,
    deleteCategoryController,
    getCategoryController,
    listCategoriesController,
    updateCategoryController,
} from "./categories.controller";

const router = Router();

router.get("/", listCategoriesController);
router.get("/slug/:slug", getCategoryController);

router.post(
    "/",
    authenticate,
    requireAdmin,
    createCategoryController
);

router.patch(
    "/:id",
    authenticate,
    requireAdmin,
    updateCategoryController
);

router.delete(
    "/:id",
    authenticate,
    requireAdmin,
    deleteCategoryController
);

export default router;