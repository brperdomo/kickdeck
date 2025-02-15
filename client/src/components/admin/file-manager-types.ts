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
});

export type FileFormValues = z.infer<typeof fileSchema>;

export interface FileManagerProps {
  className?: string;
  onFileSelect?: (file: FileItem) => void;
  allowMultiple?: boolean;
}

export const ALLOWED_FILE_TYPES = {
  images: ['.png', '.jpg', '.jpeg', '.gif', '.svg'],
  documents: ['.txt', '.csv', '.json'],
  videos: ['.mp4', '.webm'],
};

export type FileFilter = {
  type?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  folderId?: string | null;
  search?: string;
};

export type BulkAction = 'move' | 'delete' | 'copy';

export interface FileManagerState {
  selectedFiles: Set<string>;
  currentFolder: string | null;
  filter: FileFilter;
  view: 'grid' | 'list';
}

export const folderSchema = z.object({
  name: z.string().min(1, "Folder name is required"),
  parentId: z.string().nullable().optional(),
});

export type FolderFormValues = z.infer<typeof folderSchema>;