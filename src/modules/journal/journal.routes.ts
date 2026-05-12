import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import {
  createJournalEntryController,
  deleteJournalEntryController,
  getAllJournalEntriesController,
  getJournalEntryByIdController,
  postJournalEntryController,
} from "./journal.controller.js";

const router = Router();

router.use(authMiddleware);
router.post("/", createJournalEntryController);
router.get("/", getAllJournalEntriesController);
router.get("/:id", getJournalEntryByIdController);
router.patch("/:id/post", postJournalEntryController);
router.delete("/:id", deleteJournalEntryController);

export default router;
