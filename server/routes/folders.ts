
import express from "express";
import { db } from "@db";
import { folders } from "@db/schema";
import { v4 as uuidv4 } from "uuid";
import { isAdmin } from "../middleware/auth";

const router = express.Router();

// Get all folders
router.get("/", async (req, res) => {
  try {
    const allFolders = await db.select().from(folders);
    res.json(allFolders);
  } catch (error) {
    console.error("Error fetching folders:", error);
    res.status(500).json({ error: "Failed to fetch folders" });
  }
});

// Create new folder
router.post("/", isAdmin, async (req, res) => {
  try {
    const { name, parentId } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Folder name is required" });
    }

    const folderId = uuidv4();
    const [newFolder] = await db
      .insert(folders)
      .values({
        id: folderId,
        name,
        parentId: parentId || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    res.json(newFolder);
  } catch (error) {
    console.error("Error creating folder:", error);
    res.status(500).json({ error: "Failed to create folder" });
  }
});

// Update folder
router.patch("/:id", isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, parentId } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Folder name is required" });
    }

    const [updatedFolder] = await db
      .update(folders)
      .set({
        name,
        parentId: parentId || null,
        updatedAt: new Date().toISOString(),
      })
      .where(folders.id.equals(id))
      .returning();

    if (!updatedFolder) {
      return res.status(404).json({ error: "Folder not found" });
    }

    res.json(updatedFolder);
  } catch (error) {
    console.error("Error updating folder:", error);
    res.status(500).json({ error: "Failed to update folder" });
  }
});

// Delete folder
router.delete("/:id", isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [deletedFolder] = await db
      .delete(folders)
      .where(folders.id.equals(id))
      .returning();

    if (!deletedFolder) {
      return res.status(404).json({ error: "Folder not found" });
    }

    res.json(deletedFolder);
  } catch (error) {
    console.error("Error deleting folder:", error);
    res.status(500).json({ error: "Failed to delete folder" });
  }
});

export default router;
