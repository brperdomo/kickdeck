import { z } from "zod";

export interface FileItem {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  createdAt: string;
  updatedAt: string;
}

export const fileSchema = z.object({
  name: z.string().min(1, "File name is required"),
  file: z.instanceof(File, { message: "File is required" }),
});

export type FileFormValues = z.infer<typeof fileSchema>;

export interface FileManagerProps {
  className?: string;
  onFileSelect?: (file: FileItem) => void;
}

export const ALLOWED_FILE_TYPES = {
  images: ['.png', '.jpg', '.jpeg', '.gif', '.svg'],
  documents: ['.txt', '.csv', '.json'],
  videos: ['.mp4', '.webm'],
};