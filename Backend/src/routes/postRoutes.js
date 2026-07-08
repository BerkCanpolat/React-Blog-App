const express = require("express");

const router = express.Router();

const authMiddleware =
  require("../middleware/authMiddleware");

const {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
} = require("../controllers/postController");

router.get("/", getPosts);

router.get("/:id", getPost);

router.post(
  "/",
  authMiddleware,
  createPost
);

router.put(
  "/:id",
  authMiddleware,
  updatePost
);

router.delete(
  "/:id",
  authMiddleware,
  deletePost
);

module.exports = router;