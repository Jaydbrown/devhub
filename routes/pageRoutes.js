// routes/devRoutes.js
import express from "express";
import { listDevelopers, getDeveloper, addComment, addReview } from "../controllers/developerController.js";
const router = express.Router();

router.get("/", listDevelopers);
router.get("/:id", getDeveloper);
router.post("/:id/comments", addComment);
router.post("/:id/reviews", addReview);

export default router;
