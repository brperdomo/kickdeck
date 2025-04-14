import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  File, 
  Folder, 
  FileManagerContextType,
  FileBreadcrumb,
  ViewMode,
  FileUploadProgress
} from './types';
import * as api from './api';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';

const FileManagerContext = createContext<FileManagerContextType | undefined>(undefined);

export const useFileManager = () => {
  const context = useContext(FileManagerContext);
  if (!context) {
    throw new Error('useFileManager must be used within a FileManagerProvider');
  }
  return context;
};

interface FileManagerProviderProps {
  children: ReactNode;
}

export const FileManagerProvider = ({ children }: FileManagerProviderProps) => {
  const { toast } = useToast();
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<FileBreadcrumb[]>([{ id: null, name: 'Home' }]);
  const [files, setFiles] = useState<File[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedItems, setSelectedItems] = useState<(File | Folder)[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress[]>([]);

  // Fetch folder contents when currentFolder changes
  useEffect(() => {
    const fetchFolderContents = async () => {
      setIsLoading(true);
      try {
        const folderId = currentFolder?.id || null;
        const { folder, subfolders, files } = await api.getFolder(folderId);
        
        // Update breadcrumbs
        const breadcrumbsData = await api.getBreadcrumbs(folderId);
        setBreadcrumbs(breadcrumbsData);
        
        if (folder) {
          setCurrentFolder(folder);
        }
        
        setFolders(subfolders);
        setFiles(files);
      } catch (error) {
        console.error('Error fetching folder contents:', error);
        toast({
          title: 'Error',
          description: 'Failed to load folder contents',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchFolderContents();
  }, [currentFolder?.id, toast]);

  const navigateToFolder = (folderId: string | null) => {
    // Clear selection when navigating
    setSelectedItems([]);
    setCurrentFolder(folderId ? { id: folderId } as Folder : null);
  };

  const createFolder = async (name: string) => {
    try {
      const newFolder = await api.createFolder(name, currentFolder?.id || null);
      setFolders([...folders, newFolder]);
      toast({
        title: 'Success',
        description: 'Folder created successfully',
      });
      return newFolder;
    } catch (error) {
      console.error('Error creating folder:', error);
      toast({
        title: 'Error',
        description: 'Failed to create folder',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const uploadFiles = async (fileList: FileList, folderId: string | null) => {
    const uploadTasks: FileUploadProgress[] = Array.from(fileList).map(file => ({
      id: uuidv4(),
      name: file.name,
      progress: 0
    }));
    
    setUploadProgress([...uploadProgress, ...uploadTasks]);
    
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const uploadTask = uploadTasks[i];
      
      try {
        const onProgress = (progress: number) => {
          setUploadProgress(prev => 
            prev.map(p => p.id === uploadTask.id ? { ...p, progress } : p)
          );
        };
        
        const uploadedFile = await api.uploadFile(file as any, folderId || currentFolder?.id || null, onProgress);
        
        // Add the new file to the list if it belongs to the current folder
        if ((folderId || currentFolder?.id) === (uploadedFile.folderId || null)) {
          setFiles(prev => [...prev, uploadedFile]);
        }
        
        // Remove from progress after completion
        setTimeout(() => {
          setUploadProgress(prev => prev.filter(p => p.id !== uploadTask.id));
        }, 1000);
        
      } catch (error) {
        console.error('Error uploading file:', error);
        setUploadProgress(prev => 
          prev.map(p => p.id === uploadTask.id 
            ? { ...p, progress: 0, error: 'Upload failed' } 
            : p
          )
        );
        
        toast({
          title: 'Upload failed',
          description: `Failed to upload ${file.name}`,
          variant: 'destructive',
        });
      }
    }
  };

  const downloadFile = (fileId: string) => {
    try {
      api.downloadFile(fileId);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: 'Error',
        description: 'Failed to download file',
        variant: 'destructive',
      });
    }
  };

  const renameFile = async (fileId: string, newName: string) => {
    try {
      const updatedFile = await api.updateFile(fileId, { name: newName });
      setFiles(files.map(file => file.id === fileId ? updatedFile : file));
      toast({
        title: 'Success',
        description: 'File renamed successfully',
      });
    } catch (error) {
      console.error('Error renaming file:', error);
      toast({
        title: 'Error',
        description: 'Failed to rename file',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const renameFolder = async (folderId: string, newName: string) => {
    try {
      const updatedFolder = await api.updateFolder(folderId, { name: newName });
      setFolders(folders.map(folder => folder.id === folderId ? updatedFolder : folder));
      toast({
        title: 'Success',
        description: 'Folder renamed successfully',
      });
    } catch (error) {
      console.error('Error renaming folder:', error);
      toast({
        title: 'Error',
        description: 'Failed to rename folder',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteFile = async (fileId: string) => {
    try {
      await api.deleteFile(fileId);
      setFiles(files.filter(file => file.id !== fileId));
      // Also remove from selection if selected
      setSelectedItems(selectedItems.filter(item => !('url' in item) || item.id !== fileId));
      toast({
        title: 'Success',
        description: 'File deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete file',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteFolder = async (folderId: string) => {
    try {
      await api.deleteFolder(folderId);
      setFolders(folders.filter(folder => folder.id !== folderId));
      // Also remove from selection if selected
      setSelectedItems(selectedItems.filter(item => ('url' in item) || item.id !== folderId));
      toast({
        title: 'Success',
        description: 'Folder deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete folder',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const toggleFileSelection = (file: File) => {
    setSelectedItems(prev => {
      const isSelected = prev.some(item => 'url' in item && item.id === file.id);
      if (isSelected) {
        return prev.filter(item => !('url' in item) || item.id !== file.id);
      } else {
        return [...prev, file];
      }
    });
  };

  const toggleFolderSelection = (folder: Folder) => {
    setSelectedItems(prev => {
      const isSelected = prev.some(item => !('url' in item) && item.id === folder.id);
      if (isSelected) {
        return prev.filter(item => ('url' in item) || item.id !== folder.id);
      } else {
        return [...prev, folder];
      }
    });
  };

  const clearSelection = () => {
    setSelectedItems([]);
  };

  const moveItems = async (itemIds: string[], targetFolderId: string | null) => {
    try {
      // Separate file IDs and folder IDs
      const fileItems = selectedItems.filter(item => 'url' in item) as File[];
      const folderItems = selectedItems.filter(item => !('url' in item)) as Folder[];
      
      const fileIds = fileItems.map(file => file.id);
      const folderIds = folderItems.map(folder => folder.id);
      
      // Move files
      if (fileIds.length > 0) {
        await api.moveFiles(fileIds, targetFolderId);
        // Remove moved files from current view
        setFiles(files.filter(file => !fileIds.includes(file.id)));
      }
      
      // Move folders (one by one)
      for (const folderId of folderIds) {
        await api.updateFolder(folderId, { parentId: targetFolderId });
      }
      
      // Remove moved folders from current view
      setFolders(folders.filter(folder => !folderIds.includes(folder.id)));
      
      // Clear selection
      clearSelection();
      
      toast({
        title: 'Success',
        description: 'Items moved successfully',
      });
    } catch (error) {
      console.error('Error moving items:', error);
      toast({
        title: 'Error',
        description: 'Failed to move items',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const toggleFavorite = async (fileId: string) => {
    try {
      const fileToToggle = files.find(f => f.id === fileId);
      if (!fileToToggle) return;
      
      const updatedFile = await api.toggleFileFavorite(fileId, !fileToToggle.isFavorite);
      setFiles(files.map(file => file.id === fileId ? updatedFile : file));
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: 'Error',
        description: 'Failed to update favorite status',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const refreshCurrentFolder = () => {
    // Reuse the effect by providing a new reference to currentFolder
    const currentFolderId = currentFolder?.id;
    setCurrentFolder(currentFolderId ? { ...currentFolder } : null);
  };

  const value: FileManagerContextType = {
    currentFolder,
    breadcrumbs,
    files,
    folders,
    selectedItems,
    viewMode,
    isLoading,
    uploadProgress,
    navigateToFolder,
    createFolder,
    uploadFiles,
    downloadFile,
    renameFile,
    renameFolder,
    deleteFile,
    deleteFolder,
    toggleFileSelection,
    toggleFolderSelection,
    clearSelection,
    moveItems,
    toggleFavorite,
    setViewMode,
    refreshCurrentFolder,
  };

  return (
    <FileManagerContext.Provider value={value}>
      {children}
    </FileManagerContext.Provider>
  );
};