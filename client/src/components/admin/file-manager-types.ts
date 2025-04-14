import { z } from "zod";

export interface FileItem {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  createdAt: string;
  updatedAt: string;
  folderId?: string | null;
  thumbnailUrl?: string;
  description?: string;
  tags?: string[];
  category?: string;
  isFavorite?: boolean;
  relatedEntityId?: string;
  relatedEntityType?: string;
  metadata?: Record<string, any>;
  uploadedBy?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export const fileSchema = z.object({
  name: z.string().min(1, "File name is required"),
  file: z.instanceof(File, { message: "File is required" }),
  folderId: z.string().nullable().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  relatedEntityId: z.string().optional(),
  relatedEntityType: z.string().optional(),
});

export const fileMetadataSchema = z.object({
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  isFavorite: z.boolean().optional(),
  relatedEntityId: z.string().optional(),
  relatedEntityType: z.string().optional(),
  customMetadata: z.record(z.any()).optional(),
});

export type FileFormValues = z.infer<typeof fileSchema>;
export type FileMetadataValues = z.infer<typeof fileMetadataSchema>;

export interface FileManagerProps {
  className?: string;
  onFileSelect?: (file: FileItem) => void;
  allowMultiple?: boolean;
  defaultFolder?: string | null;
  onlyShowFolders?: boolean;
  allowedFileTypes?: string[];
  relatedEntityId?: string;
  relatedEntityType?: string;
  showFilesWithoutFolder?: boolean;
}

export const ALLOWED_FILE_TYPES = {
  images: ['.png', '.jpg', '.jpeg', '.gif', '.svg'],
  documents: ['.txt', '.csv', '.json', '.pdf', '.doc', '.docx', '.xls', '.xlsx'],
  videos: ['.mp4', '.webm', '.mov', '.avi'],
  audio: ['.mp3', '.wav', '.ogg'],
};

export const FILE_CATEGORIES = [
  'Logo',
  'Document',
  'Receipt',
  'Certificate',
  'Template',
  'Form',
  'Profile',
  'Banner',
  'Trophy',
  'Other'
];

export type FileFilter = {
  type?: string[];
  category?: string;
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  folderId?: string | null;
  search?: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  isFavorite?: boolean;
};

export type BulkAction = 'move' | 'delete' | 'copy' | 'favorite' | 'tag' | 'categorize';

export interface FileManagerState {
  selectedFiles: Set<string>;
  currentFolder: string | null;
  filter: FileFilter;
  view: 'grid' | 'list';
  sortBy: 'name' | 'date' | 'size' | 'type';
  sortDirection: 'asc' | 'desc';
}

export const folderSchema = z.object({
  name: z.string().min(1, "Folder name is required"),
  parentId: z.string().nullable().optional(),
});

export type FolderFormValues = z.infer<typeof folderSchema>;