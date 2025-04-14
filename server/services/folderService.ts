import { db } from '@db';
import { folders } from '@db/schema';
import { v4 as uuidv4 } from 'uuid';
import { eq, and, isNull } from 'drizzle-orm';

// Define standard folder categories for the system
export const STANDARD_FOLDERS = {
  EVENTS: 'Events',
  TEAMS: 'Teams',
  PLAYERS: 'Players',
  LOGOS: 'Logos',
  DOCUMENTS: 'Documents',
  RECEIPTS: 'Receipts',
  TEMPLATES: 'Templates',
  FORMS: 'Forms',
  IMAGES: 'Images',
  EXPORTS: 'Reports & Exports'
};

// Function to ensure all standard folders exist
export async function ensureStandardFolders() {
  try {
    console.log('Ensuring standard folders exist...');
    // Get existing root folders
    const existingFolders = await db
      .select()
      .from(folders);
    
    const existingFolderNames = existingFolders
      .filter(folder => folder.parentId === null)
      .map(folder => folder.name);
    
    const foldersToCreate = Object.values(STANDARD_FOLDERS)
      .filter(folderName => !existingFolderNames.includes(folderName));
    
    // Create any missing standard folders
    for (const folderName of foldersToCreate) {
      await db.insert(folders).values({
        id: uuidv4(),
        name: folderName,
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`Created standard folder: ${folderName}`);
    }
    
    // Create standard sub-folders
    await createSubFolders();
    
    console.log('Standard folders check completed');
    return true;
  } catch (error) {
    console.error('Error ensuring standard folders:', error);
    return false;
  }
}

// Create standard sub-folders within the main categories
async function createSubFolders() {
  try {
    // Find the Documents parent folder
    const [documentsFolder] = await db
      .select()
      .from(folders)
      .where(and(
        eq(folders.name, STANDARD_FOLDERS.DOCUMENTS),
        isNull(folders.parentId)
      ));
    
    if (documentsFolder) {
      // Check if Legal sub-folder exists
      const existingSubFolders = await db
        .select()
        .from(folders)
        .where(eq(folders.parentId, documentsFolder.id));
      
      const existingSubFolderNames = existingSubFolders.map(f => f.name);
      
      // Create Legal sub-folder if it doesn't exist
      if (!existingSubFolderNames.includes('Legal')) {
        await db.insert(folders).values({
          id: uuidv4(),
          name: 'Legal',
          parentId: documentsFolder.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log('Created Legal sub-folder under Documents');
      }
      
      // Create Waivers sub-folder if it doesn't exist
      if (!existingSubFolderNames.includes('Waivers')) {
        await db.insert(folders).values({
          id: uuidv4(),
          name: 'Waivers',
          parentId: documentsFolder.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log('Created Waivers sub-folder under Documents');
      }
    }
    
    // Find the Templates parent folder
    const [templatesFolder] = await db
      .select()
      .from(folders)
      .where(and(
        eq(folders.name, STANDARD_FOLDERS.TEMPLATES),
        isNull(folders.parentId)
      ));
    
    if (templatesFolder) {
      // Check if Email Templates sub-folder exists
      const existingSubFolders = await db
        .select()
        .from(folders)
        .where(eq(folders.parentId, templatesFolder.id));
      
      const existingSubFolderNames = existingSubFolders.map(f => f.name);
      
      // Create Email Templates sub-folder if it doesn't exist
      if (!existingSubFolderNames.includes('Email Templates')) {
        await db.insert(folders).values({
          id: uuidv4(),
          name: 'Email Templates',
          parentId: templatesFolder.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log('Created Email Templates sub-folder under Templates');
      }
    }
  } catch (error) {
    console.error('Error creating sub-folders:', error);
  }
}