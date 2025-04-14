import { ensureStandardFolders } from '../services/folderService';

// Function to initialize standard folder structure on server start
export async function initializeStandardFolders() {
  try {
    console.log('Initializing standard folder structure...');
    await ensureStandardFolders();
    console.log('Standard folder structure initialized successfully');
  } catch (error) {
    console.error('Failed to initialize standard folder structure:', error);
  }
}