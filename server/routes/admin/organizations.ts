
import { Router } from "express";
import { db } from "@db";
import { organizationSettings } from "@db/schema";
import { eq } from "drizzle-orm";

const router = Router();

// Get all organizations
router.get("/", async (req, res) => {
  try {
    const organizations = await db
      .select()
      .from(organizationSettings)
      .orderBy(organizationSettings.name);
      
    res.json(organizations);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).send("Failed to fetch organizations");
  }
});

// Get single organization by ID
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [organization] = await db
      .select()
      .from(organizationSettings)
      .where(eq(organizationSettings.id, id))
      .limit(1);
      
    if (!organization) {
      return res.status(404).json({ error: "Organization not found" });
    }
    
    res.json(organization);
  } catch (error) {
    console.error('Error fetching organization:', error);
    res.status(500).send("Failed to fetch organization");
  }
});

// Create organization
router.post("/", async (req, res) => {
  try {
    const { name, domain, primaryColor, secondaryColor, logoUrl } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: "Organization name is required" });
    }
    
    // Check if domain is already in use
    if (domain) {
      const [existingOrg] = await db
        .select()
        .from(organizationSettings)
        .where(eq(organizationSettings.domain, domain))
        .limit(1);
        
      if (existingOrg) {
        return res.status(400).json({ error: "Domain is already in use" });
      }
    }
    
    const [organization] = await db
      .insert(organizationSettings)
      .values({
        name,
        domain,
        primaryColor: primaryColor || '#000000',
        secondaryColor: secondaryColor || '#32CD32',
        logoUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();
      
    res.status(201).json(organization);
  } catch (error) {
    console.error('Error creating organization:', error);
    res.status(500).send("Failed to create organization");
  }
});

// Update organization
router.patch("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, domain, primaryColor, secondaryColor, logoUrl } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: "Organization name is required" });
    }
    
    // Check if organization exists
    const [existingOrg] = await db
      .select()
      .from(organizationSettings)
      .where(eq(organizationSettings.id, id))
      .limit(1);
      
    if (!existingOrg) {
      return res.status(404).json({ error: "Organization not found" });
    }
    
    // Check if domain is already in use (by another org)
    if (domain && domain !== existingOrg.domain) {
      const [domainExists] = await db
        .select()
        .from(organizationSettings)
        .where(eq(organizationSettings.domain, domain))
        .limit(1);
        
      if (domainExists) {
        return res.status(400).json({ error: "Domain is already in use" });
      }
    }
    
    // Update the organization
    const [updatedOrg] = await db
      .update(organizationSettings)
      .set({
        name,
        domain,
        primaryColor: primaryColor || existingOrg.primaryColor,
        secondaryColor: secondaryColor || existingOrg.secondaryColor,
        logoUrl: logoUrl || existingOrg.logoUrl,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(organizationSettings.id, id))
      .returning();
      
    res.json(updatedOrg);
  } catch (error) {
    console.error('Error updating organization:', error);
    res.status(500).send("Failed to update organization");
  }
});

// Delete organization
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Check if organization exists
    const [existingOrg] = await db
      .select()
      .from(organizationSettings)
      .where(eq(organizationSettings.id, id))
      .limit(1);
      
    if (!existingOrg) {
      return res.status(404).json({ error: "Organization not found" });
    }
    
    // Delete the organization
    await db
      .delete(organizationSettings)
      .where(eq(organizationSettings.id, id));
      
    res.json({ message: "Organization deleted successfully" });
  } catch (error) {
    console.error('Error deleting organization:', error);
    res.status(500).send("Failed to delete organization");
  }
});

export default router;
