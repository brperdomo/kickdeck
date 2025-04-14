export interface File {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  folderId: string | null;
  thumbnailUrl?: string | null;
  uploadedById?: number | null;
  description?: string | null;
  tags?: string[] | null;
  category?: string | null;
  isFavorite: boolean;
  relatedEntityId?: string | null;
  relatedEntityType?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  children?: Folder[];
  files?: File[];
}

export type FolderWithContents = Folder & {
  children: Folder[];
  files: File[];
};

export interface DragItem {
  type: 'file' | 'folder';
  id: string;
  name: string;
}

export interface FileBreadcrumb {
  id: string | null;
  name: string;
}

export type ViewMode = 'grid' | 'list';

export interface FileUploadProgress {
  id: string;
  name: string;
  progress: number;
  error?: string;
}

export type FileAction = 
  | 'open' 
  | 'download' 
  | 'rename' 
  | 'move' 
  | 'delete' 
  | 'share' 
  | 'favorite' 
  | 'unfavorite' 
  | 'properties';

export type FolderAction = 
  | 'open' 
  | 'rename' 
  | 'move' 
  | 'delete' 
  | 'share' 
  | 'properties';

export interface FileManagerContextType {
  currentFolder: Folder | null;
  breadcrumbs: FileBreadcrumb[];
  files: File[];
  folders: Folder[];
  selectedItems: (File | Folder)[];
  viewMode: ViewMode;
  isLoading: boolean;
  uploadProgress: FileUploadProgress[];
  navigateToFolder: (folderId: string | null) => void;
  createFolder: (name: string) => Promise<Folder>;
  uploadFiles: (files: FileList, folderId: string | null) => void;
  downloadFile: (fileId: string) => void;
  renameFile: (fileId: string, newName: string) => Promise<void>;
  renameFolder: (folderId: string, newName: string) => Promise<void>;
  deleteFile: (fileId: string) => Promise<void>;
  deleteFolder: (folderId: string) => Promise<void>;
  toggleFileSelection: (file: File) => void;
  toggleFolderSelection: (folder: Folder) => void;
  clearSelection: () => void;
  moveItems: (itemIds: string[], targetFolderId: string | null) => Promise<void>;
  toggleFavorite: (fileId: string) => Promise<void>;
  setViewMode: (mode: ViewMode) => void;
  refreshCurrentFolder: () => void;
}